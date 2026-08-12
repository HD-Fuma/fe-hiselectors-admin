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

test("matches the administrator login geometry", async ({ page }) => {
  await page.setViewportSize({ width: 1869, height: 942 });
  await page.goto("/login");
  await waitForStablePage(page);

  const card = page.locator('[data-login-part="card"]');

  await expect(card).toBeVisible();
  await expect(page.locator('[data-login-part="quick-links"]')).toHaveCount(0);
  await expect(page.locator('[data-login-part="qr"]')).toHaveCount(0);
  await expect(page.locator('[data-shell-part="root"]')).toHaveCount(0);
  await page.screenshot({ path: "test-results/visual/login-reference.png" });

  const cardBox = await card.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(cardBox!.width).toBeGreaterThanOrEqual(388);
  expect(cardBox!.width).toBeLessThanOrEqual(412);
  expect(cardBox!.height).toBeGreaterThanOrEqual(350);
  expect(cardBox!.height).toBeLessThanOrEqual(390);
  expect(Math.abs(cardBox!.x + cardBox!.width / 2 - 1869 / 2)).toBeLessThanOrEqual(30);
  expect(Math.abs(cardBox!.y + cardBox!.height / 2 - 942 / 2)).toBeLessThanOrEqual(30);
});

test("opens the administrator workspace after login", async ({ page }) => {
  await page.setViewportSize({ width: 1869, height: 942 });
  await page.goto("/login");
  await waitForStablePage(page);
  await page.getByPlaceholder("아이디 입력").fill("review-user");
  await page.getByPlaceholder("비밀번호 입력").fill("review-secret");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/creators$/);
  await expect(page.getByRole("navigation", { name: "관리자 메뉴" })).toBeVisible();
});

