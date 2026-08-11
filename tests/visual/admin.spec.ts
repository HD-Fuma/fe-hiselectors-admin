import { mkdir } from "node:fs/promises";
import type { Locator, Page, TestInfo } from "@playwright/test";
import { expect, test } from "./browserDiagnostics";

test.beforeAll(async () => {
  await mkdir("test-results/visual", { recursive: true });
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

async function expectKeyTextBounds(
  container: Locator,
  textMatchers: readonly (string | RegExp)[],
) {
  const containerBox = await container.boundingBox();
  expect(containerBox).not.toBeNull();

  for (const matcher of textMatchers) {
    const matches = container.getByText(matcher, {
      exact: typeof matcher === "string",
    });
    const count = await matches.count();
    expect(count, `missing key text: ${String(matcher)}`).toBeGreaterThan(0);

    let visibleCount = 0;
    for (let index = 0; index < count; index += 1) {
      const match = matches.nth(index);
      if (!(await match.isVisible())) continue;
      visibleCount += 1;
      const textBox = await match.boundingBox();
      expect(textBox).not.toBeNull();
      expect(textBox!.x).toBeGreaterThanOrEqual(containerBox!.x - 1);
      expect(textBox!.y).toBeGreaterThanOrEqual(containerBox!.y - 1);
      expect(textBox!.x + textBox!.width).toBeLessThanOrEqual(
        containerBox!.x + containerBox!.width + 1,
      );
      expect(textBox!.y + textBox!.height).toBeLessThanOrEqual(
        containerBox!.y + containerBox!.height + 1,
      );
    }

    expect(visibleCount, `key text is not visible: ${String(matcher)}`).toBeGreaterThan(0);
  }
}

async function expectPageHeaderTextBounds(page: Page, title: string, screenCode: string) {
  await expectKeyTextBounds(page.locator(".hsas-page-header"), [
    title,
    screenCode,
    "새로고침",
  ]);
}

async function expectFullyInViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();
  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
}

async function expectAdminGeometry(page: Page, viewportWidth: number) {
  const root = page.locator('[data-shell-part="root"]');
  const sidebar = page.locator('[data-shell-part="sidebar"]');
  const workspace = page.locator(".hsas-admin-shell__workspace");
  const workTabs = page.locator('[data-shell-part="work-tabs"]');
  const content = page.locator('[data-shell-part="content"]');
  const viewport = page.viewportSize();
  const [rootBox, sidebarBox, workspaceBox, workTabsBox, contentBox] = await Promise.all([
    root.boundingBox(),
    sidebar.boundingBox(),
    workspace.boundingBox(),
    workTabs.boundingBox(),
    content.boundingBox(),
  ]);

  expect(viewport).not.toBeNull();
  for (const box of [rootBox, sidebarBox, workspaceBox, workTabsBox, contentBox]) {
    expect(box).not.toBeNull();
  }
  expect(rootBox!.width).toBeGreaterThanOrEqual(1280);
  expectApprox(sidebarBox!.width, 248, 3);
  expectApprox(sidebarBox!.x, rootBox!.x, 1);
  expectApprox(sidebarBox!.y, 0, 1);
  expectApprox(sidebarBox!.height, viewport!.height, 2);
  expectApprox(workspaceBox!.x, sidebarBox!.x + sidebarBox!.width, 1);
  expectApprox(workspaceBox!.width, rootBox!.width - sidebarBox!.width, 2);
  expectApprox(workTabsBox!.x, workspaceBox!.x, 1);
  expectApprox(workTabsBox!.y, workspaceBox!.y, 1);
  expectApprox(workTabsBox!.width, workspaceBox!.width, 2);
  expectApprox(contentBox!.x, workspaceBox!.x, 1);
  expectApprox(contentBox!.y, workTabsBox!.y + workTabsBox!.height, 1);
  expectApprox(contentBox!.width, workspaceBox!.width, 2);

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
  await expectKeyTextBounds(card, [
    "더현대Hi",
    "Partners",
    "더현대Hi 협력사 업무지원시스템",
    "아이디 저장",
    "로그인",
    "아이디 찾기",
    "비밀번호 초기화",
    "시스템 담당자 문의",
  ]);
  await expectKeyTextBounds(page.locator('[data-login-part="quick-links"]'), [
    "신규입점문의",
    "광고신청/안내",
    /파트너스 APP\s*다운로드/,
  ]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1870);
  await page.screenshot({ path: "test-results/visual/login.png" });
});

