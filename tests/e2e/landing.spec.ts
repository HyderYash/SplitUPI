import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("landing and announcement metadata render in light and dark", async ({
  page,
  request,
}, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "One bill. Multiple UPI payments." }),
  ).toBeVisible();
  await expect(page).toHaveTitle("SplitUPI — One bill. Multiple UPI payments.");
  const imageUrl = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(imageUrl).toBeTruthy();
  const imageResponse = await request.get(new URL(imageUrl!).pathname);
  expect(imageResponse.status()).toBe(200);
  const image = await sharp(await imageResponse.body()).metadata();
  expect(image.width).toBe(1200);
  expect(image.height).toBe(630);
  await page.screenshot({
    path: testInfo.outputPath("landing-light.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: testInfo.outputPath("landing-dark.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "See how it works" }).click();
  await expect(page).toHaveURL(/#how-it-works$/);
  await page.getByRole("button", { name: "Live demo", exact: true }).click();
  await expect(page).toHaveURL(/\/session\/session_/);
  await expect(page.getByText("Live demo. No money moves.")).toBeVisible();
  expect(pageErrors).toEqual([]);
});
