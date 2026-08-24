import { act, screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";

const expectedSidebarLinks = [
  ["크리에이터 풀", "/creators"],
  ["제안 이력", "/proposals"],
  ["기수 관리", "/cohorts"],
  ["셀렉터스 목록", "/selectors"],
  ["우수 활동자", "/selectors/excellent"],
  ["지원자 승인", "/applicants"],
  ["캠페인 관리", "/campaigns"],
  ["콘텐츠 검수", "/content/inspections"],
  ["셀렉터스 성과", "/performance/selectors"],
  ["콘텐츠 성과", "/performance/contents"],
  ["캠페인 성과", "/performance/products"],
  ["정산 관리", "/settlements"],
  ["발송 내역", "/notifications"],
  ["카카오 수신 현황", "/notifications/kakao-recipients"],
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
  expect(within(navigation).getAllByRole("link")).toHaveLength(14);
  for (const [label, href] of expectedSidebarLinks) {
    expect(within(navigation).getByRole("link", { name: label })).toHaveAttribute(
      "href",
      href,
    );
  }
  expect(within(navigation).queryByRole("link", { name: "위반 관리" })).not.toBeInTheDocument();

  for (const groupLabel of [
    "크리에이터",
    "셀렉터스",
    "지원자",
    "캠페인",
    "콘텐츠",
    "성과",
    "정산",
    "알림 및 메시지",
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
});

test("opens and closes work tabs as screens are visited", async () => {
  const user = userEvent.setup();
  const { router } = renderRoute("/creators");

  await act(async () => {
    await router.navigate("/performance/contents");
  });

  const workTabs = screen.getByRole("navigation", { name: "작업 탭" });
  expect(within(workTabs).getByRole("link", { name: "크리에이터 풀" })).toBeInTheDocument();
  expect(within(workTabs).getByRole("link", { name: "콘텐츠 성과" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await user.click(
    within(workTabs).getByRole("button", { name: "콘텐츠 성과 탭 닫기" }),
  );

  expect(await screen.findByRole(
    "heading",
    { name: "크리에이터 풀" },
    { timeout: 3_000 },
  )).toBeInTheDocument();
});

test("keeps the administrator identity and utility controls in the sidebar", () => {
  renderRoute("/creators");

  const shell = screen.getByTestId("admin-shell");
  expect(within(shell).getByText("관리자")).toBeInTheDocument();
  expect(within(shell).getByText("관리자 계정")).toBeInTheDocument();
  expect(within(shell).queryByRole("button", { name: "설정" })).not.toBeInTheDocument();
  expect(within(shell).getAllByRole("button", { name: "로그아웃" })).toHaveLength(1);
});

test("logs out to the login screen", async () => {
  const user = userEvent.setup();
  renderRoute("/creators");

  await user.click(screen.getByRole("button", { name: "로그아웃" }));

  expect(screen.getByRole("main")).toHaveTextContent("Hi-Selectors");
  expect(screen.queryByTestId("admin-shell")).not.toBeInTheDocument();
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
    group: "creators",
    menuLabel: "크리에이터 풀",
    title: "크리에이터 풀",
    screenCode: "CR101",
    routeIsExact: true,
  },
  {
    path: "/proposals",
    group: "creators",
    menuLabel: "제안 이력",
    title: "제안 이력 관리",
    screenCode: "CR201",
    routeIsExact: true,
  },
  {
    path: "/cohorts",
    group: "selectors",
    menuLabel: "기수 관리",
    title: "셀렉터스 기수 관리",
    screenCode: "SL101",
    routeIsExact: true,
  },
  {
    path: "/selectors",
    group: "selectors",
    menuLabel: "셀렉터스 목록",
    title: "셀렉터스 목록",
    screenCode: "SL201",
    routeIsExact: true,
  },
  {
    path: "/selectors/excellent",
    group: "selectors",
    menuLabel: "우수 활동자",
    title: "우수 활동자",
    screenCode: "SL302",
    routeIsExact: true,
  },
  {
    path: "/applicants",
    group: "applicants",
    menuLabel: "지원자 승인",
    title: "지원자 심사",
    screenCode: "AP101",
    routeIsExact: true,
  },
  {
    path: "/applicants/ap-001",
    group: "applicants",
    menuLabel: "지원자 승인",
    title: "지원자 상세 심사",
    screenCode: "AP102",
    routeIsExact: false,
  },
  {
    path: "/campaigns",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP101",
    routeIsExact: true,
  },
  {
    path: "/campaigns/new",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 등록",
    screenCode: "CP102",
    routeIsExact: false,
  },
  {
    path: "/campaigns/cp-001/edit",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 수정",
    screenCode: "CP103",
    routeIsExact: false,
  },
  {
    path: "/content/inspections",
    group: "content",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수",
    screenCode: "CT101",
    routeIsExact: true,
  },
  {
    path: "/content/inspections/ct-001",
    group: "content",
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
    group: "settlements",
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
    menuLabel: "카카오 수신 현황",
    title: "카카오 수신 현황",
    screenCode: "NT102",
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
