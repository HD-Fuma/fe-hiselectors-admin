import { mkdir } from "node:fs/promises";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

interface BrowserDiagnostics {
  consoleErrors: string[];
  externalRequests: string[];
  pageErrors: string[];
  requestFailures: string[];
}

const diagnosticsByPage = new WeakMap<Page, BrowserDiagnostics>();

test.beforeAll(async () => {
  await mkdir("test-results/visual", { recursive: true });
});

test.beforeEach(async ({ page }, testInfo) => {
  const baseURL = String(testInfo.project.use.baseURL);
  const allowedOrigin = new URL(baseURL).origin;
  const diagnostics: BrowserDiagnostics = {
    consoleErrors: [],
    externalRequests: [],
    pageErrors: [],
    requestFailures: [],
  };

  diagnosticsByPage.set(page, diagnostics);
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => diagnostics.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    diagnostics.requestFailures.push(
      `${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown"}`,
    );
  });

  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const isInlineResource = url.protocol === "data:" || url.protocol === "blob:";
    const isAllowedLocalRequest =
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === allowedOrigin;

    if (isInlineResource || isAllowedLocalRequest) {
      await route.continue();
      return;
    }

    diagnostics.externalRequests.push(route.request().url());
    await route.abort("blockedbyclient");
  });
});

test.afterEach(async ({ page }) => {
  const diagnostics = diagnosticsByPage.get(page);
  expect(diagnostics?.externalRequests ?? []).toEqual([]);
  expect(diagnostics?.consoleErrors ?? []).toEqual([]);
  expect(diagnostics?.pageErrors ?? []).toEqual([]);
  expect(diagnostics?.requestFailures ?? []).toEqual([]);
});

async function waitForStablePage(page: Page) {
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  );
}

async function openCheckpoint(page: Page, path: string, testInfo: TestInfo) {
  const baseURL = String(testInfo.project.use.baseURL);
  const target = new URL(path, baseURL);
  await page.goto(target.toString());
  await waitForStablePage(page);
}

function expectApprox(value: number, expected: number, tolerance: number) {
  expect(value).toBeGreaterThanOrEqual(expected - tolerance);
  expect(value).toBeLessThanOrEqual(expected + tolerance);
}

async function expectTextInside(
  child: ReturnType<Page["locator"]>,
  container: ReturnType<Page["locator"]>,
) {
  const [childBox, containerBox] = await Promise.all([
    child.boundingBox(),
    container.boundingBox(),
  ]);
  expect(childBox).not.toBeNull();
  expect(containerBox).not.toBeNull();
  expect(childBox!.x).toBeGreaterThanOrEqual(containerBox!.x - 1);
  expect(childBox!.y).toBeGreaterThanOrEqual(containerBox!.y - 1);
  expect(childBox!.x + childBox!.width).toBeLessThanOrEqual(
    containerBox!.x + containerBox!.width + 1,
  );
  expect(childBox!.y + childBox!.height).toBeLessThanOrEqual(
    containerBox!.y + containerBox!.height + 1,
  );
}

async function expectAdminGeometry(page: Page, viewportWidth: number) {
  const root = page.locator('[data-shell-part="root"]');
  const rail = page.locator('[data-shell-part="rail"]');
  const menu = page.locator('[data-shell-part="menu"]');
  const topbar = page.locator('[data-shell-part="topbar"]');
  const [rootBox, railBox, menuBox, topbarBox] = await Promise.all([
    root.boundingBox(),
    rail.boundingBox(),
    menu.boundingBox(),
    topbar.boundingBox(),
  ]);

  for (const box of [rootBox, railBox, menuBox, topbarBox]) expect(box).not.toBeNull();
  expect(rootBox!.width).toBeGreaterThanOrEqual(1280);
  expectApprox(railBox!.width, 40, 2);
  expectApprox(menuBox!.width, 205, 3);
  expectApprox(topbarBox!.height, 38, 2);

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeGreaterThanOrEqual(viewportWidth);
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 2);
}

async function expectControlAndDenseRowGeometry(page: Page) {
  const control = page.locator("input.hsas-control:visible, select.hsas-control:visible").first();
  const row = page.locator(".hsas-dense-table tbody tr").first();
  const [controlBox, rowBox] = await Promise.all([control.boundingBox(), row.boundingBox()]);
  expect(controlBox).not.toBeNull();
  expect(rowBox).not.toBeNull();
  expectApprox(controlBox!.height, 27, 3);
  expectApprox(rowBox!.height, 27, 4);
}

test("login visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1869, height: 942 });
  await openCheckpoint(page, "/login", testInfo);

  const contract = page.locator('[data-visual-contract="login"]');
  const card = page.locator('[data-login-part="card"]');
  await expect(contract).toBeVisible();
  const cardBox = await card.boundingBox();
  expect(cardBox).not.toBeNull();
  expectApprox(cardBox!.width, 460, 12);
  expectApprox(cardBox!.height, 570, 16);
  await expectTextInside(page.getByRole("heading", { name: /더현대Hi/ }), card);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1870);
  await page.screenshot({ path: "test-results/visual/login.png" });
});

