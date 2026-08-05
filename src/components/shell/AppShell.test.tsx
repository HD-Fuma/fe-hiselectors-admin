import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";

const expectedSidebarLinks = [
  ["크리에이터 목록", "/creators"],
  ["제안 이력", "/proposals"],
  ["기수 관리", "/cohorts"],
  ["셀렉터스 현황", "/selectors"],
  ["자격 관리", "/selectors/qualifications"],
  ["지원자 목록", "/applicants"],
  ["캠페인 관리", "/campaigns"],
  ["콘텐츠 검수", "/content/reviews"],
  ["위반 관리", "/content/violations"],
  ["성과 대시보드", "/performance"],
  ["크리에이터 분석", "/performance/creators"],
  ["콘텐츠 분석", "/performance/contents"],
  ["정산 관리", "/settlements"],
] as const;

test("renderRoute renders the Partners login route", () => {
  renderRoute("/login");

  expect(screen.getByRole("main")).toHaveTextContent("더현대Hi 협력사 업무지원시스템");
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
  expect(within(navigation).getAllByRole("link")).toHaveLength(13);
  for (const [label, href] of expectedSidebarLinks) {
    expect(within(navigation).getByRole("link", { name: label })).toHaveAttribute(
      "href",
      href,
    );
  }

  for (const groupLabel of [
    "크리에이터",
    "셀렉터스",
    "지원자",
    "캠페인",
    "콘텐츠",
    "성과",
    "정산",
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

test("treats a trailing-slash direct route as the current exact page", () => {
  renderRoute("/creators/");

  const navigation = screen.getByRole("navigation", { name: "관리자 메뉴" });
  const menuLink = within(navigation).getByRole("link", {
    name: "크리에이터 목록",
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
    await router.navigate("/campaigns/new");
  });

  const workTabs = screen.getByRole("navigation", { name: "작업 탭" });
  expect(within(workTabs).getByRole("link", { name: "크리에이터 풀" })).toBeInTheDocument();
  expect(within(workTabs).getByRole("link", { name: "캠페인 등록" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await user.click(
    within(workTabs).getByRole("button", { name: "캠페인 등록 탭 닫기" }),
  );

  expect(screen.getByRole("heading", { name: "크리에이터 풀" })).toBeInTheDocument();
});

test("keeps the administrator identity and utility controls in the sidebar", () => {
  renderRoute("/creators");

  const shell = screen.getByTestId("admin-shell");
  expect(within(shell).getByText("관리자")).toBeInTheDocument();
  expect(within(shell).getByText("관리자 계정")).toBeInTheDocument();
  expect(within(shell).getAllByRole("button", { name: "설정" })).toHaveLength(1);
  expect(within(shell).getAllByRole("button", { name: "로그아웃" })).toHaveLength(1);
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
    menuLabel: "크리에이터 목록",
    title: "크리에이터 풀",
    screenCode: "CR101",
    routeIsExact: true,
  },
  {
    path: "/creators/cr-001",
    group: "creators",
    menuLabel: "크리에이터 목록",
    title: "크리에이터 상세",
    screenCode: "CR102",
    routeIsExact: false,
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
    menuLabel: "셀렉터스 현황",
    title: "기수별 셀렉터스 현황",
    screenCode: "SL201",
    routeIsExact: true,
  },
  {
    path: "/selectors/qualifications",
    group: "selectors",
    menuLabel: "자격 관리",
    title: "셀렉터스 자격 관리",
    screenCode: "SL301",
    routeIsExact: true,
  },
  {
    path: "/applicants",
    group: "applicants",
    menuLabel: "지원자 목록",
    title: "지원자 심사",
    screenCode: "AP101",
    routeIsExact: true,
  },
  {
    path: "/applicants/ap-001",
    group: "applicants",
    menuLabel: "지원자 목록",
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
    path: "/content/reviews",
    group: "content",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수",
    screenCode: "CT101",
    routeIsExact: true,
  },
  {
    path: "/content/reviews/ct-001",
    group: "content",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수 상세",
    screenCode: "CT102",
    routeIsExact: false,
  },
  {
    path: "/content/violations",
    group: "content",
    menuLabel: "위반 관리",
    title: "위반 콘텐츠 관리",
    screenCode: "CT201",
    routeIsExact: true,
  },
  {
    path: "/performance",
    group: "performance",
    menuLabel: "성과 대시보드",
    title: "관리자 성과 대시보드",
    screenCode: "PF101",
    routeIsExact: true,
  },
  {
    path: "/performance/creators",
    group: "performance",
    menuLabel: "크리에이터 분석",
    title: "크리에이터 영향력 분석",
    screenCode: "PF201",
    routeIsExact: true,
  },
  {
    path: "/performance/contents",
    group: "performance",
    menuLabel: "콘텐츠 분석",
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
] as const;

test.each(routeCases)(
  "$path renders $screenCode with its selected group and menu item",
  ({ path, group, menuLabel, title, screenCode, routeIsExact }) => {
    renderRoute(path);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(screenCode)).toBeInTheDocument();

    const shell = screen.getByTestId("admin-shell");
    const sidebar = shell.querySelector('[data-shell-part="sidebar"]');
    expect(sidebar).toBeInTheDocument();
    const navigation = within(sidebar as HTMLElement).getByRole("navigation", {
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

    const menuLink = within(navigation).getByRole("link", { name: menuLabel });
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
