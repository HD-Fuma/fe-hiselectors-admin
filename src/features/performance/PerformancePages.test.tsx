import { screen, within } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";
import { formatCount, formatRate } from "./fixtures";

const COHORT_OPTIONS = "전체3기2기";
const CAMPAIGN_OPTIONS =
  "전체2026 가을 골프웨어 셀렉션여름 바캉스 스타일링초여름 패션 리뷰";

function expectColumnHeaders(region: HTMLElement, names: string[]) {
  for (const name of names) {
    expect(within(region).getByRole("columnheader", { name })).toBeInTheDocument();
  }
}

function expectCommonFilters(search: HTMLElement) {
  expect(within(search).getByRole("combobox", { name: "기수" })).toHaveTextContent(
    COHORT_OPTIONS,
  );
  expect(
    within(search).getByRole("combobox", { name: "캠페인" }),
  ).toHaveTextContent(CAMPAIGN_OPTIONS);
  expect(within(search).getByLabelText("집계 시작일")).toHaveAttribute("type", "date");
  expect(within(search).getByLabelText("집계 시작일")).toHaveValue("2026-08-01");
  expect(within(search).getByLabelText("집계 종료일")).toHaveAttribute("type", "date");
  expect(within(search).getByLabelText("집계 종료일")).toHaveValue("2026-08-03");
  for (const name of ["조회", "초기화"]) {
    expect(within(search).getByRole("button", { name })).toHaveAttribute(
      "type",
      "button",
    );
  }
}

test("formats zero, thousands, and conversion rates for dense analytics tables", () => {
  expect(formatCount(0)).toBe("0");
  expect(formatCount(42200)).toBe("42,200");
  expect(formatRate(0, 0)).toBe("0.00%");
  expect(formatRate(829, 24820)).toBe("3.34%");
});

test("renders the exact dashboard metrics and campaign and selector performance tables", () => {
  renderRoute("/performance");

  expect(screen.getByRole("heading", { name: "관리자 성과 대시보드" })).toBeInTheDocument();
  expect(screen.getByText("PF101")).toBeInTheDocument();
  expectCommonFilters(screen.getByRole("search", { name: "검색 조건" }));

  const metrics = screen.getByRole("group", { name: "성과 요약" });
  for (const [label, value] of [
    ["총 클릭 수", "42,200"],
    ["구매 전환 수", "1,399"],
    ["전환율", "3.32%"],
    ["집계 셀렉터스", "4명"],
  ]) {
    expect(within(metrics).getByText(label)).toBeInTheDocument();
    expect(within(metrics).getByText(value)).toBeInTheDocument();
  }
  expect(metrics.tagName).toBe("DL");

  expect(screen.getByText("캠페인별 성과", { selector: "strong" })).toBeInTheDocument();
  expect(screen.getByText("총 3건")).toBeInTheDocument();
  const campaigns = screen.getByRole("region", { name: "캠페인별 성과" });
  expectColumnHeaders(campaigns, [
    "캠페인 ID",
    "캠페인명",
    "상태",
    "클릭 수",
    "구매 전환 수",
    "전환율",
  ]);
  const firstCampaign = within(campaigns).getByRole("row", {
    name: /cp-001 2026 가을 골프웨어 셀렉션 시작 전 0 0 0.00%/,
  });
  expect(within(firstCampaign).getByText("시작 전")).toHaveClass(
    "hsas-status-pill--pending",
  );
  const activeCampaign = within(campaigns).getByRole("row", {
    name: /cp-002 여름 바캉스 스타일링 진행 중 24,820 829 3.34%/,
  });
  expect(within(activeCampaign).getByText("진행 중")).toHaveClass(
    "hsas-status-pill--approved",
  );

  expect(screen.getByText("셀렉터스별 성과", { selector: "strong" })).toBeInTheDocument();
  expect(screen.getByText("총 4건")).toBeInTheDocument();
  const selectors = screen.getByRole("region", { name: "셀렉터스별 성과" });
  expectColumnHeaders(selectors, [
    "셀렉터스 ID",
    "셀렉터스",
    "기수",
    "활동 상태",
    "클릭 수",
    "구매 전환 수",
    "전환율",
  ]);
  const selector = within(selectors).getByRole("row", {
    name: /sl-001 김서연 3기 활동 중 12,840 428 3.33%/,
  });
  expect(within(selector).getByText("활동 중")).toHaveClass(
    "hsas-status-pill--approved",
  );
  expect(within(selectors).getByRole("row", {
    name: /sl-004 오하늘 2기 수료 18,600 711 3.82%/,
  })).toBeInTheDocument();
  expect(screen.getAllByText("1 / 1 페이지")).toHaveLength(2);
  expect(screen.getAllByText("페이지당 20개")).toHaveLength(2);
});

