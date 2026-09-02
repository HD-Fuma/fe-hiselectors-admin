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
  localStorage.removeItem("selectors-content-fast-mode");
  localStorage.removeItem("selectors-applicant-auto-rejection");
  localStorage.removeItem("creator-discovery-current-month-only");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-sidebar-theme");
  document.documentElement.style.removeProperty("color-scheme");
}

beforeEach(resetTheme);
afterEach(() => {
  resetTheme();
  vi.unstubAllGlobals();
});

const expectedSidebarLinks = [
  ["대시보드", "/dashboard"],
  ["기수 관리", "/cohorts"],
  ["크리에이터 풀", "/creators"],
  ["제안 이력", "/proposals"],
  ["지원자 승인", "/applicants"],
  ["셀렉터스 목록", "/selectors"],
  ["캠페인 관리", "/campaigns"],
  ["콘텐츠 검수", "/content/inspections"],
  ["셀렉터스 성과", "/performance/selectors"],
  ["콘텐츠 성과", "/performance/contents"],
  ["정산 관리", "/settlements"],
  ["발송 내역", "/notifications"],
  ["모니터링", "/task-runs"],
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
  expect(sidebarQueries.getByRole("link", { name: "더현대Hi" })).toHaveAttribute("href", "/");
  expect(screen.getAllByRole("navigation", { name: "관리자 메뉴" })).toHaveLength(1);
  const sidebarLinks = within(navigation).getAllByRole("link");
  expect(sidebarLinks).toHaveLength(expectedSidebarLinks.length);
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
    "시스템 관리",
  ]) {
    expect(
      within(navigation).getByRole("heading", { name: groupLabel }),
    ).toBeInTheDocument();
  }
  expect(within(navigation).queryByRole("heading", { name: "대시보드" }))
    .not.toBeInTheDocument();
  expect(within(navigation).queryByRole("button", { name: "대시보드" }))
    .not.toBeInTheDocument();

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
  expect(within(panel).getByText("신규 콘텐츠 수집")).toBeInTheDocument();
  expect(within(panel).getByText("기존 콘텐츠 수집")).toBeInTheDocument();
  expect(within(panel).getAllByText("진행 정보 확인 중")).toHaveLength(2);
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

