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
    expect(within(search).getByRole("combobox", { name: "카테고리" })).toHaveTextContent(
      "전체뷰티패션리빙푸드여행라이프",
    );
    expect(within(search).getByRole("combobox", { name: "티어" })).toHaveTextContent(
      "전체T0T1T2T3",
    );
    expect(within(search).getByRole("combobox", { name: "플랫폼" })).toHaveTextContent(
      "전체InstagramYouTubeFacebook",
    );
    expect(within(search).getByRole("button", { name: "조회" })).toBeInTheDocument();
    expect(within(search).getByRole("button", { name: "초기화" })).toBeInTheDocument();

    expect(screen.getByText("총 4건")).toBeInTheDocument();
    expect(screen.getByText("AI 적합도순").closest("button,select")).toBeNull();
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
      "카테고리",
      "티어",
      "팔로워·구독자",
      "콘텐츠 수",
      "최근 활동일",
      "AI 리포트 상태",
      "제안 상태",
      "상세",
    ]) {
      expect(within(results).getByRole("columnheader", { name })).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "카드 보기" }));

    expect(screen.getByRole("list", { name: "크리에이터 목록" })).toBeInTheDocument();
  });

  test("brands Instagram and Facebook in the fallback table", async () => {
    const user = userEvent.setup();
    renderRoute("/creators");
    await user.click(screen.getByRole("button", { name: "목록 보기" }));

    const results = screen.getByRole("region", { name: "크리에이터 목록" });
    const ziaRow = within(results).getByRole("row", { name: /cr-003 이지아/ });
    expect(within(ziaRow).getByText("Instagram")).toBeInTheDocument();
    expect(within(ziaRow).getByText("Facebook")).toBeInTheDocument();
    expect(within(ziaRow).getByRole("img", { name: "Instagram 플랫폼" })).toBeInTheDocument();
    expect(within(ziaRow).getByRole("img", { name: "Facebook 플랫폼" })).toBeInTheDocument();
  });

  test("renders the explicit empty creator fixture", () => {
    renderRoute("/creators?fixture=empty");

    expect(screen.getByRole("heading", { name: "크리에이터 풀" })).toBeInTheDocument();
    expect(screen.getByText("총 0건")).toBeInTheDocument();
    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
    expect(screen.queryByText("김서연")).not.toBeInTheDocument();
  });
});

describe("creator detail", () => {
  test("renders the ready AI report, channel metrics, and both proposal methods", () => {
    renderRoute("/creators/cr-001");

    expect(screen.getByRole("heading", { name: "크리에이터 상세" })).toBeInTheDocument();
    expect(screen.getByText("CR102")).toBeInTheDocument();
    const sections = screen.getByRole("navigation", { name: "섹션" });
    expect(within(sections).getByText("기본 정보")).toHaveAttribute("aria-current", "page");
    expect(within(sections).getByText("AI 요약 리포트")).toBeInTheDocument();
    expect(within(sections).getByText("영입 제안")).toBeInTheDocument();

    expect(screen.getByText("cr-001")).toBeInTheDocument();
    expect(screen.getByText("김서연")).toBeInTheDocument();
    expect(screen.getByText("뷰티 / 패션")).toBeInTheDocument();
    expect(screen.getByText("128,400")).toBeInTheDocument();
    expectColumnHeaders([
      "플랫폼",
      "채널",
      "팔로워·구독자",
      "평균 조회 수",
      "평균 반응 수",
    ]);
    expect(screen.getByText("@seo.yeon")).toBeInTheDocument();
    expect(screen.getByText("서연의 옷장")).toBeInTheDocument();
    expect(screen.getByText("48,200")).toBeInTheDocument();
    expect(screen.getByText("3,278")).toBeInTheDocument();
    expect(screen.getByText("31,400")).toBeInTheDocument();
    expect(screen.getByText("1,945")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "AI 요약 리포트" })).toBeInTheDocument();
    expect(screen.getByText("AI 적합도")).toBeInTheDocument();
    expect(screen.getByText("92점")).toBeInTheDocument();
    expect(
      screen.getByText(
        "뷰티·패션 콘텐츠의 반응률이 높고 최근 브랜드 협업 활동이 꾸준한 크리에이터입니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("근거 지표")).toBeInTheDocument();
    expect(screen.getByText("최근 30일 평균 조회 수 48,200회")).toBeInTheDocument();
    expect(screen.getByText("평균 반응률 6.8%")).toBeInTheDocument();
    expect(screen.getByText("브랜드 협업 콘텐츠 비중 34%")).toBeInTheDocument();

    expect(screen.getByText("Instagram DM", { selector: "h3" })).toBeInTheDocument();
    expect(screen.getByText("Meta 정책상 자동 선접촉이 불가합니다. 관리자 확인 후 수동 발송이 필요합니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Instagram DM 제안 발송" })).toBeInTheDocument();
    expect(screen.getByText("seoyeon@example.com")).toBeInTheDocument();
    expect(screen.getByText("자동 발송 상태")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이메일 제안 발송" })).toBeInTheDocument();
  });

  test("renders the pending AI fixture without a ready score or evidence", () => {
    renderRoute("/creators/cr-001?fixture=ai-pending");

    expect(screen.getByRole("heading", { name: "크리에이터 상세" })).toBeInTheDocument();
    expect(screen.getByText("생성 대기")).toBeInTheDocument();
    expect(screen.getByText("AI 리포트 생성 전")).toBeInTheDocument();
    expect(
      screen.getByText("분석 데이터가 준비되면 요약 리포트가 표시됩니다."),
    ).toBeInTheDocument();
    expect(screen.queryByText("92점")).not.toBeInTheDocument();
    expect(screen.queryByText("최근 30일 평균 조회 수 48,200회")).not.toBeInTheDocument();
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

  test("renders Facebook as a branded creator-detail channel", () => {
    renderRoute("/creators/cr-003");

    const channels = screen.getByRole("region", { name: "플랫폼별 채널" });
    const row = within(channels).getByRole("row", { name: /Facebook 지아의 여행노트/ });
    expect(within(row).getByText("Facebook")).toBeInTheDocument();
    expect(within(row).getByRole("img", { name: "Facebook 플랫폼" })).toBeInTheDocument();
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
