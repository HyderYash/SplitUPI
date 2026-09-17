import { expect, test, type Page } from "@playwright/test";
import type { PaymentSession } from "../../lib/types";

async function fillMerchant(page: Page) {
  await page.getByLabel("Merchant name", { exact: true }).fill("Test Bistro");
  await page
    .getByLabel("Merchant UPI ID", { exact: false })
    .fill("test-bistro@upi");
  await page.getByLabel("Invoice", { exact: false }).fill("TABLE-QA");
}

function previewAmounts(page: Page) {
  return page
    .getByRole("list", { name: "Individual payment amounts" })
    .locator("li > strong");
}

async function savedSessions(page: Page): Promise<PaymentSession[]> {
  return page.evaluate(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith("splitupi:session:"))
      .map((key) => JSON.parse(localStorage.getItem(key)!)),
  );
}

test("amount split previews the remainder and persists a real session", async ({
  page,
}) => {
  await page.goto("/create");
  await expect(previewAmounts(page)).toHaveText(["₹2,000", "₹2,000", "₹2,000"]);
  await fillMerchant(page);
  await page.getByLabel("Total bill amount", { exact: true }).fill("5500");
  await expect(previewAmounts(page)).toHaveText(["₹2,000", "₹2,000", "₹1,500"]);
  await page
    .getByRole("button", { name: "Split payment", exact: true })
    .click();
  await page.waitForURL(/\/session\/session_/);
  const sessions = await savedSessions(page);
  expect(sessions).toHaveLength(1);
  expect(sessions[0]).toMatchObject({
    merchantName: "Test Bistro",
    vpa: "test-bistro@upi",
    totalPaise: 550000,
    invoice: "TABLE-QA",
    isDemo: false,
  });
  expect(sessions[0].payments.map((payment) => payment.amountPaise)).toEqual([
    200000, 200000, 150000,
  ]);
  expect(
    sessions[0].payments.every((payment) => payment.status === "pending"),
  ).toBe(true);
  await page.reload();
  expect(await savedSessions(page)).toEqual(sessions);
});

test("equal splitting distributes the last paisa and validates the count", async ({
  page,
}) => {
  await page.goto("/create");
  await page.getByLabel("Total bill amount", { exact: true }).fill("10.01");
  await page.getByRole("button", { name: /^Equal split/ }).click();
  await expect(previewAmounts(page)).toHaveText(["₹3.34", "₹3.34", "₹3.33"]);
  await page.getByLabel("Number of payments", { exact: true }).fill("101");
  await expect(page.getByRole("status")).toHaveText(
    /whole number of payments from 1 to 100/,
  );
  await expect(
    page.getByRole("button", { name: "Split payment", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Number of payments", { exact: true }).fill("2");
  await expect(previewAmounts(page)).toHaveText(["₹5.01", "₹5"]);
  await fillMerchant(page);
  await page
    .getByRole("button", { name: "Split payment", exact: true })
    .click();
  await page.waitForURL(/\/session\/session_/);
  expect(
    (await savedSessions(page))[0].payments.map(
      (payment) => payment.amountPaise,
    ),
  ).toEqual([501, 500]);
});

test("custom decimal splits enforce exact totals and support adding and removing rows", async ({
  page,
}) => {
  await page.goto("/create");
  await page.getByLabel("Total bill amount", { exact: true }).fill("0.30");
  await page.getByRole("button", { name: /^Custom/ }).click();
  await page
    .getByRole("button", { name: "Remove payment 3", exact: true })
    .click();
  await page.getByLabel("Payment 01", { exact: true }).fill("0.10");
  await page.getByLabel("Payment 02", { exact: true }).fill("0.19");
  await expect(page.getByRole("status")).toHaveText(
    /must add up to the total bill/,
  );
  await expect(
    page.getByRole("button", { name: "Split payment", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Payment 02", { exact: true }).fill("0.20");
  await expect(previewAmounts(page)).toHaveText(["₹0.10", "₹0.20"]);
  await page
    .getByRole("button", { name: "Add another payment", exact: true })
    .click();
  await page.getByLabel("Payment 03", { exact: true }).fill("0.00");
  await expect(
    page.getByRole("button", { name: "Split payment", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Remove payment 3", exact: true })
    .click();
  await fillMerchant(page);
  await page
    .getByRole("button", { name: "Split payment", exact: true })
    .click();
  await page.waitForURL(/\/session\/session_/);
  const session = (await savedSessions(page))[0];
  expect(session.totalPaise).toBe(30);
  expect(session.payments.map((payment) => payment.amountPaise)).toEqual([
    10, 20,
  ]);
});

test("invalid and demo VPAs cannot create a real session", async ({ page }) => {
  await page.goto("/create?demo=true");
  await expect(page.getByLabel("Merchant name", { exact: true })).toHaveValue(
    "The Bombay Bistro",
  );
  await expect(page.getByLabel("Invoice", { exact: false })).toHaveValue(
    "TABLE-42",
  );
  const vpa = page.getByLabel("Merchant UPI ID", { exact: false });
  await expect(vpa).toHaveValue("");
  await vpa.fill("not a vpa");
  await page
    .getByRole("button", { name: "Split payment", exact: true })
    .click();
  await expect(
    page.getByText("Enter a UPI ID in the format name@bank.", { exact: true }),
  ).toBeVisible();
  await expect(vpa).toBeFocused();
  await vpa.fill("demo@upi");
  await page
    .getByRole("button", { name: "Split payment", exact: true })
    .click();
  await expect(page.getByText(/Use your real merchant UPI ID/)).toBeVisible();
  expect(await savedSessions(page)).toHaveLength(0);
});

test("storage failure stays on setup and exposes a recoverable error", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException(
        "Storage unavailable for test",
        "QuotaExceededError",
      );
    };
  });
  await page.goto("/create");
  await fillMerchant(page);
  await page
    .getByRole("button", { name: "Split payment", exact: true })
    .click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Your browser could not save or read this session.",
  );
  await expect(page).toHaveURL(/\/create$/);
  await expect(
    page.getByRole("button", { name: "Split payment", exact: true }),
  ).toBeEnabled();
  expect(await savedSessions(page)).toHaveLength(0);
});

test("small mobile view has no overflow and the dark theme survives refresh", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/create");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .getByRole("button", { name: "Toggle color theme", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  for (const strategy of ["By amount", "Equal split", "Custom"]) {
    await page
      .getByRole("button", { name: new RegExp(`^${strategy}`) })
      .click();
    const dimensions = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(
      dimensions.content,
      `${strategy} must fit a 320px viewport`,
    ).toBeLessThanOrEqual(dimensions.viewport);
  }
  await page.getByRole("button", { name: /^By amount/ }).click();
  await page.screenshot({
    path: testInfo.outputPath("create-mobile-dark.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Toggle color theme", exact: true })
    .click();
  await page.screenshot({
    path: testInfo.outputPath("create-mobile-light.png"),
    fullPage: true,
    animations: "disabled",
  });
});
