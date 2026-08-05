import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test/renderRoute";
import type { CreatorProposalContact } from "./fixtures";

// @ts-expect-error An email proposal channel requires a usable email address.
const invalidEmailContact: CreatorProposalContact = { availableProposalChannels: ["이메일"] };
void invalidEmailContact;

function expectColumnHeaders(names: string[]) {
  for (const name of names) {
    expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
  }
}

describe("creator pool", () => {
  test("renders the populated creator pool as profile-first cards", () => {
    renderRoute("/creators");

    expect(screen.getByRole("heading", { name: "크리에이터 풀" })).toBeInTheDocument();
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

    expect(screen.getByRole("heading", { name: "크리에이터 풀" })).toBeInTheDocument();
    expect(screen.getByText("총 0건")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "검색 결과가 없습니다." })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "크리에이터 목록" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("creator detail", () => {
  test("renders the creator analysis report, channel metrics, and both proposal methods", () => {
    renderRoute("/creators/cr-001");

    expect(screen.getByRole("heading", { name: "크리에이터 상세" })).toBeInTheDocument();
    expect(screen.getByText("CR102")).toBeInTheDocument();
    const sections = screen.getByRole("navigation", { name: "섹션" });
    expect(within(sections).getByText("기본 정보")).toHaveAttribute("aria-current", "page");
    expect(within(sections).getByText("크리에이터 분석")).toBeInTheDocument();
    expect(within(sections).getByText("영입 제안")).toBeInTheDocument();

    expect(screen.getByText("cr-001")).toBeInTheDocument();
    expect(screen.getByText("김서연")).toBeInTheDocument();
    expect(screen.getByText("뷰티 / 패션")).toBeInTheDocument();
    expect(screen.getAllByText("82,400")).toHaveLength(3);
    expectColumnHeaders([
      "플랫폼",
      "채널",
      "팔로워·구독자",
      "평균 조회 수",
      "평균 반응 수",
    ]);
    expect(screen.getByText("@seo.yeon")).toBeInTheDocument();
    expect(screen.getAllByText("48,200")).toHaveLength(2);
    expect(screen.getAllByText("3,278")).toHaveLength(1);
    const channels = screen.getByRole("region", { name: "플랫폼별 채널" });
    expect(within(channels).getAllByRole("row")).toHaveLength(2);

    expect(screen.getByRole("heading", { name: "크리에이터 분석" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "정량 분석" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI 정성 분석" })).toBeInTheDocument();
    expect(screen.getByText("ER (Engagement Rate)")).toBeInTheDocument();
    expect(screen.getByText(/ER 4.0%/)).toBeInTheDocument();
    expect(screen.getByText("1차 2N 선정")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "AI 분석 근거 게시글" })).toHaveLength(8);

    expect(screen.getByText("Instagram DM", { selector: "h3" })).toBeInTheDocument();
    expect(screen.getByText("Meta 정책상 자동 선접촉이 불가합니다. 관리자 확인 후 수동 발송이 필요합니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Instagram DM 제안 발송" })).toBeInTheDocument();
    expect(screen.getByText("seoyeon@example.com")).toBeInTheDocument();
    expect(screen.getByText("자동 발송 상태")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이메일 제안 발송" })).toBeInTheDocument();
  });

  test("renders the analysis report for a pending legacy fixture", () => {
    renderRoute("/creators/cr-001?fixture=ai-pending");

    expect(screen.getByRole("heading", { name: "크리에이터 상세" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "크리에이터 분석" })).toBeInTheDocument();
    expect(screen.getByText(/최종 업데이트 2026.08.05/)).toBeInTheDocument();
    expect(screen.getByText("정량 분석")).toBeInTheDocument();
    expect(screen.queryByText("AI 적합도")).not.toBeInTheDocument();
  });

  test("renders only declared proposal channels for an Instagram-only creator", () => {
    renderRoute("/creators/cr-004");

    const proposals = screen.getByRole("region", { name: "영입 제안" });
    expect(
      within(proposals).getByRole("button", { name: "Instagram DM 제안 발송" }),
    ).toBeInTheDocument();
    expect(within(proposals).getByRole("heading", { name: "Instagram DM" })).toBeInTheDocument();
    expect(
      within(proposals).queryByRole("button", { name: "이메일 제안 발송" }),
    ).not.toBeInTheDocument();
    expect(within(proposals).queryByRole("heading", { name: "이메일" })).not.toBeInTheDocument();
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

    expect(screen.getByRole("heading", { name: "크리에이터 상세" })).toBeInTheDocument();
    expect(screen.getByText("CR102")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "대상을 찾을 수 없습니다" })).toBeInTheDocument();
    expect(screen.getByText("요청한 크리에이터 정보를 확인할 수 없습니다.")).toBeInTheDocument();
    expect(screen.queryByText("김서연")).not.toBeInTheDocument();
    expect(screen.queryByText("@seo.yeon")).not.toBeInTheDocument();
  });
});

describe("proposal history", () => {
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