test("renders creator influence filters and exact engagement metrics", () => {
  renderRoute("/performance/creators");

  expect(screen.getByRole("heading", { name: "크리에이터 영향력 분석" })).toBeInTheDocument();
  expect(screen.getByText("PF201")).toBeInTheDocument();
  const search = screen.getByRole("search", { name: "검색 조건" });
  expectCommonFilters(search);
  expect(
    within(search).getByRole("textbox", { name: "크리에이터명" }),
  ).toHaveAttribute("placeholder", "이름 검색");

  expect(screen.getByText("크리에이터 영향력", { selector: "strong" })).toBeInTheDocument();
  expect(screen.getByText("총 4건")).toBeInTheDocument();
  const results = screen.getByRole("region", { name: "크리에이터 영향력" });
  expectColumnHeaders(results, [
    "크리에이터 ID",
    "크리에이터",
    "기수",
    "주요 플랫폼",
    "캠페인",
    "구매 전환 수",
    "조회 수",
    "좋아요",
    "댓글",
  ]);
  expect(within(results).getByRole("row", {
    name: /cr-001 김서연 3기 Instagram \/ YouTube 2026 가을 골프웨어 셀렉션 428 79,600 4,860 363/,
  })).toBeInTheDocument();
  expect(within(results).getByRole("row", {
    name: /cr-004 오하늘 2기 Instagram 초여름 패션 리뷰 711 154,200 11,920 940/,
  })).toBeInTheDocument();
  expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
});

test("renders content influence filters and exact content engagement rows", () => {
  renderRoute("/performance/contents");

  expect(screen.getByRole("heading", { name: "콘텐츠 영향력 분석" })).toBeInTheDocument();
  expect(screen.getByText("PF202")).toBeInTheDocument();
  const search = screen.getByRole("search", { name: "검색 조건" });
  expectCommonFilters(search);
  expect(
    within(search).getByRole("textbox", { name: "콘텐츠/작성자" }),
  ).toHaveAttribute("placeholder", "콘텐츠 ID 또는 작성자");

  expect(screen.getByText("콘텐츠 영향력", { selector: "strong" })).toBeInTheDocument();
  expect(screen.getByText("총 5건")).toBeInTheDocument();
  const results = screen.getByRole("region", { name: "콘텐츠 영향력" });
  expectColumnHeaders(results, [
    "콘텐츠 ID",
    "콘텐츠 제목",
    "작성자",
    "기수",
    "캠페인",
    "플랫폼",
    "구매 전환 수",
    "조회 수",
    "좋아요",
    "댓글",
  ]);
  expect(within(results).getByRole("row", {
    name: /ct-001 가을 라운딩 패딩 팬츠 소개 김서연 3기 2026 가을 골프웨어 셀렉션 Instagram 164 48,200 3,880 274/,
  })).toBeInTheDocument();
  expect(within(results).getByRole("row", {
    name: /ct-005 바캉스 푸드 스타일링 오하늘 2기 여름 바캉스 스타일링 Instagram 711 154,200 11,920 940/,
  })).toBeInTheDocument();
  expect(screen.getByText("1 / 1 페이지")).toBeInTheDocument();
});
