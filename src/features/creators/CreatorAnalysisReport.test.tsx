import { render, screen, within } from "@testing-library/react";
import { CREATORS } from "./fixtures";
import {
  CreatorAnalysisReport,
  deriveCadence,
  deriveEngagementRate,
  rankTopTwoN,
} from "./CreatorAnalysisReport";

describe("CreatorAnalysisReport", () => {
  test("renders fixture-backed quantitative analysis, source-backed AI claims, and selection logic", () => {
    render(<CreatorAnalysisReport creator={CREATORS[0]} />);

    expect(screen.getByRole("heading", { name: "크리에이터 분석" })).toBeInTheDocument();
    expect(screen.getByText("최종 업데이트 2026.08.05 · 최근 90일 수집 데이터")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Instagram 프로필 열기" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/seo.yeon",
    );

    const quantitative = screen.getByRole("region", { name: "정량 분석" });
    for (const value of [
      "팔로워",
      "82,400",
      "주 3.2회",
      "최근 90일 29건",
      "공백 최대 6일",
      "공개 콘텐츠 184건",
      "수집 콘텐츠 29건",
      "마지막 게시일 2026.08.02",
      "평균 조회 수",
      "48,200",
      "평균 좋아요",
      "3,050",
      "평균 댓글",
      "228",
      "이미지 포함 피드 8건",
      "동영상 포함 피드 6건",
      "릴스 15건",
      "ER 4.0%",
      "(좋아요 + 댓글) ÷ 팔로워 × 100",
      "표본 29건",
      "저장 412",
      "공유 97",
    ]) {
      expect(quantitative).toHaveTextContent(value);
    }
    expect(within(quantitative).getByText("평균 조회 수")).toBeInTheDocument();

    const qualitative = screen.getByRole("region", { name: "AI 정성 분석" });
    expect(within(qualitative).getByText("저가 화장품 실사용 리뷰 중심의 정보 전달형 뷰티 크리에이터")).toBeInTheDocument();
    expect(within(qualitative).getByText("리뷰 · 하울 · 튜토리얼")).toBeInTheDocument();
    expect(qualitative).toHaveTextContent("강점: 신뢰도 높은 실사용 비교 콘텐츠");
    expect(within(qualitative).getAllByRole("link", { name: "AI 분석 근거 게시글" })[0]).toHaveAttribute(
      "href",
      "https://www.instagram.com/p/C_01evidence/",
    );

    const selection = screen.getByRole("region", { name: "크리에이터 풀 TopN 선정" });
    expect(within(selection).getByText("1차 2N 선정")).toBeInTheDocument();
    expect(selection).toHaveTextContent("ER × log(1 + 팔로워·구독자 수)");
    expect(within(selection).getByText("최종 N 선정")).toBeInTheDocument();
    expect(within(selection).getByText("카테고리 분포 조절")).toBeInTheDocument();
  });

  test("makes an unavailable average metric explicit instead of displaying a zero", () => {
    render(<CreatorAnalysisReport creator={CREATORS[1]} />);

    expect(screen.getByText("평균 댓글")).toBeInTheDocument();
    expect(screen.getByText("집계 불가")).toBeInTheDocument();
  });
});

describe("creator analysis derivations", () => {
  test("derives the configured collection window cadence and longest gap from posting dates", () => {
    expect(
      deriveCadence(["2026-08-05", "2026-08-01", "2026-07-29"], "2026-08-05", 90),
    ).toEqual({ dailyAverage: 0.03, weeklyAverage: 0.2, longestGapDays: 3 });
  });

  test("excludes zero-audience samples from ER and marks empty eligible samples unavailable", () => {
    expect(
      deriveEngagementRate([
        { audience: 100, likes: 5, comments: 5 },
        { audience: 0, likes: 99, comments: 99 },
      ]),
    ).toEqual({ value: 10, sampleSize: 1 });
    expect(deriveEngagementRate([{ audience: 0, likes: 1, comments: 1 }])).toEqual({
      value: null,
      sampleSize: 0,
    });
  });

  test("ranks Top 2N candidates by ER times log audience before category distribution adjustment", () => {
    expect(rankTopTwoN(CREATORS, 1).map(({ id }) => id)).toEqual(["cr-001", "cr-004"]);
  });
});