test("creators visual checkpoint at the legacy viewport", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1310, height: 741 });
  await openCheckpoint(page, "/creators", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expectAdminGeometry(page, 1310);
  await expectPageHeaderTextBounds(page, "크리에이터 풀", "CR101");
  const grid = page.locator('[data-visual-contract="creator-card-grid"]');
  const cards = grid.locator(":scope > .fuma-creator-card");
  await expect(grid).toBeVisible();
  await expect(cards).toHaveCount(4);
  expect(
    await grid.evaluate(
      (node) =>
        getComputedStyle(node).gridTemplateColumns.split(" ").filter(Boolean).length,
    ),
  ).toBe(3);
  const tops = await cards.evaluateAll((nodes) =>
    nodes.slice(0, 3).map((node) => node.getBoundingClientRect().top),
  );
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1);
  const boxes = await cards.evaluateAll((nodes) =>
    nodes.map((node) => ({
      width: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    })),
  );
  for (const box of boxes) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
  }
  const firstCard = cards.first();
  const tiles = firstCard.locator(".fuma-creator-media");
  await expect(tiles).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const box = await tiles.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expectApprox(box!.width, box!.height, 1);
  }

  const [handleColor, metricLabelColor, keywordColor, toolbarSortColor] =
    await Promise.all([
      firstCard
        .locator(".fuma-creator-card__channel")
        .evaluate((node) => getComputedStyle(node).color),
      firstCard
        .locator(".fuma-creator-card__metric dt")
        .first()
        .evaluate((node) => getComputedStyle(node).color),
      firstCard
        .locator(".fuma-creator-card__keywords span")
        .first()
        .evaluate((node) => getComputedStyle(node).color),
      page
        .locator(".fuma-creator-toolbar__sort")
        .evaluate((node) => getComputedStyle(node).color),
    ]);
  expect.soft(handleColor).toBe("rgb(89, 97, 102)");
  expect.soft(metricLabelColor).toBe("rgb(120, 132, 126)");
  expect.soft(keywordColor).toBe("rgb(93, 107, 101)");
  expect.soft(toolbarSortColor).toBe("rgb(89, 97, 102)");

  const primaryAction = firstCard.locator(".fuma-creator-card__action--primary");
  const pressedView = page.locator(
    '.fuma-creator-toolbar__view[aria-pressed="true"]',
  );
  const [primaryBackground, pressedViewBackground] = await Promise.all([
    primaryAction.evaluate((node) => getComputedStyle(node).backgroundColor),
    pressedView.evaluate((node) => getComputedStyle(node).backgroundColor),
  ]);
  expect.soft(primaryBackground).toBe("rgb(27, 128, 96)");
  expect.soft(pressedViewBackground).toBe("rgb(15, 117, 98)");
  await primaryAction.focus();
  await expect(primaryAction).toBeFocused();
  expect.soft(
    await primaryAction.evaluate((node) => getComputedStyle(node).outlineColor),
  ).toBe("rgb(15, 117, 98)");
  await pressedView.focus();
  await expect(pressedView).toBeFocused();
  expect.soft(
    await pressedView.evaluate((node) => getComputedStyle(node).outlineColor),
  ).toBe("rgb(255, 255, 255)");
  await expectKeyTextBounds(
    page.getByRole("article", { name: "김서연 크리에이터 카드" }),
    [
      "김서연",
      "@seo.yeon",
      "#데일리룩",
      "팔로워",
      "ER",
      "프로필",
      "제안 작성",
    ],
  );
  await page.screenshot({ path: "test-results/visual/creators.png" });
});

test("creators visual checkpoint at 1180 two-column viewport", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1180, height: 900 });
  await openCheckpoint(page, "/creators", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expectPageHeaderTextBounds(page, "크리에이터 풀", "CR101");
  const grid = page.locator('[data-visual-contract="creator-card-grid"]');
  const cards = grid.locator(":scope > .fuma-creator-card");
  await expect(grid).toBeVisible();
  await expect(cards).toHaveCount(4);
  expect(
    await grid.evaluate(
      (node) =>
        getComputedStyle(node).gridTemplateColumns.split(" ").filter(Boolean).length,
    ),
  ).toBe(2);
  const viewport = page.viewportSize();
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(viewport).not.toBeNull();
  expect(scrollWidth).toBeGreaterThanOrEqual(1280);
  expect(scrollWidth).toBeGreaterThan(viewport!.width);
  await page.screenshot({
    fullPage: true,
    path: "test-results/visual/creators-1180.png",
  });
});