test("opens and closes environment settings only when the icon is clicked", () => {
  renderRoute("/creators");

  expect(document.documentElement).toHaveAttribute("data-sidebar-theme", "light");
  expect(document.documentElement).not.toHaveAttribute("data-theme");
  expect(document.documentElement.style.colorScheme).toBe("");

  const trigger = screen.getByRole("button", { name: "환경설정" });
  const anchor = trigger.parentElement as HTMLElement;
  fireEvent.mouseEnter(anchor);

  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("group", { name: "환경설정" })).not.toBeInTheDocument();
  fireEvent.click(trigger);

  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(screen.queryByRole("dialog", { name: "환경설정" })).not.toBeInTheDocument();
  const settings = screen.getByRole("group", { name: "환경설정" });
  const themeMenuTrigger = within(settings).getByRole("button", { name: "화면 모드" });
  expect(themeMenuTrigger).toHaveAttribute("aria-expanded", "false");
  expect(within(settings).queryByRole("button", { name: "라이트 모드" })).not.toBeInTheDocument();
  expect(within(settings).getByRole("button", { name: "검수 상태 초기화" })).toBeEnabled();
  expect(within(settings).getByRole("button", { name: "크리에이터 풀 초기화" })).toBeEnabled();

  fireEvent.click(themeMenuTrigger);

  expect(themeMenuTrigger).toHaveAttribute("aria-expanded", "true");
  const themeMenu = within(settings).getByRole("group", { name: "화면 모드" });
  expect(within(themeMenu).getByRole("button", { name: "라이트 모드" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(within(themeMenu).getByRole("button", { name: "다크 모드" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  fireEvent.mouseLeave(anchor);
  expect(screen.getByRole("group", { name: "환경설정" })).toBeInTheDocument();
  fireEvent.click(trigger);
  expect(screen.queryByRole("group", { name: "환경설정" })).not.toBeInTheDocument();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("confirms fast mode before persisting the scoped content batch setting", () => {
  renderRoute("/content/inspections");
  fireEvent.click(screen.getByRole("button", { name: "환경설정" }));
  const settings = screen.getByRole("group", { name: "환경설정" });
  const fastMode = within(settings).getByRole("checkbox", { name: "FAST 모드" });

  expect(fastMode).not.toBeChecked();
  fireEvent.click(fastMode);

  const confirmation = screen.getByRole("alertdialog", { name: "FAST 모드를 켤까요?" });
  expect(confirmation).toHaveTextContent("DB에 등록된 테스트 계정만 대상으로 실행됩니다.");
  expect(fastMode).not.toBeChecked();
  expect(localStorage.getItem("selectors-content-fast-mode")).toBeNull();

  fireEvent.click(within(confirmation).getByRole("button", { name: "취소" }));

  expect(screen.queryByRole("alertdialog", { name: "FAST 모드를 켤까요?" })).not.toBeInTheDocument();
  expect(fastMode).not.toBeChecked();
  expect(localStorage.getItem("selectors-content-fast-mode")).toBeNull();

  fireEvent.click(fastMode);
  const secondConfirmation = screen.getByRole("alertdialog", { name: "FAST 모드를 켤까요?" });
  fireEvent.click(within(secondConfirmation).getByRole("button", { name: "FAST 모드 켜기" }));

  expect(screen.queryByRole("alertdialog", { name: "FAST 모드를 켤까요?" })).not.toBeInTheDocument();
  expect(fastMode).toBeChecked();
  expect(localStorage.getItem("selectors-content-fast-mode")).toBe("true");

  fireEvent.click(fastMode);
  expect(fastMode).not.toBeChecked();
  expect(localStorage.getItem("selectors-content-fast-mode")).toBeNull();
});

test("toggles applicant automatic rejection in environment settings", () => {
  renderRoute("/applicants");
  fireEvent.click(screen.getByRole("button", { name: "환경설정" }));
  const settings = screen.getByRole("group", { name: "환경설정" });
  const toggle = within(settings).getByRole("checkbox", { name: "지원자 자동 반려" });

  expect(toggle).toBeChecked();
  fireEvent.click(toggle);
  expect(toggle).not.toBeChecked();
  expect(localStorage.getItem("selectors-applicant-auto-rejection")).toBe("false");
});

test("limits creator discovery to videos uploaded this month from environment settings", () => {
  renderRoute("/creators");
  fireEvent.click(screen.getByRole("button", { name: "환경설정" }));
  const settings = screen.getByRole("group", { name: "환경설정" });
  const toggle = within(settings).getByRole("checkbox", { name: "이번 달 영상만 발굴" });

  expect(toggle).not.toBeChecked();
  fireEvent.click(toggle);
  expect(toggle).toBeChecked();
  expect(localStorage.getItem("creator-discovery-current-month-only")).toBe("true");

  fireEvent.click(toggle);
  expect(toggle).not.toBeChecked();
  expect(localStorage.getItem("creator-discovery-current-month-only")).toBeNull();
});

test("resets the creator pool from environment settings after typed confirmation", async () => {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("confirmation=DELETE_CREATOR_POOL") && init?.method === "DELETE") {
      return Promise.resolve(new Response(JSON.stringify({
        success: true,
        data: { softDeletedCount: 598 },
      })));
    }
    if (url.endsWith("/api/admin/categories")) {
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] })));
    }
    if (url.includes("/api/admin/creators?")) {
      return Promise.resolve(new Response(JSON.stringify({
        success: true,
        data: {
          content: [{
            id: 113,
            snsCode: "INSTAGRAM",
            accountId: "seo.yeon",
            creatorName: "김서연",
            profileImageUrl: null,
            followerCount: 82400,
            engagementRate: 4.25,
            lastContentAt: "2026-08-12T20:00:00",
            category: "BEAUTY",
            recent90DayContentCount: 14,
          }],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 20,
        },
      })));
    }
    return Promise.resolve(new Response(JSON.stringify({ success: true, data: {} })));
  });
  vi.stubGlobal("fetch", fetchMock);
  renderRoute("/creators");

  fireEvent.click(await screen.findByRole("checkbox", { name: "김서연 선택" }));
  expect(screen.getByRole("button", { name: "선택 1명 제안 발송" })).toBeEnabled();

  fireEvent.click(screen.getByRole("button", { name: "환경설정" }));
  const settings = screen.getByRole("group", { name: "환경설정" });
  fireEvent.click(within(settings).getByRole("button", { name: "크리에이터 풀 초기화" }));

  const dialog = screen.getByRole("alertdialog", { name: "크리에이터 풀 초기화" });
  const confirm = within(dialog).getByRole("button", { name: "초기화" });
  expect(confirm).toBeDisabled();

  fireEvent.change(within(dialog).getByRole("textbox", { name: "초기화 확인 문구" }), {
    target: { value: "초기화" },
  });
  expect(confirm).toBeEnabled();
  fireEvent.click(confirm);

  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/api/admin/creators?confirmation=DELETE_CREATOR_POOL"),
    expect.objectContaining({ method: "DELETE" }),
  ));
  await waitFor(() => expect(screen.queryByRole("alertdialog", {
    name: "크리에이터 풀 초기화",
  })).not.toBeInTheDocument());
  expect(within(settings).getByRole("status"))
    .toHaveTextContent("크리에이터 풀 598건을 초기화했습니다.");
  expect(screen.getByRole("button", { name: "선택 0명 제안 발송" })).toBeDisabled();
  await waitFor(() => expect(fetchMock.mock.calls.filter(([input, requestInit]) => (
    String(input).includes("/api/admin/creators?") && requestInit?.method !== "DELETE"
  ))).toHaveLength(2));
});

