import type { Page } from "@playwright/test";
import { expect, test } from "./browserDiagnostics";

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

test("keeps static login credentials out of browser history", async ({ page }) => {
  await page.setViewportSize({ width: 1869, height: 942 });
  await page.goto("/login");
  await waitForStablePage(page);
  const loginUrl = page.url();

  await page.getByPlaceholder("ID를 입력하세요.").fill("review-user");
  await page.getByPlaceholder("비밀번호를 입력하세요.").fill("review-secret");
  await page.getByRole("button", { name: "로그인" }).click();

  expect(page.url()).toBe(loginUrl);
  await expect(page.getByText("Partners")).toBeVisible();
});

test("keeps the login card inside a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 460, height: 760 });
  await page.goto("/login");
  await waitForStablePage(page);

  const cardBox = await page.locator('[data-login-part="card"]').boundingBox();
  expect(cardBox).not.toBeNull();
  expect(cardBox!.x).toBeGreaterThanOrEqual(0);
});

test("locks the administrator shell geometry", async ({ page }) => {
  await page.setViewportSize({ width: 1310, height: 741 });
  await page.goto("/creators");
  await waitForStablePage(page);

  const root = page.locator('[data-shell-part="root"]');
  const sidebar = page.locator('[data-shell-part="sidebar"]');
  const workspace = page.locator(".hsas-admin-shell__workspace");
  const topbar = page.locator('[data-shell-part="topbar"]');
  const content = page.locator('[data-shell-part="content"]');
  const brand = sidebar.locator(".hsas-admin-sidebar__brand");
  const navigation = sidebar.getByRole("navigation", { name: "관리자 메뉴" });

  await expect(root).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(workspace).toBeVisible();
  await expect(topbar).toBeVisible();
  await expect(content).toBeVisible();
  await expect(brand).toBeVisible();
  await expect(navigation.getByRole("link")).toHaveCount(14);
  await expect(topbar.locator(".hsas-admin-topbar__account-role")).toHaveCSS(
    "color",
    "rgb(89, 97, 102)",
  );
  await page.screenshot({ path: "test-results/visual/admin-shell-reference.png" });

  const [rootBox, sidebarBox, workspaceBox, topbarBox, contentBox] = await Promise.all([
    root.boundingBox(),
    sidebar.boundingBox(),
    workspace.boundingBox(),
    topbar.boundingBox(),
    content.boundingBox(),
  ]);

  for (const box of [rootBox, sidebarBox, workspaceBox, topbarBox, contentBox]) {
    expect(box).not.toBeNull();
  }

  expect(sidebarBox!.width).toBeGreaterThanOrEqual(245);
  expect(sidebarBox!.width).toBeLessThanOrEqual(251);
  expect(Math.abs(sidebarBox!.x - rootBox!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(sidebarBox!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(sidebarBox!.height - 741)).toBeLessThanOrEqual(2);
  expect(topbarBox!.height).toBeGreaterThanOrEqual(42);
  expect(topbarBox!.height).toBeLessThanOrEqual(46);
  expect(
    Math.abs(topbarBox!.x - (sidebarBox!.x + sidebarBox!.width)),
  ).toBeLessThanOrEqual(1);
  expect(Math.abs(workspaceBox!.x - topbarBox!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(contentBox!.x - workspaceBox!.x)).toBeLessThanOrEqual(1);

  const rootMinimumWidth = await root.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).minWidth),
  );
  expect(rootMinimumWidth).toBeGreaterThanOrEqual(1280);
  expect(rootBox!.width).toBeGreaterThanOrEqual(1280);
  expect(
    Math.abs(workspaceBox!.width - (rootBox!.width - sidebarBox!.width)),
  ).toBeLessThanOrEqual(3);
  expect(
    Math.abs(contentBox!.width - workspaceBox!.width),
  ).toBeLessThanOrEqual(3);
});

test("keeps sidebar navigation scroll independent from the page", async ({ page }) => {
  await page.setViewportSize({ width: 1310, height: 741 });
  await page.goto("/creators");
  await waitForStablePage(page);

  const sidebar = page.locator('[data-shell-part="sidebar"]');
  const brand = sidebar.locator(".hsas-admin-sidebar__brand");
  const navigation = sidebar.getByRole("navigation", { name: "관리자 메뉴" });
  const links = navigation.getByRole("link");
  const finalLink = navigation.getByRole("link", { name: "공지사항" });

  await expect(brand).toBeVisible();
  await expect(links).toHaveCount(14);
  await expect(sidebar).toHaveCSS("position", "sticky");
  await expect(sidebar).toHaveCSS("top", "0px");
  await expect(navigation).toHaveCSS("overflow-y", "auto");
  await expect(navigation).toHaveCSS(
    "scrollbar-color",
    "rgb(114, 130, 126) rgba(0, 0, 0, 0)",
  );

  const navigationSize = await navigation.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(navigationSize.scrollHeight).toBeGreaterThan(navigationSize.clientHeight);

  const brandBoxBefore = await brand.boundingBox();
  const windowScrollBefore = await page.evaluate(() => window.scrollY);
  expect(brandBoxBefore).not.toBeNull();

  await navigation.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => navigation.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(finalLink).toBeInViewport();

  const brandBoxAfter = await brand.boundingBox();
  const windowScrollAfter = await page.evaluate(() => window.scrollY);
  expect(brandBoxAfter).not.toBeNull();
  expect(windowScrollAfter).toBe(windowScrollBefore);
  expect(Math.abs(brandBoxAfter!.y - brandBoxBefore!.y)).toBeLessThanOrEqual(1);
});

test("keeps the narrow administrator shell horizontally scrollable", async ({ page }) => {
  await page.setViewportSize({ width: 762, height: 577 });
  await page.goto("/creators");
  await waitForStablePage(page);

  const root = page.locator('[data-shell-part="root"]');
  const rootBox = await root.boundingBox();
  expect(rootBox).not.toBeNull();
  expect(rootBox!.width).toBeGreaterThanOrEqual(1280);

  const documentWidth = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(documentWidth.scrollWidth).toBeGreaterThanOrEqual(1280);
  expect(documentWidth.scrollWidth).toBeGreaterThan(documentWidth.clientWidth);

  await page.evaluate(() => window.scrollTo({ left: 200 }));
  expect(await page.evaluate(() => window.scrollX)).toBeGreaterThan(0);
});