test("creators visual checkpoint at 1440", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCheckpoint(page, "/creators", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expectAdminGeometry(page, 1440);
  await expectPageHeaderTextBounds(page, "크리에이터 풀", "CR101");
  const sidebar = page.locator('[data-shell-part="sidebar"]');
  const navigation = sidebar.getByRole("navigation", { name: "관리자 메뉴" });
  const activeLink = navigation.getByRole("link", { name: "크리에이터 목록" });
  const hoverLink = navigation.getByRole("link", { name: "제안 이력" });
  await expect(activeLink).toHaveCSS("background-color", "rgb(22, 143, 120)");
  const activeState = await activeLink.evaluate((element) => ({
    fontWeight: Number.parseInt(getComputedStyle(element).fontWeight, 10),
    markerWidth: Number.parseFloat(getComputedStyle(element, "::before").width),
  }));
  expect(activeState.fontWeight).toBeGreaterThanOrEqual(700);
  expectApprox(activeState.markerWidth, 3, 0.25);

  await activeLink.focus();
  await expect(activeLink).toBeFocused();
  await expect(activeLink).toHaveCSS("outline-color", "rgb(255, 255, 255)");
  const activeFocusState = await activeLink.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineStyle: styles.outlineStyle,
      outlineWidth: Number.parseFloat(styles.outlineWidth),
    };
  });
  expect(activeFocusState.focusVisible).toBe(true);
  expect(activeFocusState.outlineStyle).toBe("solid");
  expect(activeFocusState.outlineWidth).toBeGreaterThanOrEqual(2);
  await hoverLink.focus();
  await expect(hoverLink).toBeFocused();
  await expect(hoverLink).toHaveCSS("outline-color", "rgb(36, 159, 142)");
  const focusState = await hoverLink.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineStyle: styles.outlineStyle,
      outlineWidth: Number.parseFloat(styles.outlineWidth),
    };
  });
  expect(focusState.focusVisible).toBe(true);
  expect(focusState.outlineStyle).not.toBe("none");
  expect(focusState.outlineWidth).toBeGreaterThanOrEqual(2);

  await hoverLink.hover();
  await expect(hoverLink).toHaveCSS("background-color", "rgb(58, 58, 58)");
  await page.mouse.move(1439, 899);

  await expectKeyTextBounds(sidebar, [
    "크리에이터",
    "크리에이터 목록",
    "제안 이력",
    "셀렉터스",
    "기수 관리",
    "셀렉터스 목록",
    "블랙리스트 관리",
    "지원자",
    "지원자 승인",
    "캠페인",
    "캠페인 관리",
    "콘텐츠",
    "콘텐츠 검수",
    "성과",
    "성과 대시보드",
    "크리에이터 분석",
    "콘텐츠 분석",
    "정산",
    "정산 관리",
  ]);
  const grid = page.locator('[data-visual-contract="creator-card-grid"]');
  const cards = grid.locator(":scope > .fuma-creator-card");
  const firstCard = cards.first();
  await expect
    .poll(() =>
      firstCard.evaluate((node) => Number.parseFloat(getComputedStyle(node).transitionDuration)),
    )
    .toBeLessThanOrEqual(0.001);
  await firstCard.hover();
  await expect
    .poll(() => firstCard.evaluate((node) => getComputedStyle(node).transform))
    .toBe("matrix(1, 0, 0, 1, 0, -4)");
  await expect(grid).toBeVisible();
  await expect(cards).toHaveCount(4);
  expect(
    await grid.evaluate(
      (node) =>
        getComputedStyle(node).gridTemplateColumns.split(" ").filter(Boolean).length,
    ),
  ).toBe(3);
  const tops = await cards.evaluateAll((nodes) =>
    nodes.slice(0, 3).map((node) => node.getBoundingClientRect().top),
  );
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(4);
  const boxes = await cards.evaluateAll((nodes) =>
    nodes.map((node) => ({
      width: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    })),
  );
  for (const box of boxes) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
  }
  await expectKeyTextBounds(
    page.getByRole("article", { name: "이지아 크리에이터 카드" }),
    ["이지아", "@zia.trip", "Instagram", "#국내여행", "팔로워", "ER", "제안 작성"],
  );
  await page.screenshot({
    fullPage: true,
    path: "test-results/visual/creators-1440.png",
  });
});

