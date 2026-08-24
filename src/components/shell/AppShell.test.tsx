import {
  fireEvent,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { getTaskRunPanelApiMock, renderRoute } from "../../test/renderRoute";

function resetTheme() {
  localStorage.removeItem("selectors-theme");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-sidebar-theme");
  document.documentElement.style.removeProperty("color-scheme");
}

beforeEach(resetTheme);
afterEach(resetTheme);

const expectedSidebarLinks = [
  ["기수 관리", "/cohorts"],
  ["크리에이터 풀", "/creators"],
  ["제안 이력", "/proposals"],
  ["지원자 승인", "/applicants"],
  ["셀렉터스 목록", "/selectors"],
  ["캠페인 관리", "/campaigns"],
  ["콘텐츠 검수", "/content/inspections"],
  ["실행 이력", "/task-runs"],
  ["셀렉터스 성과", "/performance/selectors"],
  ["콘텐츠 성과", "/performance/contents"],
  ["캠페인 성과", "/performance/products"],
  ["정산 관리", "/settlements"],
  ["발송 내역", "/notifications"],
] as const;

test("renderRoute renders the administrator login route", () => {
  renderRoute("/login");

  expect(screen.getByRole("main")).toHaveTextContent("Hi-Selectors");
});

test("renders the complete administrator navigation in one sidebar", () => {
  renderRoute("/creators");

  const shell = screen.getByTestId("admin-shell");
  const sidebar = shell.querySelector('[data-shell-part="sidebar"]');
  expect(sidebar).toBeInTheDocument();
  const sidebarQueries = within(sidebar as HTMLElement);
  const navigation = sidebarQueries.getByRole("navigation", { name: "관리자 메뉴" });

  expect(sidebarQueries.getByRole("img", { name: "더현대Hi" })).toBeInTheDocument();
  expect(screen.getAllByRole("navigation", { name: "관리자 메뉴" })).toHaveLength(1);
  const sidebarLinks = within(navigation).getAllByRole("link");
  expect(sidebarLinks).toHaveLength(13);
  expect(sidebarLinks.map((link) => [link.textContent, link.getAttribute("href")])).toEqual(
    expectedSidebarLinks,
  );
  for (const [label, href] of expectedSidebarLinks) {
    expect(within(navigation).getByRole("link", { name: label })).toHaveAttribute(
      "href",
      href,
    );
  }
  expect(within(navigation).queryByRole("link", { name: "위반 관리" })).not.toBeInTheDocument();

  for (const groupLabel of [
    "모집·선발",
    "운영",
    "성과·정산",
    "알림·메시지",
  ]) {
    expect(
      within(navigation).getByRole("heading", { name: groupLabel }),
    ).toBeInTheDocument();
  }

  const workTabs = screen.getByRole("navigation", { name: "작업 탭" });
  expect(within(workTabs).getByRole("link", { name: "크리에이터 풀" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("prefixes the sidebar logo with the configured Vite base URL", () => {
  vi.stubEnv("BASE_URL", "/fe-selectors-admin/");

  renderRoute("/creators");

  expect(screen.getByRole("img", { name: "더현대Hi" })).toHaveAttribute(
    "src",
    "/fe-selectors-admin/brand/thehyundai-hi.svg",
  );
  vi.unstubAllEnvs();
});

test("treats a trailing-slash direct route as the current exact page", () => {
  renderRoute("/creators/");

  const navigation = screen.getByRole("navigation", { name: "관리자 메뉴" });
  const menuLink = within(navigation).getByRole("link", {
    name: "크리에이터 풀",
  });

  expect(menuLink).toHaveClass("hsas-admin-sidebar__link--active");
  expect(menuLink).toHaveAttribute("data-section-selected", "true");
  expect(menuLink).toHaveAttribute("data-route-exact", "true");
  expect(menuLink).toHaveAttribute("aria-current", "page");
});

test("preserves visual fixture query state in the active work tab", () => {
  renderRoute("/creators?fixture=empty-state");

  const workTabs = screen.getByRole("navigation", { name: "작업 탭" });
  expect(within(workTabs).getByRole("link", { name: "크리에이터 풀" })).toHaveAttribute(
    "href",
    "/creators?fixture=empty-state",
  );
});

test("does not render the task progress panel on a normal authenticated route", () => {
  renderRoute("/creators");

  expect(
    screen.queryByRole("region", { name: "작업 진행상황" }),
  ).not.toBeInTheDocument();
});

test("renders server task runs on an authenticated administrator route", async () => {
  getTaskRunPanelApiMock().getTaskRunPanel.mockResolvedValueOnce({
    items: [{
      runId: "task-run-content-sync",
      taskType: "CONTENT_SYNC",
      triggerType: "SCHEDULED",
      status: "RUNNING",
      currentStep: "NEW_CONTENT_SYNC",
      progressMessage: null,
      totalCount: 2,
      processedCount: 1,
      succeededCount: 1,
      failedCount: 0,
      skippedCount: 0,
      progressPercent: 50,
      startedBy: null,
      startedAt: "2026-08-23T00:00:00Z",
      finishedAt: null,
    }],
    serverTime: "2026-08-23T00:00:00Z",
  });

  renderRoute("/creators");

  const panel = await screen.findByRole("region", { name: "작업 진행상황" });
  expect(within(panel).getByText("콘텐츠 동기화")).toBeInTheDocument();
  expect(within(panel).getByText("신규 콘텐츠 수집 중")).toBeInTheDocument();
  expect(within(panel).getAllByRole("listitem")).toHaveLength(1);
});

test("mounts the development TaskRun preview over the real creators page", async () => {
  getTaskRunPanelApiMock().getTaskRunPanel.mockClear();
  renderRoute("/creators?taskRunPreview=mixed");

  expect(await screen.findByRole("heading", { name: "크리에이터 풀" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "관리자 메뉴" })).toBeInTheDocument();
  const panel = screen.getByRole("region", { name: "작업 진행상황" });
  expect(within(panel).getByText("120건 처리에 실패했습니다")).toBeInTheDocument();
  expect(within(panel).getByText("248건 작업을 완료했습니다")).toBeInTheDocument();
  expect(within(panel).queryByText("DESIGN LAB")).not.toBeInTheDocument();
  expect(getTaskRunPanelApiMock().getTaskRunPanel).not.toHaveBeenCalled();
});

test("keeps the preview isolated from other real admin routes", async () => {
  getTaskRunPanelApiMock().getTaskRunPanel.mockClear();
  renderRoute("/settlements?taskRunPreview=mixed");

  await waitFor(() => {
    expect(getTaskRunPanelApiMock().getTaskRunPanel).toHaveBeenCalledTimes(1);
  });
  expect(screen.queryByText("DESIGN LAB")).not.toBeInTheDocument();
  expect(screen.queryByText("120건 처리에 실패했습니다")).not.toBeInTheDocument();
});

test("keeps the login route outside the task progress panel", () => {
  getTaskRunPanelApiMock().getTaskRunPanel.mockClear();
  renderRoute("/login", { authenticated: false });

  expect(
    screen.queryByRole("region", { name: "작업 진행상황" }),
  ).not.toBeInTheDocument();
  expect(getTaskRunPanelApiMock().getTaskRunPanel).not.toHaveBeenCalled();
});

test("renders only the unified administrator shell parts", () => {
  renderRoute("/creators");

  const shell = screen.getByTestId("admin-shell");
  expect(shell).toHaveAttribute("data-shell-part", "root");
  for (const part of ["sidebar", "work-tabs", "content"]) {
    expect(shell.querySelector(`[data-shell-part="${part}"]`)).toBeInTheDocument();
  }
  expect(shell.querySelector('[data-shell-part="topbar"]')).not.toBeInTheDocument();
  expect(within(shell).queryByText("더현대Hi 셀렉터스 운영")).not.toBeInTheDocument();
  expect(shell.querySelector('[data-shell-part="rail"]')).not.toBeInTheDocument();
  expect(screen.getByRole("main")).toHaveAttribute("id", "admin-main-content");
  expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
});

test("keeps the administrator identity and utility controls in the sidebar", () => {
  renderRoute("/creators");

  const shell = screen.getByTestId("admin-shell");
  expect(within(shell).getByText("테스트 관리자")).toBeInTheDocument();
  expect(within(shell).getByText("관리자 계정")).toBeInTheDocument();
  expect(within(shell).getByRole("button", { name: "환경설정" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(within(shell).getAllByRole("button", { name: "로그아웃" })).toHaveLength(1);
});

test("opens anchored environment settings with the original dark sidebar selected by default", () => {
  renderRoute("/creators");

  expect(document.documentElement).toHaveAttribute("data-sidebar-theme", "dark");
  expect(document.documentElement).not.toHaveAttribute("data-theme");
  expect(document.documentElement.style.colorScheme).toBe("");

  const trigger = screen.getByRole("button", { name: "환경설정" });
  fireEvent.click(trigger);

  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(screen.queryByRole("dialog", { name: "환경설정" })).not.toBeInTheDocument();
  const settings = screen.getByRole("group", { name: "환경설정" });
  expect(within(settings).getByRole("button", { name: "라이트 모드" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(within(settings).getByRole("button", { name: "다크 모드" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("switches and persists the selected theme immediately", () => {
  renderRoute("/creators");
  fireEvent.click(screen.getByRole("button", { name: "환경설정" }));

  const settings = screen.getByRole("group", { name: "환경설정" });
  fireEvent.click(within(settings).getByRole("button", { name: "라이트 모드" }));

  expect(within(settings).getByRole("button", { name: "라이트 모드" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(within(settings).getByRole("button", { name: "다크 모드" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(document.documentElement).toHaveAttribute("data-sidebar-theme", "light");
  expect(document.documentElement).not.toHaveAttribute("data-theme");
  expect(document.documentElement.style.colorScheme).toBe("");
  expect(localStorage.getItem("selectors-theme")).toBe("light");
});

test("closes environment settings with Escape and returns focus", () => {
  renderRoute("/creators");
  const trigger = screen.getByRole("button", { name: "환경설정" });
  fireEvent.click(trigger);

  fireEvent.keyDown(document, { key: "Escape" });

  expect(screen.queryByRole("group", { name: "환경설정" })).not.toBeInTheDocument();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveFocus();
});

test.each([
  ["dark", "dark", "다크 모드"],
  ["sepia", "dark", "다크 모드"],
] as const)(
  "restores stored theme %s as %s when the shell renders",
  (storedTheme, expectedTheme, selectedLabel) => {
    localStorage.setItem("selectors-theme", storedTheme);

    renderRoute("/creators");

    expect(document.documentElement).toHaveAttribute("data-sidebar-theme", expectedTheme);
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(document.documentElement.style.colorScheme).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "환경설정" }));
    expect(screen.getByRole("button", { name: selectedLabel })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
);

test("logs out to the login screen", async () => {
  renderRoute("/creators");

  fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

  expect(screen.getByRole("main")).toHaveTextContent("Hi-Selectors");
  expect(screen.queryByTestId("admin-shell")).not.toBeInTheDocument();
  expect(localStorage.getItem("selectors-auth")).toBeNull();
});

test("does not render icon-rail navigation controls", () => {
  renderRoute("/creators");

  const shell = screen.getByTestId("admin-shell");
  for (const controlName of ["즐겨찾기", "전체메뉴", "메뉴 편집"]) {
    expect(
      within(shell).queryByRole("button", { name: controlName }),
    ).not.toBeInTheDocument();
  }
});

test("does not render a favorite control for the current screen", () => {
  renderRoute("/creators");

  expect(
    screen.queryByRole("button", { name: "현재 화면 즐겨찾기" }),
  ).not.toBeInTheDocument();
});

const routeCases = [
  {
    path: "/creators",
    group: "recruitment",
    menuLabel: "크리에이터 풀",
    title: "크리에이터 풀",
    screenCode: "CR101",
    routeIsExact: true,
  },
  {
    path: "/proposals",
    group: "recruitment",
    menuLabel: "제안 이력",
    title: "제안 이력 관리",
    screenCode: "CR201",
    routeIsExact: true,
  },
  {
    path: "/cohorts",
    group: "recruitment",
    menuLabel: "기수 관리",
    title: "셀렉터스 기수 관리",
    screenCode: "SL101",
    routeIsExact: true,
  },
  {
    path: "/selectors",
    group: "operations",
    menuLabel: "셀렉터스 목록",
    title: "셀렉터스 목록",
    screenCode: "SL201",
    routeIsExact: true,
  },
  {
    path: "/applicants",
    group: "recruitment",
    menuLabel: "지원자 승인",
    title: "지원자 심사",
    screenCode: "AP101",
    routeIsExact: true,
  },
  {
    path: "/applicants/ap-001",
    group: "recruitment",
    menuLabel: "지원자 승인",
    title: "지원자 상세 심사",
    screenCode: "AP102",
    routeIsExact: false,
  },
  {
    path: "/campaigns",
    group: "operations",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP101",
    routeIsExact: true,
  },
  {
    path: "/campaigns/new",
    group: "operations",
    menuLabel: "캠페인 관리",
    title: "캠페인 등록",
    screenCode: "CP102",
    routeIsExact: false,
  },
  {
    path: "/campaigns/cp-001/edit",
    group: "operations",
    menuLabel: "캠페인 관리",
    title: "캠페인 수정",
    screenCode: "CP103",
    routeIsExact: false,
  },
  {
    path: "/content/inspections",
    group: "operations",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수",
    screenCode: "CT101",
    routeIsExact: true,
  },
  {
    path: "/content/inspections/ct-001",
    group: "operations",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수 상세",
    screenCode: "CT102",
    routeIsExact: false,
  },
  {
    path: "/performance",
    group: "performance",
    menuLabel: "셀렉터스 성과",
    title: "셀렉터스 성과",
    screenCode: "PF101",
    routeIsExact: true,
  },
  {
    path: "/performance/creators",
    group: "performance",
    menuLabel: "셀렉터스 성과",
    title: "셀렉터스 성과",
    screenCode: "PF201",
    routeIsExact: true,
  },
  {
    path: "/performance/contents",
    group: "performance",
    menuLabel: "콘텐츠 성과",
    title: "콘텐츠 영향력 분석",
    screenCode: "PF202",
    routeIsExact: true,
  },
  {
    path: "/settlements",
    group: "performance",
    menuLabel: "정산 관리",
    title: "정산 지급 관리",
    screenCode: "ST101",
    routeIsExact: true,
  },
  {
    path: "/notifications",
    group: "notifications",
    menuLabel: "발송 내역",
    title: "알림 및 메시지",
    screenCode: "NT101",
    routeIsExact: true,
  },
  {
    path: "/notifications/kakao-recipients",
    group: "notifications",
    menuLabel: "발송 내역",
    title: "카카오 수신 현황",
    screenCode: "NT102",
    routeIsExact: false,
  },
  {
    path: "/task-runs",
    group: "operations",
    menuLabel: "실행 이력",
    title: "작업 실행 이력",
    screenCode: "TR101",
    routeIsExact: true,
  },
] as const;

test.each(routeCases)(
  "$path selects its group and menu item",
  async ({ path, group, menuLabel, routeIsExact }) => {
    renderRoute(path);
    const loading = screen.queryByText("화면을 불러오는 중입니다.");
    if (loading) await waitForElementToBeRemoved(loading);

    const shell = screen.getByTestId("admin-shell");
    const sidebar = shell.querySelector('[data-shell-part="sidebar"]');
    expect(sidebar).toBeInTheDocument();
    const navigation = within(sidebar as HTMLElement).getByRole("navigation", {
      hidden: true,
      name: "관리자 메뉴",
    });
    expect(navigation).toHaveAttribute("data-selected-group", group);
    expect(
      navigation.querySelectorAll('[data-section-selected="true"]'),
    ).toHaveLength(1);
    expect(navigation.querySelectorAll('[aria-current="page"]')).toHaveLength(
      routeIsExact ? 1 : 0,
    );
    expect(navigation.querySelectorAll('[data-route-exact="true"]')).toHaveLength(
      routeIsExact ? 1 : 0,
    );

    const menuLink = within(navigation).getByRole("link", { hidden: true, name: menuLabel });
    expect(menuLink).toHaveClass("hsas-admin-sidebar__link--active");
    expect(menuLink).toHaveAttribute("data-section-selected", "true");
    if (routeIsExact) {
      expect(menuLink).toHaveAttribute("aria-current", "page");
      expect(menuLink).toHaveAttribute("data-route-exact", "true");
    } else {
      expect(menuLink).not.toHaveAttribute("aria-current");
      expect(menuLink).not.toHaveAttribute("data-route-exact");
    }
  },
);

test("keeps the login route outside the administrator shell", () => {
  renderRoute("/login");

  expect(screen.queryByRole("navigation", { name: "관리자 메뉴" })).not.toBeInTheDocument();
  expect(screen.queryByTestId("admin-shell")).not.toBeInTheDocument();
});