test("creators visual checkpoint at the legacy viewport", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1310, height: 741 });
  await openCheckpoint(page, "/creators", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="dense-table"]')).toBeVisible();
  await expectAdminGeometry(page, 1310);
  await expectControlAndDenseRowGeometry(page);
  await expectTextInside(
    page.getByRole("heading", { name: "크리에이터 풀" }),
    page.locator(".hsas-page-header"),
  );
  await page.screenshot({ path: "test-results/visual/creators.png" });
});

test("creators visual checkpoint at 1440", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCheckpoint(page, "/creators", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="dense-table"]')).toBeVisible();
  await expectAdminGeometry(page, 1440);
  await expectControlAndDenseRowGeometry(page);
  await page.screenshot({ path: "test-results/visual/creators-1440.png" });
});

test("applicant detail visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1318, height: 742 });
  await openCheckpoint(page, "/applicants/ap-001", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="dense-table"]')).toBeVisible();
  await expectAdminGeometry(page, 1318);
  await expectControlAndDenseRowGeometry(page);
  await expectTextInside(
    page.getByRole("heading", { name: "지원자 상세 심사" }),
    page.locator(".hsas-page-header"),
  );
  await page.screenshot({ path: "test-results/visual/applicant-detail.png" });
});

test("campaign product modal visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1316, height: 741 });
  await openCheckpoint(page, "/campaigns/new?fixture=product-modal", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="modal"]')).toBeVisible();
  const modal = page.getByRole("dialog", { name: "상품 선택" });
  await expect(modal.locator('[data-visual-contract="dense-table"]')).toBeVisible();
  await expectAdminGeometry(page, 1316);
  const [modalBox, titleBarBox] = await Promise.all([
    modal.boundingBox(),
    modal.locator(".hsas-modal__header").boundingBox(),
  ]);
  expect(modalBox).not.toBeNull();
  expect(titleBarBox).not.toBeNull();
  expectApprox(modalBox!.width, 820, 24);
  expectApprox(titleBarBox!.height, 32, 4);
  const [modalControlBox, modalRowBox] = await Promise.all([
    modal.locator("input.hsas-control, select.hsas-control").first().boundingBox(),
    modal.locator(".hsas-dense-table tbody tr").first().boundingBox(),
  ]);
  expect(modalControlBox).not.toBeNull();
  expect(modalRowBox).not.toBeNull();
  expectApprox(modalControlBox!.height, 27, 3);
  expectApprox(modalRowBox!.height, 27, 4);
  const workspaceCenter = 245 + (1316 - 245) / 2;
  expect(Math.abs(modalBox!.x + modalBox!.width / 2 - workspaceCenter)).toBeLessThanOrEqual(16);
  await expectTextInside(page.getByRole("heading", { name: "상품 선택" }), modal);
  await page.screenshot({ path: "test-results/visual/campaign-modal.png" });
});

test("edited content review visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1316, height: 735 });
  await openCheckpoint(page, "/content/reviews/ct-003?fixture=edited", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="content-review"]')).toBeVisible();
  await expectAdminGeometry(page, 1316);
  await expectTextInside(
    page.getByRole("heading", { name: "콘텐츠 검수 상세" }),
    page.locator(".hsas-page-header"),
  );
  await page.screenshot({ path: "test-results/visual/content-edited.png" });
});

test("mega menu visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 762, height: 577 });
  await openCheckpoint(page, "/?fixture=mega-menu", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeAttached();
  const megaMenu = page.locator('[data-visual-contract="mega-menu"]');
  await expect(megaMenu).toBeVisible();
  const [megaMenuBox, titleBarBox] = await Promise.all([
    megaMenu.boundingBox(),
    megaMenu.locator(".hsas-mega-menu__title-bar").boundingBox(),
  ]);
  expect(megaMenuBox).not.toBeNull();
  expect(titleBarBox).not.toBeNull();
  expectApprox(megaMenuBox!.x, 0, 1);
  expectApprox(megaMenuBox!.y, 0, 1);
  expectApprox(megaMenuBox!.width, 762, 1);
  expectApprox(megaMenuBox!.height, 577, 1);
  expectApprox(titleBarBox!.height, 25, 2);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeGreaterThanOrEqual(1280);
  expect(scrollWidth).toBeLessThanOrEqual(1284);
  await expectTextInside(page.getByRole("heading", { name: "전체메뉴" }), megaMenu);
  await page.screenshot({ path: "test-results/visual/mega-menu.png" });
});

test("performance visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1316, height: 742 });
  await openCheckpoint(page, "/performance", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="metric-strip"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="dense-table"]').first()).toBeVisible();
  await expectAdminGeometry(page, 1316);
  await expectControlAndDenseRowGeometry(page);
  await expectTextInside(
    page.getByRole("heading", { name: "관리자 성과 대시보드" }),
    page.locator(".hsas-page-header"),
  );
  await page.screenshot({ path: "test-results/visual/performance.png" });
});

test("settlements visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1316, height: 742 });
  await openCheckpoint(page, "/settlements", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="dense-table"]')).toBeVisible();
  await expectAdminGeometry(page, 1316);
  await expectControlAndDenseRowGeometry(page);
  await expectTextInside(
    page.getByRole("heading", { name: "정산 지급 관리" }),
    page.locator(".hsas-page-header"),
  );
  await page.screenshot({ path: "test-results/visual/settlements.png" });
});
