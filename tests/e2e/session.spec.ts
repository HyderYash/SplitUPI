import { expect, test, type Page } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import sharp from "sharp";
import { buildUpiUrl } from "../../lib/upi";
import type { PaymentSession } from "../../lib/types";

async function startDemo(page: Page): Promise<string> {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Start live demo", exact: true })
    .click();
  await page.waitForURL(/\/session\/session_/);
  await expect(page.getByTestId("payment-1")).toBeVisible();
  return page.url().split("/").at(-1)!;
}

async function readSession(page: Page, id: string): Promise<PaymentSession> {
  return page.evaluate(
    (sessionId) =>
      JSON.parse(localStorage.getItem(`splitupi:session:${sessionId}`)!),
    id,
  );
}

async function confirmPayment(page: Page, number: number) {
  const card = page.getByTestId(`payment-${number}`);
  await card
    .getByRole("button", { name: "Payment completed", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Confirm this payment",
    exact: true,
  });
  await expect(dialog).toContainText("Demo confirmation — not bank-verified.");
  await dialog
    .getByRole("button", { name: "Yes, mark paid", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(card).toContainText("Paid · manual");
}

async function decodeVisibleQr(page: Page): Promise<string> {
  const image = page.getByTestId("payment-qr").locator("svg");
  await expect(image).toBeVisible();
  const actualSvg = await image.evaluate((element) => element.outerHTML);
  const pngBuffer = await sharp(Buffer.from(actualSvg))
    .resize(960, 960, { kernel: "nearest" })
    .png()
    .toBuffer();
  const png = PNG.sync.read(pngBuffer);
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  expect(
    result,
    "The browser's rendered QR must independently decode",
  ).not.toBeNull();
  return result!.data;
}

test("demo QR is non-payable, app launching is disabled, and the modal traps and restores focus", async ({
  page,
}, testInfo) => {
  const id = await startDemo(page);
  await expect(
    page.getByText("Live demo. No money moves.", { exact: true }),
  ).toBeVisible();
  const first = page.getByTestId("payment-1");
  await expect(
    first.getByRole("button", { name: "Open UPI App", exact: true }),
  ).toBeDisabled();
  await expect(
    page
      .getByTestId("payment-2")
      .getByRole("button", { name: "Show QR", exact: true }),
  ).toBeDisabled();
  const trigger = first.getByRole("button", { name: "Show QR", exact: true });
  await trigger.focus();
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Demo QR · no payment",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Open UPI App", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "Close dialog", exact: true }),
  ).toBeFocused();
  const payload = await decodeVisibleQr(page);
  expect(payload).toContain("SplitUPI demo only — no payment.");
  expect(payload).not.toMatch(/^upi:/i);
  expect(payload).toContain("₹2,000");
  await dialog
    .getByRole("button", { name: "Back to payments", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Close dialog", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Back to payments", exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: testInfo.outputPath("demo-qr-modal.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(
    (await readSession(page, id)).payments.every(
      (payment) => payment.status === "pending",
    ),
  ).toBe(true);
});

test("the full sequential demo persists manual progress, produces a printable receipt, and shares only a fresh demo URL", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    const state = window as typeof window & {
      __copied: string[];
      __printed: boolean;
    };
    state.__copied = [];
    state.__printed = false;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          state.__copied.push(text);
        },
      },
    });
    window.print = () => {
      state.__printed = true;
    };
  });
  const id = await startDemo(page);
  await confirmPayment(page, 1);
  await expect(
    page.getByRole("progressbar", { name: "Manually confirmed payments" }),
  ).toHaveAttribute("aria-valuenow", "200000");
  await expect(page.getByTestId("payment-1").getByRole("button")).toHaveCount(
    0,
  );
  await expect(
    page
      .getByTestId("payment-2")
      .getByRole("button", { name: "Payment completed", exact: true }),
  ).toBeEnabled();
  await expect(
    page
      .getByTestId("payment-3")
      .getByRole("button", { name: "Payment completed", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.getByTestId("payment-1")).toContainText("Paid · manual");
  expect((await readSession(page, id)).payments[0].paidAt).toBeTruthy();
  await page.goto(`/receipt/${id}`);
  await expect(
    page.getByRole("heading", { name: "A few requests to go.", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Back to payments", exact: true })
    .click();
  await confirmPayment(page, 2);
  await confirmPayment(page, 3);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "600000",
  );
  await expect(
    page.getByRole("checkbox", { name: "Parallel payments", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "View receipt", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/receipt/${id}$`));
  await expect(
    page.getByRole("heading", { name: "₹6,000 collected", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Sample demo · no money moved", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".receipt-row")).toHaveCount(3);
  await expect(page.locator(".receipt-notice")).toContainText(
    "No payment was initiated.",
  );
  await page
    .getByRole("button", { name: "Copy demo link", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Demo link copied", exact: true }),
  ).toBeVisible();
  const copied = await page.evaluate(
    () => (window as typeof window & { __copied: string[] }).__copied,
  );
  expect(copied).toEqual([`${new URL(page.url()).origin}/demo`]);
  expect(copied[0]).not.toContain(id);
  expect(copied[0]).not.toContain("TABLE-42");
  await page
    .getByRole("button", { name: "Download receipt", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => (window as typeof window & { __printed: boolean }).__printed,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("complete-receipt.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.emulateMedia({ media: "print" });
  await page.screenshot({
    path: testInfo.outputPath("print-receipt.png"),
    fullPage: true,
    animations: "disabled",
  });
  await expect(page.locator(".receipt-paper")).toBeVisible();
  await expect(page.locator(".receipt-actions")).not.toBeVisible();
  await expect(page.locator(".share-card")).not.toBeVisible();
  await expect(page.locator(".site-header")).not.toBeVisible();
  await expect(page.locator(".receipt-notice")).toBeVisible();
  if (testInfo.project.name === "desktop-chromium") {
    await page.pdf({
      path: testInfo.outputPath("sample-receipt.pdf"),
      preferCSSPageSize: true,
      printBackground: true,
    });
  }
});

test("parallel mode unlocks pending requests and cancellation retains paid entries", async ({
  page,
}) => {
  const id = await startDemo(page);
  const parallel = page.getByRole("checkbox", {
    name: "Parallel payments",
    exact: true,
  });
  await parallel.check();
  await expect(
    page
      .getByTestId("payment-3")
      .getByRole("button", { name: "Payment completed", exact: true }),
  ).toBeEnabled();
  await confirmPayment(page, 3);
  expect(
    (await readSession(page, id)).payments.map((payment) => payment.status),
  ).toEqual(["pending", "pending", "paid"]);
  await parallel.uncheck();
  await expect(
    page
      .getByTestId("payment-1")
      .getByRole("button", { name: "Payment completed", exact: true }),
  ).toBeEnabled();
  await expect(
    page
      .getByTestId("payment-2")
      .getByRole("button", { name: "Payment completed", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Cancel session", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Cancel this session?",
    exact: true,
  });
  await expect(dialog).toContainText("does not reverse any money sent");
  await dialog
    .getByRole("button", { name: "Cancel session", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "This session is closed.", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("payment-1")).toContainText("Cancelled");
  await expect(page.getByTestId("payment-3")).toContainText("Paid · manual");
  await expect(
    page
      .getByTestId("payment-1")
      .getByRole("button", { name: "Show QR", exact: true }),
  ).toBeDisabled();
  expect(
    (await readSession(page, id)).payments.map((payment) => payment.status),
  ).toEqual(["cancelled", "cancelled", "paid"]);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "This session is closed.", exact: true }),
  ).toBeVisible();
});

test("a user-entered merchant QR contains the exact UPI intent without opening any bank app", async ({
  page,
}, testInfo) => {
  await page.goto("/create");
  await page
    .getByLabel("Merchant name", { exact: true })
    .fill("QR Test Bistro & Co.");
  await page
    .getByLabel("Merchant UPI ID", { exact: false })
    .fill("qr-test-bistro@upi");
  await page.getByLabel("Total bill amount", { exact: true }).fill("2000.15");
  await page.getByLabel("Invoice", { exact: false }).fill("QR-QA-42");
  await page
    .getByRole("button", { name: "Split payment", exact: true })
    .click();
  await page.waitForURL(/\/session\/session_/);
  const id = page.url().split("/").at(-1)!;
  const session = await readSession(page, id);
  expect(session.isDemo).toBe(false);
  await expect(
    page
      .getByTestId("payment-1")
      .getByRole("button", { name: "Open UPI App", exact: true }),
  ).toBeEnabled();
  await page
    .getByTestId("payment-1")
    .getByRole("button", { name: "Show QR", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Scan to pay", exact: true });
  await expect(dialog).toBeVisible();
  const uri = await decodeVisibleQr(page);
  const payment = session.payments[0];
  const expectedUri = buildUpiUrl({
    vpa: session.vpa,
    name: session.merchantName,
    amount: payment.amountPaise / 100,
    transactionId: payment.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 35),
    note: `Invoice ${session.invoice}`,
  });
  expect(uri).toBe(expectedUri);
  expect(Object.fromEntries(new URL(uri).searchParams)).toMatchObject({
    pa: "qr-test-bistro@upi",
    pn: "QR Test Bistro & Co.",
    am: "2000.00",
    cu: "INR",
    tn: "Invoice QR-QA-42",
  });
  await dialog.getByText("View encoded UPI intent", { exact: true }).click();
  await expect(page.getByTestId("qr-payload")).toHaveText(uri);
  await page.screenshot({
    path: testInfo.outputPath("real-intent-qr.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await confirmPayment(page, 1);
  await page
    .getByTestId("payment-2")
    .getByRole("button", { name: "Show QR", exact: true })
    .click();
  expect(new URL(await decodeVisibleQr(page)).searchParams.get("am")).toBe(
    "0.15",
  );
  await page.keyboard.press("Escape");
  // Seed an earlier external-open timestamp; this deliberately never launches UPI.
  await page.evaluate((sessionId) => {
    const key = `splitupi:session:${sessionId}`;
    const current = JSON.parse(localStorage.getItem(key)!);
    current.payments[1].openedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(current));
    window.dispatchEvent(new Event("storage"));
  }, id);
  await page
    .getByTestId("payment-2")
    .getByRole("button", { name: "Reopen UPI App", exact: true })
    .click();
  const warning = page.getByRole("dialog", {
    name: "Check before paying again",
    exact: true,
  });
  await expect(warning).toContainText("duplicate transfer");
  await warning.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/session/${id}$`));
  expect((await readSession(page, id)).payments[1].status).toBe("pending");
});

test("missing, corrupt and demo-marker-tampered local sessions show a recovery screen", async ({
  page,
}) => {
  await page.goto("/session/missing-session");
  await expect(
    page.getByRole("heading", {
      name: "This session isn’t here.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create a payment", exact: true }),
  ).toBeVisible();
  const id = await startDemo(page);
  const original = await readSession(page, id);
  await page.evaluate(
    (sessionId) =>
      localStorage.setItem(`splitupi:session:${sessionId}`, "{broken-json"),
    id,
  );
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "This session isn’t here.",
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(
    (session) =>
      localStorage.setItem(
        `splitupi:session:${session.id}`,
        JSON.stringify({ ...session, isDemo: false }),
      ),
    original,
  );
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "This session isn’t here.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open UPI App", exact: true }),
  ).toHaveCount(0);
});

test("the session and QR modal fit a narrow mobile viewport", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await startDemo(page);
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await page
    .getByTestId("payment-1")
    .getByRole("button", { name: "Show QR", exact: true })
    .click();
  await expect(page.getByTestId("payment-qr").locator("svg")).toBeVisible();
  const modal = page.getByRole("dialog", {
    name: "Demo QR · no payment",
    exact: true,
  });
  const bounds = await modal.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  await page.screenshot({
    path: testInfo.outputPath("qr-320px.png"),
    animations: "disabled",
  });
});