test("resets YouTube and Instagram test data from editable default identifiers in settings", async () => {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    if (String(input).includes("/api/admin/selectors/test-reset")) {
      return Promise.resolve(new Response(JSON.stringify({
        success: true,
        data: {
          snsCode: "INSTAGRAM",
          accountId: "hi_selectors",
          selectorsIds: [7],
          applicationIds: [11],
          deletedRowCount: 23,
          deletedRowCounts: { selectors: 1, application: 1 },
        },
      })));
    }
    return Promise.resolve(new Response(JSON.stringify({ success: true, data: {} })));
  });
  vi.stubGlobal("fetch", fetchMock);
  renderRoute("/dashboard");

  fireEvent.click(screen.getByRole("button", { name: "환경설정" }));
  const settings = screen.getByRole("group", { name: "환경설정" });
  fireEvent.click(within(settings).getByRole("button", { name: "셀렉터스 데이터 영구 삭제" }));

  const dialog = screen.getByRole("alertdialog", { name: "셀렉터스 데이터 영구 삭제" });
  const confirm = within(dialog).getByRole("button", { name: "영구 삭제" });
  expect(confirm).toBeEnabled();
  expect(within(dialog).getByRole("textbox", { name: "삭제 대상 계정 ID" }))
    .toHaveValue("UCD2RQE52TloxzZxZ2fyq8HQ");

  fireEvent.change(within(dialog).getByRole("combobox", { name: "삭제 대상 플랫폼" }), {
    target: { value: "INSTAGRAM" },
  });
  expect(within(dialog).getByRole("textbox", { name: "삭제 대상 계정 ID" }))
    .toHaveValue("@hi_selectors");
  fireEvent.click(confirm);

  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/api/admin/selectors/test-reset?"),
    expect.objectContaining({ method: "DELETE" }),
  ));
  expect(String(fetchMock.mock.calls.find(([input]) => (
    String(input).includes("/api/admin/selectors/test-reset")
  ))?.[0])).toContain("snsCode=INSTAGRAM");
  expect(String(fetchMock.mock.calls.find(([input]) => (
    String(input).includes("/api/admin/selectors/test-reset")
  ))?.[0])).toContain("accountId=%40hi_selectors");

  await waitFor(() => expect(screen.queryByRole("alertdialog", {
    name: "셀렉터스 데이터 영구 삭제",
  })).not.toBeInTheDocument());
  expect(within(settings).getByRole("status"))
    .toHaveTextContent("hi_selectors 계정을 리셋했습니다.");
});