test("applicant detail visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1318, height: 742 });
  await openCheckpoint(page, "/applicants/ap-001", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="dense-table"]')).toBeVisible();
  await expectAdminGeometry(page, 1318);
  await expectControlAndDenseRowGeometry(page);
  await expectPageHeaderTextBounds(page, "지원자 상세 심사", "AP102");
  await expectKeyTextBounds(page.locator('section[aria-labelledby="applicant-basic-title"]'), [
    "기본 정보",
    "지원자 ID",
    "ap-001",
    "이름",
    "김민지",
    "이메일",
    "minji@example.com",
    "검토 대기",
  ]);
  await expectKeyTextBounds(page.getByRole("region", { name: "AI 요약 리포트" }), [
    "AI 요약 리포트",
    "AI 적합도",
    "91점",
    "근거 지표",
    "생성 완료",
  ]);
  await page.screenshot({ path: "test-results/visual/applicant-detail.png" });
});

test("campaign product modal visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1316, height: 741 });
  await openCheckpoint(page, "/campaigns/new?fixture=product-modal", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="modal"]')).toBeVisible();
  const modal = page.getByRole("dialog", { name: "상품 선택" });
  const backdrop = page.locator(".hsas-modal-backdrop");
  const sidebar = page.locator('[data-shell-part="sidebar"]');
  const workspace = page.locator(".hsas-admin-shell__workspace");
  await expect(modal.locator('[data-visual-contract="dense-table"]')).toBeVisible();
  await expectAdminGeometry(page, 1316);
  const [modalBox, titleBarBox, backdropBox, sidebarBox, workspaceBox] = await Promise.all([
    modal.boundingBox(),
    modal.locator(".hsas-modal__header").boundingBox(),
    backdrop.boundingBox(),
    sidebar.boundingBox(),
    workspace.boundingBox(),
  ]);
  expect(modalBox).not.toBeNull();
  expect(titleBarBox).not.toBeNull();
  expect(backdropBox).not.toBeNull();
  expect(sidebarBox).not.toBeNull();
  expect(workspaceBox).not.toBeNull();
  expectApprox(backdropBox!.x, 0, 1);
  expectApprox(backdropBox!.y, 0, 1);
  expectApprox(backdropBox!.width, 1316, 1);
  expectApprox(backdropBox!.height, 741, 1);
  const backdropStyles = await backdrop.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      paddingLeft: Number.parseFloat(styles.paddingLeft),
      zIndex: Number.parseInt(styles.zIndex, 10),
    };
  });
  const sidebarZIndex = await sidebar.evaluate((element) => {
    const zIndex = getComputedStyle(element).zIndex;
    return zIndex === "auto" ? 0 : Number.parseInt(zIndex, 10);
  });
  expectApprox(backdropStyles.paddingLeft, 264, 2);
  expect(backdropStyles.zIndex).toBeGreaterThan(sidebarZIndex);
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
  const workspaceCenter = workspaceBox!.x + workspaceBox!.width / 2;
  expect(Math.abs(modalBox!.x + modalBox!.width / 2 - workspaceCenter)).toBeLessThanOrEqual(16);
  await expectKeyTextBounds(modal, [
    "상품 선택",
    "협력사 코드",
    "판매상품 코드",
    "상품매체",
    "조회(F4)",
    "판매상품 목록",
    "총 1건",
    "판매상품명",
    "진행",
    "Hmall",
    "주식회사 현대백화점",
    "선택",
    "취소",
  ]);
  await page.screenshot({ path: "test-results/visual/campaign-modal.png" });
});

test("keeps campaign product modal centered after horizontal scroll", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 762, height: 577 });
  await openCheckpoint(page, "/campaigns/new?fixture=product-modal", testInfo);

  const sidebar = page.locator('[data-shell-part="sidebar"]');
  const backdrop = page.locator(".hsas-modal-backdrop");
  const modal = page.getByRole("dialog", { name: "상품 선택" });
  await expect(modal).toBeVisible();

  await page.evaluate(() => window.scrollTo({ left: 200 }));
  await expect.poll(() => page.evaluate(() => window.scrollX)).toBeGreaterThanOrEqual(190);

  const viewport = page.viewportSize();
  const [sidebarBox, backdropBox, modalBox] = await Promise.all([
    sidebar.boundingBox(),
    backdrop.boundingBox(),
    modal.boundingBox(),
  ]);
  expect(viewport).not.toBeNull();
  expect(sidebarBox).not.toBeNull();
  expect(backdropBox).not.toBeNull();
  expect(modalBox).not.toBeNull();
  await expect(sidebar).toHaveCSS("position", "sticky");
  await expect(sidebar).toHaveCSS("left", "0px");
  expectApprox(sidebarBox!.x, 0, 1);
  expectApprox(sidebarBox!.x + sidebarBox!.width, 248, 3);
  expectApprox(backdropBox!.x, 0, 1);
  expectApprox(backdropBox!.width, viewport!.width, 1);

  const visibleWorkspaceCenter =
    (sidebarBox!.x + sidebarBox!.width + viewport!.width) / 2;
  const modalCenter = modalBox!.x + modalBox!.width / 2;
  expect(Math.abs(modalCenter - visibleWorkspaceCenter)).toBeLessThanOrEqual(16);
});

