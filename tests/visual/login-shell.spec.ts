import { expect, test, type Page } from "@playwright/test";

async function waitForStablePage(page: Page) {
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  );
}

test("matches the Partners login geometry", async ({ page }) => {
  await page.setViewportSize({ width: 1869, height: 942 });
  await page.goto("/login");
  await waitForStablePage(page);

  const card = page.locator('[data-login-part="card"]');
  const quickLinks = page.locator('[data-login-part="quick-links"]');
  const qr = page.locator('[data-login-part="qr"]');

  await expect(card).toBeVisible();
  await expect(quickLinks).toBeVisible();
  await expect(qr).toBeVisible();
  await expect(page.locator('[data-shell-part="root"]')).toHaveCount(0);
  await page.screenshot({ path: "test-results/visual/login-reference.png" });

  const cardBox = await card.boundingBox();
  const quickLinksBox = await quickLinks.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(quickLinksBox).not.toBeNull();
  expect(cardBox!.width).toBeGreaterThanOrEqual(448);
  expect(cardBox!.width).toBeLessThanOrEqual(472);
  expect(cardBox!.height).toBeGreaterThanOrEqual(554);
  expect(cardBox!.height).toBeLessThanOrEqual(586);
  expect(Math.abs(cardBox!.x + cardBox!.width / 2 - 1869 / 2)).toBeLessThanOrEqual(30);
  expect(Math.abs(cardBox!.y + cardBox!.height / 2 - 942 / 2)).toBeLessThanOrEqual(30);
  expect(quickLinksBox!.x).toBeGreaterThan(cardBox!.x + cardBox!.width);
});

test("locks the legacy administrator shell geometry", async ({ page }) => {
  await page.setViewportSize({ width: 1310, height: 741 });
  await page.goto("/creators");
  await waitForStablePage(page);

  const root = page.locator('[data-shell-part="root"]');
  const rail = page.locator('[data-shell-part="rail"]');
  const menu = page.locator('[data-shell-part="menu"]');
  const topbar = page.locator('[data-shell-part="topbar"]');
  const content = page.locator('[data-shell-part="content"]');

  await expect(root).toBeVisible();
  await expect(rail).toBeVisible();
  await expect(menu).toBeVisible();
  await expect(topbar).toBeVisible();
  await expect(content).toBeVisible();
  await page.screenshot({ path: "test-results/visual/admin-shell-reference.png" });

  const [rootBox, railBox, menuBox, topbarBox, contentBox] = await Promise.all([
    root.boundingBox(),
    rail.boundingBox(),
    menu.boundingBox(),
    topbar.boundingBox(),
    content.boundingBox(),
  ]);

  for (const box of [rootBox, railBox, menuBox, topbarBox, contentBox]) {
    expect(box).not.toBeNull();
  }

  expect(railBox!.width).toBeGreaterThanOrEqual(38);
  expect(railBox!.width).toBeLessThanOrEqual(42);
  expect(menuBox!.width).toBeGreaterThanOrEqual(202);
  expect(menuBox!.width).toBeLessThanOrEqual(208);
  expect(topbarBox!.height).toBeGreaterThanOrEqual(36);
  expect(topbarBox!.height).toBeLessThanOrEqual(40);

  const rootMinimumWidth = await root.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).minWidth),
  );
  expect(rootMinimumWidth).toBeGreaterThanOrEqual(1280);
  expect(rootBox!.width).toBeGreaterThanOrEqual(1280);
  expect(
    Math.abs(contentBox!.width - (rootBox!.width - railBox!.width - menuBox!.width)),
  ).toBeLessThanOrEqual(3);
});