test("keeps deletion ready when the platform changes", () => {
  renderRoute("/dashboard");

  fireEvent.click(screen.getByRole("button", { name: "환경설정" }));
  const settings = screen.getByRole("group", { name: "환경설정" });
  fireEvent.click(within(settings).getByRole("button", { name: "셀렉터스 데이터 영구 삭제" }));

  const dialog = screen.getByRole("alertdialog", { name: "셀렉터스 데이터 영구 삭제" });
  const confirm = within(dialog).getByRole("button", { name: "영구 삭제" });
  expect(confirm).toBeEnabled();

  fireEvent.change(within(dialog).getByRole("combobox", { name: "삭제 대상 플랫폼" }), {
    target: { value: "INSTAGRAM" },
  });
  expect(confirm).toBeEnabled();
});

test("keeps the settings popover open behind the test reset dialog", () => {
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));
  renderRoute("/dashboard");

  fireEvent.click(screen.getByRole("button", { name: "환경설정" }));
  const settings = screen.getByRole("group", { name: "환경설정" });
  fireEvent.click(within(settings).getByRole("button", { name: "셀렉터스 데이터 영구 삭제" }));
  const dialog = screen.getByRole("alertdialog", { name: "셀렉터스 데이터 영구 삭제" });

  fireEvent.keyDown(document, { key: "Escape" });

  expect(settings).toBeInTheDocument();
  expect(dialog).toBeInTheDocument();
});

test("keeps settings focus behind the creator reset dialog while a request is running", async () => {
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));
  renderRoute("/dashboard");

  const settingsTrigger = screen.getByRole("button", { name: "환경설정" });
  fireEvent.click(settingsTrigger);
  const settings = screen.getByRole("group", { name: "환경설정" });
  fireEvent.click(within(settings).getByRole("button", { name: "크리에이터 풀 초기화" }));
  const dialog = screen.getByRole("alertdialog", { name: "크리에이터 풀 초기화" });
  fireEvent.change(within(dialog).getByRole("textbox", { name: "초기화 확인 문구" }), {
    target: { value: "초기화" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "초기화" }));
  await within(dialog).findByRole("button", { name: "초기화 중..." });

  fireEvent.keyDown(document, { key: "Escape" });

  expect(settings).toBeInTheDocument();
  expect(dialog).toBeInTheDocument();
  expect(settingsTrigger).not.toHaveFocus();
});

test("switches and persists the selected theme immediately", () => {
  localStorage.setItem("selectors-theme", "dark");
  renderRoute("/creators");
  fireEvent.click(screen.getByRole("button", { name: "환경설정" }));

  const settings = screen.getByRole("group", { name: "환경설정" });
  fireEvent.click(within(settings).getByRole("button", { name: "화면 모드" }));
  const themeMenu = within(settings).getByRole("group", { name: "화면 모드" });
  fireEvent.click(within(themeMenu).getByRole("button", { name: "라이트 모드" }));

  expect(within(themeMenu).getByRole("button", { name: "라이트 모드" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(within(themeMenu).getByRole("button", { name: "다크 모드" })).toHaveAttribute(
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
  ["light", "light", "라이트 모드"],
  ["dark", "dark", "다크 모드"],
  ["sepia", "light", "라이트 모드"],
] as const)(
  "restores stored theme %s as %s when the shell renders",
  (storedTheme, expectedTheme, selectedLabel) => {
    localStorage.setItem("selectors-theme", storedTheme);

    renderRoute("/creators");

    expect(document.documentElement).toHaveAttribute("data-sidebar-theme", expectedTheme);
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(document.documentElement.style.colorScheme).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "환경설정" }));
    fireEvent.click(screen.getByRole("button", { name: "화면 모드" }));
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
    path: "/dashboard",
    group: "dashboard",
    menuLabel: "대시보드",
    title: "대시보드",
    screenCode: "DB101",
    routeIsExact: true,
  },
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
    group: "notifications",
    menuLabel: "모니터링",
    title: "모니터링",
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