test("edited content review visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1316, height: 735 });
  await openCheckpoint(page, "/content/reviews/ct-003?fixture=edited", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="content-review"]')).toBeVisible();
  await expectAdminGeometry(page, 1316);
  await expectPageHeaderTextBounds(page, "콘텐츠 검수 상세", "CT102");
  await expectKeyTextBounds(page.getByRole("group", { name: "검수 상태 요약" }), [
    "검수 유형",
    "일반 수정본",
    "검수 상태",
    "검수 대기",
    "처리 상태",
    "미처리",
  ]);
  await expectKeyTextBounds(page.getByRole("region", { name: "기본 정보" }), [
    "콘텐츠 ID",
    "ct-003",
    "작성자",
    "김서연",
    "플랫폼",
    "Instagram",
    "제출 시각",
    "2026-08-03 16:25",
  ]);

  const previousSnapshot = page.getByRole("region", { name: "이전 콘텐츠" });
  const currentSnapshot = page.getByRole("region", { name: "현재 콘텐츠" });
  const editorFrames = page.locator(".fuma-editor-frame");
  const mediaTiles = page.locator(".fuma-media-tiles");
  const changeSummary = page.getByRole("region", { name: "변경 요약" });
  await expect(editorFrames).toHaveCount(2);
  await expect(mediaTiles).toHaveCount(2);
  await expectKeyTextBounds(previousSnapshot, [
    "이전 콘텐츠",
    "직전 승인본",
    "2026-08-02 12:10",
    /^<p>가을 라운딩 코디로/,
    "URL",
    "미디어",
    "3개",
  ]);
  await expectKeyTextBounds(currentSnapshot, [
    "현재 콘텐츠",
    "수정 감지본",
    "2026-08-03 16:22",
    /^<p>선선한 아침 라운딩에/,
    "URL",
    "미디어",
    "4개",
  ]);
  await expectKeyTextBounds(changeSummary, [
    "변경 요약",
    "본문 변경됨",
    "URL 1 → 2",
    "미디어 3 → 4",
  ]);
  for (const locator of [
    editorFrames.nth(0),
    editorFrames.nth(1),
    mediaTiles.nth(0),
    mediaTiles.nth(1),
    changeSummary,
  ]) {
    await expect(locator).toBeVisible();
    await expectFullyInViewport(page, locator);
  }
  await page.screenshot({ path: "test-results/visual/content-edited.png" });
});

test("performance visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1316, height: 742 });
  await openCheckpoint(page, "/performance", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="metric-strip"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="dense-table"]').first()).toBeVisible();
  await expectAdminGeometry(page, 1316);
  await expectControlAndDenseRowGeometry(page);
  await expectPageHeaderTextBounds(page, "관리자 성과 대시보드", "PF101");
  await expectKeyTextBounds(page.locator('[data-visual-contract="metric-strip"]'), [
    "총 클릭 수",
    "42,200",
    "구매 전환 수",
    "1,399",
    "전환율",
    "3.32%",
    "집계 셀렉터스",
    "4명",
  ]);
  await expectKeyTextBounds(page.getByRole("region", { name: "캠페인별 성과" }), [
    "캠페인 ID",
    "캠페인명",
    "클릭 수",
    "cp-001",
    "2026 가을 골프웨어 셀렉션",
    "14,060",
    "370",
  ]);
  await page.screenshot({ path: "test-results/visual/performance.png" });
});

test("settlements visual checkpoint", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1316, height: 742 });
  await openCheckpoint(page, "/settlements", testInfo);

  await expect(page.locator('[data-visual-contract="admin-shell"]')).toBeVisible();
  await expect(page.locator('[data-visual-contract="dense-table"]')).toBeVisible();
  await expectAdminGeometry(page, 1316);
  await expectControlAndDenseRowGeometry(page);
  await expectPageHeaderTextBounds(page, "정산 지급 관리", "ST101");
  await expectKeyTextBounds(page.getByRole("region", { name: "정산 지급 목록" }), [
    "귀속월",
    "셀렉터스",
    "예상액",
    "확정액",
    "2026-08",
    "김서연",
    "486,000원",
    "미확정",
    "지급 전",
  ]);
  await page.screenshot({ path: "test-results/visual/settlements.png" });
});