test("keeps the login card inside a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
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
  const workTabs = page.locator('[data-shell-part="work-tabs"]');
  const content = page.locator('[data-shell-part="content"]');
  const brand = sidebar.locator(".hsas-admin-sidebar__brand");
  const navigation = sidebar.getByRole("navigation", { name: "관리자 메뉴" });

  await expect(root).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(workspace).toBeVisible();
  await expect(workTabs).toBeVisible();
  await expect(content).toBeVisible();
  await expect(brand).toBeVisible();
  await expect(navigation.getByRole("link")).toHaveCount(13);
  await expect(sidebar.getByText("관리자 계정")).toBeVisible();
  await page.screenshot({ path: "test-results/visual/admin-shell-reference.png" });

  const [rootBox, sidebarBox, workspaceBox, workTabsBox, contentBox] = await Promise.all([
    root.boundingBox(),
    sidebar.boundingBox(),
    workspace.boundingBox(),
    workTabs.boundingBox(),
    content.boundingBox(),
  ]);

  for (const box of [rootBox, sidebarBox, workspaceBox, workTabsBox, contentBox]) {
    expect(box).not.toBeNull();
  }

  expect(sidebarBox!.width).toBeGreaterThanOrEqual(245);
  expect(sidebarBox!.width).toBeLessThanOrEqual(251);
  expect(Math.abs(sidebarBox!.x - rootBox!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(sidebarBox!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(sidebarBox!.height - 741)).toBeLessThanOrEqual(2);
  expect(Math.abs(workTabsBox!.x - workspaceBox!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(workTabsBox!.y - workspaceBox!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(contentBox!.x - workspaceBox!.x)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(contentBox!.y - (workTabsBox!.y + workTabsBox!.height)),
  ).toBeLessThanOrEqual(1);

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
  const finalLink = navigation.getByRole("link", { name: "정산 관리" });

  await expect(brand).toBeVisible();
  await expect(links).toHaveCount(13);
  await expect(sidebar).toHaveCSS("position", "sticky");
  await expect(sidebar).toHaveCSS("top", "0px");
  await expect(navigation).toHaveCSS("overflow-y", "auto");
  await expect(navigation).toHaveCSS(
    "scrollbar-color",
    "rgb(138, 138, 138) rgba(0, 0, 0, 0)",
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

test("renders a restrained document work tab rail", async ({ page }) => {
  await page.setViewportSize({ width: 1310, height: 741 });
  await page.goto("/creators");
  await waitForStablePage(page);

  const sidebar = page.getByRole("navigation", { name: "관리자 메뉴" });
  await sidebar.getByRole("link", { name: "캠페인 관리" }).click();

  const workTabs = page.getByRole("navigation", { name: "작업 탭" });
  const creatorTab = workTabs.locator(".hsas-work-tabs__tab").filter({ hasText: "크리에이터 풀" });
  const campaignTab = workTabs.locator(".hsas-work-tabs__tab").filter({ hasText: "캠페인 관리" });
  const creatorLink = creatorTab.getByRole("link", { name: "크리에이터 풀" });
  const campaignLink = campaignTab.getByRole("link", { name: "캠페인 관리" });
  const creatorClose = creatorTab.getByRole("button", { name: "크리에이터 풀 탭 닫기" });
  const campaignClose = campaignTab.getByRole("button", { name: "캠페인 관리 탭 닫기" });

  await expect(workTabs).toHaveCSS("background-color", "rgb(239, 240, 240)");
  await expect(workTabs).toHaveCSS("overflow-x", "auto");
  await expect(workTabs).toHaveCSS("overflow-y", "hidden");
  await expect(workTabs).toHaveCSS("scrollbar-width", "none");
  const nativeScrollbar = await workTabs.evaluate((element) => {
    const style = getComputedStyle(element, "::-webkit-scrollbar");
    return { display: style.display, height: style.height };
  });
  expect(nativeScrollbar.display).toBe("none");
  expect(nativeScrollbar.height).toBe("0px");
  await expect(workTabs).toHaveCSS("height", "37px");
  await expect(workTabs).toHaveCSS("border-bottom-width", "1px");
  await expect(workTabs).toHaveCSS("border-bottom-style", "solid");
  await expect(workTabs).toHaveCSS("border-bottom-color", "rgb(207, 210, 209)");
  await expect(campaignTab).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(campaignTab).toHaveCSS("color", "rgb(37, 42, 39)");
  await expect(campaignLink).toHaveAttribute("aria-current", "page");
  await expect(campaignLink).toHaveCSS("font-size", "12px");
  await expect(creatorTab).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(creatorTab).toHaveCSS("color", "rgb(107, 112, 109)");
  await expect(creatorTab).toHaveCSS("border-top-width", "0px");
  await expect(creatorTab).toHaveCSS("border-right", "1px solid rgb(215, 218, 216)");
  await expect(creatorTab).toHaveCSS("border-top-left-radius", "0px");
  await expect(creatorTab).toHaveCSS("border-top-right-radius", "0px");

  const activeAfter = await campaignTab.evaluate((element) => {
    const style = getComputedStyle(element, "::after");
    return { backgroundColor: style.backgroundColor, height: style.height, position: style.position };
  });
  expect(activeAfter).toEqual({
    backgroundColor: "rgb(52, 58, 55)",
    height: "2px",
    position: "absolute",
  });

  await expect(creatorClose).toHaveCSS("opacity", "0");
  await expect(creatorClose).toHaveCSS("pointer-events", "none");
  await creatorTab.hover();
  await expect(creatorClose).toHaveCSS("opacity", "1");
  await expect(creatorClose).toHaveCSS("pointer-events", "auto");
  await expect(creatorTab).toHaveCSS("background-color", "rgb(229, 231, 230)");
  await expect(campaignClose).toHaveCSS("opacity", "1");

  await page.mouse.move(0, 700);
  await expect(creatorClose).toHaveCSS("opacity", "0");
  await expect(creatorClose).toHaveCSS("pointer-events", "none");
  await creatorLink.focus();
  await expect(creatorClose).toHaveCSS("opacity", "1");
  await expect(creatorClose).toHaveCSS("pointer-events", "auto");
  await page.keyboard.press("Tab");
  await expect(creatorClose).toBeFocused();
  await expect(creatorClose).toHaveCSS("opacity", "1");
  await expect(creatorClose).toHaveCSS("pointer-events", "auto");
  await expect(creatorClose).toHaveCSS("outline", "rgb(15, 117, 98) solid 2px");
  await page.screenshot({ path: "test-results/visual/work-tabs-two-tabs.png" });
});

test("keeps overflowing work tabs inside the flat work tab rail", async ({ page }) => {
  await page.setViewportSize({ width: 1310, height: 741 });
  await page.goto("/creators");
  await waitForStablePage(page);

  const sidebar = page.getByRole("navigation", { name: "관리자 메뉴" });
  const destinations = sidebar.getByRole("link");
  for (let index = 0; index < await destinations.count(); index += 1) {
    const destination = destinations.nth(index);
    await destination.scrollIntoViewIfNeeded();
    await destination.click();
  }

  const workTabs = page.getByRole("navigation", { name: "작업 탭" });
  const tabs = workTabs.locator(".hsas-work-tabs__tab");
  const railSize = await workTabs.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(railSize.scrollWidth).toBeGreaterThan(railSize.clientWidth);

  const tabBoxes = await tabs.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().top),
  );
  expect(new Set(tabBoxes.map((top) => Math.round(top))).size).toBe(1);

  const [railBox, activeTabBox] = await Promise.all([
    workTabs.boundingBox(),
    workTabs.locator(".hsas-work-tabs__tab--active").boundingBox(),
  ]);
  expect(railBox).not.toBeNull();
  expect(activeTabBox).not.toBeNull();
  expect(activeTabBox!.x).toBeGreaterThanOrEqual(railBox!.x - 1);
  expect(activeTabBox!.x + activeTabBox!.width).toBeLessThanOrEqual(railBox!.x + railBox!.width + 1);

  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(1312);
});

test("keeps the document position while revealing the active work tab", async ({ page }) => {
  await page.setViewportSize({ width: 1310, height: 741 });
  await page.goto("/creators");
  await waitForStablePage(page);
  const sidebar = page.getByRole("navigation", { name: "관리자 메뉴" });
  const destinations = sidebar.getByRole("link");
  for (let index = 0; index < await destinations.count(); index += 1) {
    const destination = destinations.nth(index);
    await destination.scrollIntoViewIfNeeded();
    await destination.click();
  }
  const creatorDestination = sidebar.getByRole("link", { name: "크리에이터 목록" });
  await creatorDestination.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    document.body.style.minHeight = "2000px";
    document.documentElement.style.minHeight = "2000px";
    window.scrollTo(0, 400);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(400);

  await creatorDestination.evaluate((element) => (element as HTMLElement).click());

  const workTabs = page.getByRole("navigation", { name: "작업 탭" });
  await expect(workTabs.getByRole("link", { name: "크리에이터 풀" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const [scrollY, railBox, activeTabBox] = await Promise.all([
    page.evaluate(() => window.scrollY),
    workTabs.boundingBox(),
    workTabs.locator(".hsas-work-tabs__tab--active").boundingBox(),
  ]);
  expect(Math.abs(scrollY - 400)).toBeLessThanOrEqual(1);
  expect(railBox).not.toBeNull();
  expect(activeTabBox).not.toBeNull();
  expect(activeTabBox!.x).toBeGreaterThanOrEqual(railBox!.x - 1);
  expect(activeTabBox!.x + activeTabBox!.width).toBeLessThanOrEqual(railBox!.x + railBox!.width + 1);
});

test.describe("work tabs without hover", () => {
  test.use({ hasTouch: true });

  test("shows every work tab close control when hover is unavailable", async ({ page }) => {
    await page.setViewportSize({ width: 1310, height: 741 });
    await page.goto("/creators");
    await waitForStablePage(page);
    await page.getByRole("navigation", { name: "관리자 메뉴" }).getByRole("link", { name: "캠페인 관리" }).click();

    const closeButtons = page.getByRole("navigation", { name: "작업 탭" }).getByRole("button");
    await expect(closeButtons).toHaveCount(2);
    for (let index = 0; index < await closeButtons.count(); index += 1) {
      await expect(closeButtons.nth(index)).toHaveCSS("opacity", "1");
      await expect(closeButtons.nth(index)).toHaveCSS("pointer-events", "auto");
    }
  });
});
