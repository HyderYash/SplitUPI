import { expect, test } from "@playwright/test";

test("premium preview totals and navigation fit narrow phone screens", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole("button", { name: "₹7,400", exact: true }).click();
    await expect(page.locator(".preview-chunk")).toHaveCount(4);
    await expect(page.locator(".preview-chunk").last()).toContainText("₹1,400");
    await expect(page.locator(".preview-balance")).toContainText("4 requests");
    const dimensions = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
    await page.getByRole("button", { name: "₹5,500", exact: true }).click();
    await expect(page.locator(".preview-chunk")).toHaveCount(3);
    await expect(page.locator(".preview-chunk").last()).toContainText("₹1,500");
  }
  await page.locator(".mobile-menu summary").click();
  const createLink = page.locator(".mobile-menu").getByRole("link", { name: "Create a payment" });
  await expect(createLink).toBeVisible();
  await createLink.click();
  await expect(page).toHaveURL(/\/create$/);
  await expect(page.getByLabel("Merchant name", { exact: true })).toBeVisible();
});

test("create layout stays styled on fresh entry and reload", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto("http://localhost:3000/create");
    await expect(page.locator(".create-grid")).toHaveCSS("display", "grid");
    await expect(page.locator(".create-nav")).toHaveCSS("display", "flex");
    const width = await page.locator(".create-screen").boundingBox();
    expect(width?.width).toBeLessThanOrEqual(320);
    await page.reload();
    await expect(page.locator(".create-grid")).toHaveCSS("display", "grid");
    await expect(page.locator(".create-nav")).toHaveCSS("display", "flex");
  } finally {
    await context.close();
  }
});

test("animated film is deterministic, mobile-viewable, and non-payable", async ({ page }) => {
  await page.goto("/launch/splitupi-film.html?paused=1&t=0");
  await page.waitForFunction(() => document.documentElement.dataset.filmReady === "true");
  const duration = await page.evaluate(() => (window as typeof window & { FILM_DURATION: number }).FILM_DURATION);
  expect(duration).toBe(36);
  for (const time of [0, 7, 12, 17, 22, 27, 33, 36]) {
    await page.evaluate((t) => (window as typeof window & { seekFilm: (s: number) => void }).seekFilm(t), time);
    const state = await page.evaluate(() => (window as typeof window & { getFilmState: () => { time: number } }).getFilmState());
    expect(state.time).toBe(time);
  }
  await expect(page.locator("body")).toContainText("splitupi.webnaut.in");
  expect(await page.locator('a[href^="upi:"]').count()).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
