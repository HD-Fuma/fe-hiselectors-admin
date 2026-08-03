import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";

test("renderRoute renders the Partners login route", () => {
  renderRoute("/login");

  expect(screen.getByRole("main")).toHaveTextContent("더현대Hi 협력사 업무지원시스템");
});

test("renders the administrator shell and its structural controls", () => {
  renderRoute("/creators");

  expect(screen.getByText("FUMA 관리자 시스템")).toBeInTheDocument();
  expect(screen.getByText("마이메뉴")).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "관리자 메뉴" })).toBeInTheDocument();

  const shell = screen.getByTestId("admin-shell");
  expect(shell).toHaveAttribute("data-shell-part", "root");
  for (const part of ["rail", "menu", "topbar", "work-tabs", "content"]) {
    expect(shell.querySelector(`[data-shell-part="${part}"]`)).toBeInTheDocument();
  }

  const rail = within(shell.querySelector('[data-shell-part="rail"]') as HTMLElement);
  for (const controlName of ["즐겨찾기", "전체메뉴", "메뉴 편집", "설정", "로그아웃"]) {
    expect(rail.getByRole("button", { name: controlName })).toBeInTheDocument();
  }

  const workTabs = screen.getByRole("navigation", { name: "작업 탭" });
  expect(within(workTabs).getByRole("link", { name: "크리에이터 풀" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("preserves visual fixture query state in the active work tab", () => {
  renderRoute("/creators?fixture=empty-state");

  const workTabs = screen.getByRole("navigation", { name: "작업 탭" });
  expect(within(workTabs).getByRole("link", { name: "크리에이터 풀" })).toHaveAttribute(
    "href",
    "/creators?fixture=empty-state",
  );
});

test("opens the deterministic two-level full menu fixture", () => {
  renderRoute("/?fixture=mega-menu");

  const dialog = screen.getByRole("dialog", { name: "전체메뉴" });
  expect(dialog).toBeInTheDocument();

  const groupNavigation = within(dialog).getByRole("navigation", { name: "전체메뉴 업무군" });
  for (const groupLabel of [
    "크리에이터",
    "셀렉터스",
    "지원자",
    "캠페인",
    "콘텐츠",
    "성과",
    "정산",
    "시스템",
  ]) {
    expect(within(groupNavigation).getByRole("button", { name: groupLabel })).toBeInTheDocument();
  }

  const childNavigation = within(dialog).getByRole("navigation", { name: "전체메뉴 하위 메뉴" });
  expect(within(childNavigation).getByRole("link", { name: "크리에이터 목록" })).toBeInTheDocument();
  expect(within(childNavigation).getByRole("link", { name: "제안 이력" })).toBeInTheDocument();
});

test("opens the full menu from the rail, focuses it, and isolates the shell", async () => {
  const user = userEvent.setup();
  renderRoute("/creators");
  const shell = screen.getByTestId("admin-shell");

  await user.click(screen.getByRole("button", { name: "전체메뉴" }));

  const dialog = screen.getByRole("dialog", { name: "전체메뉴" });
  expect(within(dialog).getByRole("button", { name: "전체메뉴 닫기" })).toHaveFocus();
  expect(shell).toHaveAttribute("aria-hidden", "true");
  expect(shell).toHaveAttribute("inert");
});

test("contains forward and backward tab focus inside the full menu", async () => {
  const user = userEvent.setup();
  renderRoute("/creators");

  await user.click(screen.getByRole("button", { name: "전체메뉴" }));

  const dialog = screen.getByRole("dialog", { name: "전체메뉴" });
  const firstControl = within(dialog).getByRole("button", { name: "전체메뉴 닫기" });
  const lastControl = within(dialog).getByRole("link", { name: "제안 이력" });
  expect(firstControl).toHaveFocus();

  await user.tab({ shift: true });
  expect(lastControl).toHaveFocus();
  await user.tab();
  expect(firstControl).toHaveFocus();
});

test("Escape closes the full menu, restores the shell, and returns focus to its trigger", async () => {
  const user = userEvent.setup();
  renderRoute("/creators");
  const shell = screen.getByTestId("admin-shell");
  const trigger = screen.getByRole("button", { name: "전체메뉴" });

  await user.click(trigger);
  await user.keyboard("{Escape}");

  expect(screen.queryByRole("dialog", { name: "전체메뉴" })).not.toBeInTheDocument();
  expect(shell).not.toHaveAttribute("aria-hidden");
  expect(shell).not.toHaveAttribute("inert");
  expect(trigger).toHaveFocus();
});

test("closing the deterministic full-menu fixture removes its query state", async () => {
  const user = userEvent.setup();
  const { router } = renderRoute("/?fixture=mega-menu");

  await user.click(screen.getByRole("button", { name: "전체메뉴 닫기" }));

  expect(screen.queryByRole("dialog", { name: "전체메뉴" })).not.toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/");
  expect(router.state.location.search).toBe("");
});

const routeCases = [
  {
    path: "/creators",
    group: "creators",
    menuLabel: "크리에이터 목록",
    title: "크리에이터 풀",
    screenCode: "CR101",
    menuIsCurrentPage: true,
  },
  {
    path: "/creators/cr-001",
    group: "creators",
    menuLabel: "크리에이터 목록",
    title: "크리에이터 상세",
    screenCode: "CR102",
    menuIsCurrentPage: false,
  },
  {
    path: "/proposals",
    group: "creators",
    menuLabel: "제안 이력",
    title: "제안 이력 관리",
    screenCode: "CR201",
    menuIsCurrentPage: true,
  },
  {
    path: "/cohorts",
    group: "selectors",
    menuLabel: "기수 관리",
    title: "셀렉터스 기수 관리",
    screenCode: "SL101",
    menuIsCurrentPage: true,
  },
  {
    path: "/selectors",
    group: "selectors",
    menuLabel: "셀렉터스 현황",
    title: "기수별 셀렉터스 현황",
    screenCode: "SL201",
    menuIsCurrentPage: true,
  },
  {
    path: "/selectors/qualifications",
    group: "selectors",
    menuLabel: "자격 관리",
    title: "셀렉터스 자격 관리",
    screenCode: "SL301",
    menuIsCurrentPage: true,
  },
  {
    path: "/applicants",
    group: "applicants",
    menuLabel: "지원자 목록",
    title: "지원자 심사",
    screenCode: "AP101",
    menuIsCurrentPage: true,
  },
  {
    path: "/applicants/ap-001",
    group: "applicants",
    menuLabel: "지원자 목록",
    title: "지원자 상세 심사",
    screenCode: "AP102",
    menuIsCurrentPage: false,
  },
  {
    path: "/campaigns",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP101",
    menuIsCurrentPage: true,
  },
  {
    path: "/campaigns/new",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 등록",
    screenCode: "CP102",
    menuIsCurrentPage: false,
  },
  {
    path: "/campaigns/cp-001/edit",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 수정",
    screenCode: "CP103",
    menuIsCurrentPage: false,
  },
  {
    path: "/content/reviews",
    group: "content",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수",
    screenCode: "CT101",
    menuIsCurrentPage: true,
  },
  {
    path: "/content/reviews/ct-001",
    group: "content",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수 상세",
    screenCode: "CT102",
    menuIsCurrentPage: false,
  },
  {
    path: "/content/violations",
    group: "content",
    menuLabel: "위반 관리",
    title: "위반 콘텐츠 관리",
    screenCode: "CT201",
    menuIsCurrentPage: true,
  },
  {
    path: "/performance",
    group: "performance",
    menuLabel: "성과 대시보드",
    title: "관리자 성과 대시보드",
    screenCode: "PF101",
    menuIsCurrentPage: true,
  },
  {
    path: "/performance/creators",
    group: "performance",
    menuLabel: "크리에이터 분석",
    title: "크리에이터 영향력 분석",
    screenCode: "PF201",
    menuIsCurrentPage: true,
  },
  {
    path: "/performance/contents",
    group: "performance",
    menuLabel: "콘텐츠 분석",
    title: "콘텐츠 영향력 분석",
    screenCode: "PF202",
    menuIsCurrentPage: true,
  },
  {
    path: "/settlements",
    group: "settlements",
    menuLabel: "정산 관리",
    title: "정산 지급 관리",
    screenCode: "ST101",
    menuIsCurrentPage: true,
  },
  {
    path: "/system/notices",
    group: "system",
    menuLabel: "공지사항",
    title: "공지사항 관리",
    screenCode: "SY101",
    menuIsCurrentPage: true,
  },
] as const;

test.each(routeCases)(
  "$path renders $screenCode with its selected group and menu item",
  ({ path, group, menuLabel, title, screenCode, menuIsCurrentPage }) => {
    renderRoute(path);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(screenCode)).toBeInTheDocument();

    const navigation = screen.getByRole("navigation", { name: "관리자 메뉴" });
    expect(navigation).toHaveAttribute("data-selected-group", group);
    const menuLink = within(navigation).getByRole("link", { name: menuLabel });
    expect(menuLink).toHaveClass("hsas-my-menu__link--active");
    if (menuIsCurrentPage) {
      expect(menuLink).toHaveAttribute("aria-current", "page");
    } else {
      expect(menuLink).not.toHaveAttribute("aria-current");
    }
    expect(menuLink).toHaveAttribute("data-section-selected", "true");
  },
);

test("keeps the login route outside the administrator shell", () => {
  renderRoute("/login");

  expect(screen.queryByRole("navigation", { name: "관리자 메뉴" })).not.toBeInTheDocument();
  expect(screen.queryByTestId("admin-shell")).not.toBeInTheDocument();
});
