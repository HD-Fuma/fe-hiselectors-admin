import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";
import type { CreatorProposalContact } from "./fixtures";

// @ts-expect-error An email proposal channel requires a usable email address.
const invalidEmailContact: CreatorProposalContact = { availableProposalChannels: ["이메일"] };
void invalidEmailContact;

function expectColumnHeaders(names: string[], region: HTMLElement = document.body) {
  for (const name of names) {
    expect(within(region).getByRole("columnheader", { name })).toBeInTheDocument();
  }
}

describe("creator pool", () => {
  test("renders the populated creator pool as profile-first cards", () => {
    renderRoute("/creators");

    expect(screen.getByRole("heading", { hidden: true, name: "크리에이터 풀" })).toBeInTheDocument();
    expect(screen.getByText("CR101")).toBeInTheDocument();

    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(within(search).getByRole("textbox", { name: "키워드" })).toHaveAttribute(
      "placeholder",
      "이름 또는 채널명 검색",
    );
    expect(within(search).getByRole("textbox", { name: "최소 팔로워·구독자" })).toBeInTheDocument();
    expect(within(search).getByRole("textbox", { name: "최대 팔로워·구독자" })).toBeInTheDocument();
    expect(within(search).queryByRole("combobox", { name: "카테고리" })).not.toBeInTheDocument();
    expect(within(search).queryByRole("combobox", { name: "티어" })).not.toBeInTheDocument();
    expect(within(search).getByRole("combobox", { name: "플랫폼" })).toHaveTextContent(
      "전체InstagramYouTube",
    );
    expect(within(search).getByRole("button", { name: "조회" })).toBeInTheDocument();
    expect(within(search).getByRole("button", { name: "초기화" })).toBeInTheDocument();

    expect(screen.getByText("총 4건")).toBeInTheDocument();
    expect(screen.getByText("ER순")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "카드 보기" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "목록 보기" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    const cards = screen.getByRole("list", { name: "크리에이터 목록" });
    expect(cards.querySelectorAll(':scope > [role="listitem"]')).toHaveLength(4);
    for (const name of ["김서연", "박도윤", "이지아", "오하늘"]) {
      expect(
        within(cards).getByRole("article", { name: `${name} 크리에이터 카드` }),
      ).toBeInTheDocument();
    }
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
    expect(screen.getByText("페이지당 20개")).toBeInTheDocument();
  });

  test("switches to the preserved branded dense table and back", async () => {
    const user = userEvent.setup();
    renderRoute("/creators");

    await user.click(screen.getByRole("button", { name: "목록 보기" }));

    expect(screen.getByRole("button", { name: "목록 보기" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "카드 보기" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.queryByRole("list", { name: "크리에이터 목록" })).not.toBeInTheDocument();
    const results = screen.getByRole("region", { name: "크리에이터 목록" });
    expect(within(results).getByRole("table")).toBeInTheDocument();
    for (const name of [
      "ID",
      "이름",
      "플랫폼",
      "계정",
      "키워드",
      "팔로워·구독자",
      "ER",
      "최근 활동일",
      "상세",
    ]) {
      expect(within(results).getByRole("columnheader", { name })).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "카드 보기" }));

    expect(screen.getByRole("list", { name: "크리에이터 목록" })).toBeInTheDocument();
  });

  test("sorts both card and table results by the eligible fixture ER and shows unavailable ER explicitly", async () => {
    const user = userEvent.setup();
    renderRoute("/creators");

    const cards = screen.getByRole("list", { name: "크리에이터 목록" });
    expect(within(cards).getAllByRole("article").map((card) => card.getAttribute("aria-label"))).toEqual([
      "김서연 크리에이터 카드",
      "이지아 크리에이터 카드",
      "오하늘 크리에이터 카드",
      "박도윤 크리에이터 카드",
    ]);

    await user.click(screen.getByRole("button", { name: "목록 보기" }));
    const rows = within(screen.getByRole("region", { name: "크리에이터 목록" })).getAllByRole("row");
    expect(rows.at(-1)).toHaveTextContent("박도윤");
    expect(rows.at(-1)).toHaveTextContent("집계 불가");
  });

  test("shows exactly one Instagram or YouTube profile in each fallback-table row", async () => {
    const user = userEvent.setup();
    renderRoute("/creators");
    await user.click(screen.getByRole("button", { name: "목록 보기" }));

    const results = screen.getByRole("region", { name: "크리에이터 목록" });
    const ziaRow = within(results).getByRole("row", { name: /cr-003 이지아/ });
    expect(within(ziaRow).getByText("Instagram")).toBeInTheDocument();
    expect(within(ziaRow).getByRole("img", { name: "Instagram 플랫폼" })).toBeInTheDocument();
    expect(within(ziaRow).queryByRole("img", { name: "YouTube 플랫폼" })).not.toBeInTheDocument();
    expect(within(results).queryByText("Facebook")).not.toBeInTheDocument();
    expect(
      within(results).queryAllByRole("row", { name: /Instagram 플랫폼\s*Instagram/ }),
    ).toHaveLength(0);
  });

  test("renders one explicit empty state instead of a card list or table", () => {
    renderRoute("/creators?fixture=empty");

    expect(
      screen.getByRole("heading", { hidden: true, name: "크리에이터 풀" }),
    ).toBeInTheDocument();
    expect(screen.getByText("총 0건")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "검색 결과가 없습니다." })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "크리에이터 목록" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("creator detail", () => {
  test("opens creator detail as a dismissible side panel over the creator list", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/creators/cr-001");

    expect(screen.getByRole("dialog", { name: "크리에이터 상세" })).toBeInTheDocument();
    expect(screen.getByText("크리에이터 풀", { selector: "h1" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "상세 패널 닫기" }));
    expect(router.state.location.pathname).toBe("/creators");
  });

  test("renders the creator analysis report, channel metrics, and fixed email proposal", () => {
    renderRoute("/creators/cr-001");
    const detail = screen.getByRole("dialog", { name: "크리에이터 상세" });
    const panel = within(detail);

    expect(panel.getByRole("heading", { name: "크리에이터 상세" })).toBeInTheDocument();
    expect(panel.getByText("CR102")).toBeInTheDocument();
    const sections = panel.getByRole("navigation", { name: "섹션" });
    expect(within(sections).getByText("대표 콘텐츠")).toHaveAttribute("aria-current", "page");
    expect(within(sections).getByText("기본 정보")).toBeInTheDocument();
    expect(within(sections).getByText("크리에이터 분석")).toBeInTheDocument();
    expect(within(sections).getByText("영입 제안")).toBeInTheDocument();

    expect(panel.getByText("cr-001")).toBeInTheDocument();
    expect(panel.getByText("김서연")).toBeInTheDocument();
    expect(panel.getByText("뷰티 / 패션")).toBeInTheDocument();
    expect(panel.getAllByText("82,400")).toHaveLength(4);
    expectColumnHeaders([
      "플랫폼",
      "채널",
      "팔로워·구독자",
      "평균 조회 수",
      "평균 반응 수",
    ], detail);
    expect(panel.getAllByText("@seo.yeon")).toHaveLength(2);
    expect(panel.getAllByText("48,200")).toHaveLength(2);
    expect(panel.getAllByText("3,278")).toHaveLength(1);
    const featured = panel.getByRole("region", { name: "대표 콘텐츠" });
    expect(within(featured).getAllByRole("link", { name: /김서연 대표 게시글:/ })).toHaveLength(3);
    for (const views of ["98,600", "74,200", "63,100"]) {
      expect(within(featured).getByText(views)).toBeInTheDocument();
    }
    const channels = panel.getByRole("region", { name: "플랫폼별 채널" });
    expect(within(channels).getAllByRole("row")).toHaveLength(2);

    expect(panel.getByRole("heading", { name: "크리에이터 분석" })).toBeInTheDocument();
    expect(panel.getByRole("heading", { name: "정량 분석" })).toBeInTheDocument();
    expect(panel.getByRole("heading", { name: "AI 정성 분석" })).toBeInTheDocument();
    expect(panel.getByText("ER (Engagement Rate)")).toBeInTheDocument();
    expect(panel.getByText(/ER 4.0%/)).toBeInTheDocument();
    expect(panel.getByText("1차 2N 선정")).toBeInTheDocument();
    expect(panel.getAllByRole("link", { name: "AI 분석 근거 게시글" })).toHaveLength(8);

    expect(panel.queryByText("Instagram DM", { selector: "h3" })).not.toBeInTheDocument();
    expect(panel.queryByRole("link", { name: "Instagram DM 제안 작성" })).not.toBeInTheDocument();
    expect(panel.getByText("seoyeon@example.com")).toBeInTheDocument();
    expect(panel.getByText("자동 발송 상태")).toBeInTheDocument();
    expect(panel.getAllByRole("link", { name: "이메일 제안 작성" })).toHaveLength(2);
  });

  test("shows the creator decision and review content in the right summary panel", async () => {
    const user = userEvent.setup();
    renderRoute("/creators/cr-001");

    const review = screen.getByRole("region", { name: "크리에이터 승인 처리" });
    await user.type(
      within(review).getByRole("textbox", { name: "내부 검토 의견" }),
      "브랜드 적합도가 높습니다.",
    );
    await user.click(within(review).getByRole("button", { name: "승인" }));

    const summary = screen.getByRole("complementary", { name: "크리에이터 승인 결과" });
    expect(within(summary).getByText("승인")).toBeInTheDocument();
    expect(within(summary).getByText("브랜드 적합도가 높습니다.")).toBeInTheDocument();
  });

  test("renders the analysis report for a pending legacy fixture", () => {
    renderRoute("/creators/cr-001?fixture=ai-pending");

    expect(screen.getByRole("heading", { name: "크리에이터 상세" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "크리에이터 분석" })).toBeInTheDocument();
    expect(screen.getByText(/최종 업데이트 2026.08.05/)).toBeInTheDocument();
    expect(screen.getByText("정량 분석")).toBeInTheDocument();
    expect(screen.queryByText("AI 적합도")).not.toBeInTheDocument();
  });

  test("activates the creator-analysis tab", async () => {
    const user = userEvent.setup();
    renderRoute("/creators/cr-001");

    const sections = screen.getByRole("navigation", { name: "섹션" });
    await user.click(within(sections).getByRole("link", { name: "크리에이터 분석" }));

    expect(within(sections).getByRole("link", { name: "크리에이터 분석" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("renders the fixed email proposal for every creator", () => {
    renderRoute("/creators/cr-004");

    const proposals = screen.getByRole("region", { name: "영입 제안" });
    expect(within(proposals).queryByRole("link", { name: "Instagram DM 제안 작성" })).not.toBeInTheDocument();
    expect(within(proposals).queryByRole("heading", { name: "Instagram DM" })).not.toBeInTheDocument();
    expect(within(proposals).getByRole("link", { name: "이메일 제안 작성" })).toBeInTheDocument();
    expect(within(proposals).getByRole("heading", { name: "이메일" })).toBeInTheDocument();
    expect(proposals).not.toHaveTextContent("undefined");
  });

  test("renders one branded creator-detail profile channel", () => {
    renderRoute("/creators/cr-003");

    const channels = screen.getByRole("region", { name: "플랫폼별 채널" });
    const row = within(channels).getByRole("row", {
      name: /Instagram 플랫폼 @zia.trip/,
    });
    expect(within(row).getByText("Instagram")).toBeInTheDocument();
    expect(within(row).getByRole("img", { name: "Instagram 플랫폼" })).toBeInTheDocument();
    expect(within(channels).getAllByRole("row")).toHaveLength(2);
    expect(within(channels).queryByText("Facebook")).not.toBeInTheDocument();
  });

  test("keeps the detail frame and shows a missing-record state", () => {
    renderRoute("/creators/missing");
    const detail = screen.getByRole("dialog", { name: "크리에이터 상세" });

    expect(within(detail).getByRole("heading", { name: "크리에이터 상세" })).toBeInTheDocument();
    expect(within(detail).getByText("CR102")).toBeInTheDocument();
    expect(within(detail).getByRole("heading", { name: "대상을 찾을 수 없습니다" })).toBeInTheDocument();
    expect(within(detail).getByText("요청한 크리에이터 정보를 확인할 수 없습니다.")).toBeInTheDocument();
    expect(within(detail).queryByText("김서연")).not.toBeInTheDocument();
    expect(within(detail).queryByText("@seo.yeon")).not.toBeInTheDocument();
  });
});

describe("proposal history", () => {
  test("fixes the selectors proposal channel to email", () => {
    renderRoute("/proposals/new?creator=cr-001&channel=Instagram%20DM");

    const channel = screen.getByRole("combobox", { name: "제안 채널" });
    expect(channel).toHaveValue("이메일");
    expect(channel).toBeDisabled();
    expect(within(channel).getAllByRole("option")).toHaveLength(1);
    expect(screen.getByText("이메일 자동 발송")).toBeInTheDocument();
  });

  test("opens a creator-specific proposal compose workspace", () => {
    vi.stubEnv("BASE_URL", "/fe-selectors-admin/");
    renderRoute("/proposals/new?creator=cr-001");

    expect(screen.getByRole("heading", { name: "크리에이터 제안 작성" })).toBeInTheDocument();
    expect(screen.getByText("CR202")).toBeInTheDocument();
    expect(screen.getByText("김서연님에게 보낼 제안을 작성합니다.")).toBeInTheDocument();
    const target = screen.getByRole("complementary", { name: "제안 대상" });
    expect(within(target).getByRole("img", { name: "김서연 프로필 이미지" })).toHaveAttribute(
      "src",
      "/fe-selectors-admin/creator-media/kr-cr-001-profile.jpg",
    );
    expect(within(target).getByText("Instagram")).toBeInTheDocument();
    expect(within(target).getByText("@seo.yeon")).toBeInTheDocument();
    const form = screen.getByRole("form", { name: "제안 작성" });
    expect(within(form).getByRole("combobox", { name: "제안 채널" })).toHaveValue("이메일");
    expect(within(form).getByRole("textbox", { name: "제목" })).toHaveValue(
      "더현대Hi 셀렉터스 활동 제안드립니다, 김서연님",
    );
    expect(within(form).getByRole("button", { name: "제안 발송" })).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  test("honors the proposal channel selected from creator detail", () => {
    renderRoute("/proposals/new?creator=cr-001&channel=%EC%9D%B4%EB%A9%94%EC%9D%BC");

    const form = screen.getByRole("form", { name: "제안 작성" });
    expect(within(form).getByRole("combobox", { name: "제안 채널" })).toHaveValue("이메일");
    expect(within(form).getByText("이메일 자동 발송")).toBeInTheDocument();
  });

  test("renders all channels, send methods, statuses, and filters", () => {
    renderRoute("/proposals");

    expect(screen.getByRole("heading", { name: "제안 이력 관리" })).toBeInTheDocument();
    expect(screen.getByText("CR201")).toBeInTheDocument();
    const search = screen.getByRole("search", { name: "검색 조건" });
    expect(within(search).getByRole("combobox", { name: "채널" })).toHaveTextContent(
      "전체Instagram DM이메일",
    );
    expect(within(search).getByRole("combobox", { name: "상태" })).toHaveTextContent(
      "전체발송 대기발송 완료발송 실패셀렉터스 전환",
    );
    expect(within(search).getByRole("button", { name: "조회" })).toBeInTheDocument();
    expect(within(search).getByRole("button", { name: "초기화" })).toBeInTheDocument();

    expect(screen.getByText("총 4건")).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "제안 이력 목록" });
    for (const name of ["대상", "채널", "발송 방식", "발송 시각", "상태", "발송 안내"]) {
      expect(within(results).getByRole("columnheader", { name })).toBeInTheDocument();
    }
    expect(within(results).queryByRole("columnheader", { name: "제안 ID" })).not.toBeInTheDocument();
    expect(within(results).getAllByText("Instagram DM")).toHaveLength(2);
    expect(within(results).getAllByText("이메일")).toHaveLength(2);
    expect(within(results).getAllByText("수동")).toHaveLength(2);
    expect(within(results).getAllByText("자동")).toHaveLength(2);
    for (const status of ["발송 대기", "발송 완료", "발송 실패", "셀렉터스 전환"]) {
      expect(within(results).getByText(status)).toBeInTheDocument();
    }
    expect(within(results).getAllByText(/Meta 정책상 자동 선접촉이 불가합니다/)).toHaveLength(2);
    expect(within(results).getByText("2026-08-03 10:24")).toBeInTheDocument();

    const seoyeonRow = within(results).getByRole("row", { name: /김서연 \(cr-001\)/ });
    expect(within(seoyeonRow).getByText("Instagram DM")).toBeInTheDocument();
    expect(within(seoyeonRow).getByText("수동")).toBeInTheDocument();
    expect(within(seoyeonRow).getByText("2026-08-03 10:24")).toBeInTheDocument();
    expect(within(seoyeonRow).getByText("발송 완료")).toBeInTheDocument();
    expect(within(seoyeonRow).getByText(/Meta 정책상 자동 선접촉이 불가합니다/)).toBeInTheDocument();
  });

  test("renders the explicit empty proposal fixture", () => {
    renderRoute("/proposals?fixture=empty");

    expect(screen.getByRole("heading", { name: "제안 이력 관리" })).toBeInTheDocument();
    expect(screen.getByText("총 0건")).toBeInTheDocument();
    expect(screen.getByText("등록된 제안 이력이 없습니다.")).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "제안 이력 목록" });
    expect(within(results).queryByText(/김서연/)).not.toBeInTheDocument();
  });
});
