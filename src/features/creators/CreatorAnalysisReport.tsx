import type { CreatorFixture } from "./fixtures";

type AverageMetric = number | null;

interface AnalysisEvidence {
  label: string;
  url: string;
}

interface QualitativeClaim {
  label: string;
  value: string;
  evidence: AnalysisEvidence;
}

interface CreatorAnalysisFixture {
  updatedAt: string;
  collectionDays: number;
  cadence: {
    dailyAverage: number;
    weeklyAverage: number;
    longestGapDays: number;
  };
  collectedContentCount: number;
  lastPostDate: string;
  averages: {
    views: AverageMetric;
    likes: AverageMetric;
    comments: AverageMetric;
  };
  formatMix: readonly { label: string; count: number }[];
  engagementSampleSize: number;
  supplementalInteractions: readonly { label: string; value: number }[];
  qualitativeClaims: readonly QualitativeClaim[];
}

const CREATOR_ANALYSES: Record<string, CreatorAnalysisFixture> = {
  "cr-001": {
    updatedAt: "2026.08.05",
    collectionDays: 90,
    cadence: { dailyAverage: 0.46, weeklyAverage: 3.2, longestGapDays: 6 },
    collectedContentCount: 29,
    lastPostDate: "2026.08.02",
    averages: { views: 48_200, likes: 3_050, comments: 228 },
    formatMix: [
      { label: "이미지 포함 피드", count: 8 },
      { label: "동영상 포함 피드", count: 6 },
      { label: "릴스", count: 15 },
    ],
    engagementSampleSize: 29,
    supplementalInteractions: [
      { label: "저장", value: 412 },
      { label: "공유", value: 97 },
    ],
    qualitativeClaims: [
      {
        label: "요약",
        value: "저가 화장품 실사용 리뷰 중심의 정보 전달형 뷰티 크리에이터",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_01evidence/" },
      },
      {
        label: "카테고리",
        value: "뷰티 · 패션",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_02evidence/" },
      },
      {
        label: "키워드",
        value: "#톤메이크업 38% · #데일리룩 34% · #뷰티리뷰 28%",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_03evidence/" },
      },
      {
        label: "협업 브랜드",
        value: "올리브영 · 무신사 · A브랜드 (최근 90일 8건)",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_04evidence/" },
      },
      {
        label: "콘텐츠 스타일",
        value: "리뷰 · 하울 · 튜토리얼",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_05evidence/" },
      },
      {
        label: "톤앤매너",
        value: "친근함 · 정보 전달형 · 트렌디",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_06evidence/" },
      },
      {
        label: "위험 요소",
        value: "최근 90일 수집 게시물에서 특이 위험 요소 미확인",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_07evidence/" },
      },
      {
        label: "강점/유의점",
        value: "강점: 신뢰도 높은 실사용 비교 콘텐츠 · 유의점: 광고 고지 문구 사전 협의 필요",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_08evidence/" },
      },
    ],
  },
  "cr-002": {
    updatedAt: "2026.08.05",
    collectionDays: 90,
    cadence: { dailyAverage: 0.32, weeklyAverage: 2.2, longestGapDays: 8 },
    collectedContentCount: 20,
    lastPostDate: "2026.07.31",
    averages: { views: 26_800, likes: 1_130, comments: null },
    formatMix: [{ label: "숏폼", count: 14 }, { label: "롱폼", count: 6 }],
    engagementSampleSize: 20,
    supplementalInteractions: [{ label: "공유", value: 76 }],
    qualitativeClaims: [
      {
        label: "요약",
        value: "집밥과 홈카페 레시피를 친근하게 소개하는 리빙 크리에이터",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.youtube.com/watch?v=doyoon-evidence" },
      },
    ],
  },
};

function fallbackAnalysis(creator: CreatorFixture): CreatorAnalysisFixture {
  return {
    updatedAt: "2026.08.05",
    collectionDays: 90,
    cadence: { dailyAverage: 0, weeklyAverage: 0, longestGapDays: 0 },
    collectedContentCount: creator.featuredContents.length,
    lastPostDate: creator.recentActivity,
    averages: {
      views: creator.profile.averageViews,
      likes: creator.profile.averageReactions,
      comments: null,
    },
    formatMix: [{ label: "수집 콘텐츠", count: creator.featuredContents.length }],
    engagementSampleSize: creator.featuredContents.length,
    supplementalInteractions: [],
    qualitativeClaims: [
      {
        label: "요약",
        value: "분석 리포트 생성 대기",
        evidence: { label: "프로필 열기", url: creator.profile.profileUrl },
      },
    ],
  };
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function metricValue(value: AverageMetric) {
  return value === null ? "집계 불가" : formatNumber(value);
}

function audienceLabel(creator: CreatorFixture) {
  return creator.profile.platform === "Instagram" ? "팔로워" : "구독자";
}

export function topNScore(creator: CreatorFixture) {
  return creator.profile.engagementRate * Math.log(1 + creator.profile.followers);
}

export function deriveCadence(postDates: readonly string[], updatedAt: string, windowDays: number) {
  const toDay = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000;
  const sortedDays = [...postDates].map(toDay).sort((left, right) => right - left);
  const longestGapDays = sortedDays.slice(1).reduce((longest, day, index) => {
    return Math.max(longest, sortedDays[index] - day - 1);
  }, 0);

  void updatedAt;
  return {
    dailyAverage: Number((postDates.length / windowDays).toFixed(2)),
    weeklyAverage: Number(((postDates.length / windowDays) * 7).toFixed(1)),
    longestGapDays,
  };
}

export function deriveEngagementRate(
  samples: readonly { audience: number; likes: number; comments: number }[],
) {
  const eligible = samples.filter((sample) => sample.audience > 0);
  if (eligible.length === 0) {
    return { value: null, sampleSize: 0 };
  }

  const totalRate = eligible.reduce(
    (sum, sample) => sum + ((sample.likes + sample.comments) / sample.audience) * 100,
    0,
  );
  return { value: Number((totalRate / eligible.length).toFixed(2)), sampleSize: eligible.length };
}

export function rankTopTwoN(creators: readonly CreatorFixture[], targetCount: number) {
  return [...creators]
    .sort((left, right) => topNScore(right) - topNScore(left))
    .slice(0, targetCount * 2);
}

function AnalysisFields({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="fuma-key-value-grid__item">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function CreatorAnalysisReport({ creator }: { creator: CreatorFixture }) {
  const analysis = CREATOR_ANALYSES[creator.id] ?? fallbackAnalysis(creator);
  const audience = audienceLabel(creator);

  return (
    <section aria-labelledby="creator-analysis-title" className="fuma-content-section">
      <header className="fuma-content-section__header">
        <h2 id="creator-analysis-title">크리에이터 분석</h2>
        <span>최종 업데이트 {analysis.updatedAt} · 최근 {analysis.collectionDays}일 수집 데이터</span>
      </header>

      <section aria-label="정량 분석" className="fuma-content-section">
        <header className="fuma-content-section__header"><h2>정량 분석</h2></header>
        <dl className="fuma-key-value-grid">
          <AnalysisFields label="SNS 계정 기본정보">
            <a
              aria-label={`${creator.profile.platform} 프로필 열기`}
              href={creator.profile.profileUrl}
              rel="noreferrer"
              target="_blank"
            >
              {creator.profile.platform} · {creator.profile.handle}
            </a>
          </AnalysisFields>
          <AnalysisFields label={audience}>{formatNumber(creator.profile.followers)}</AnalysisFields>
          <AnalysisFields label="업로드 주기">주 {analysis.cadence.weeklyAverage.toFixed(1)}회 · 최근 {analysis.collectionDays}일 {analysis.collectedContentCount}건 · 공백 최대 {analysis.cadence.longestGapDays}일</AnalysisFields>
          <AnalysisFields label="콘텐츠 수">공개 콘텐츠 {formatNumber(creator.contentCount)}건 · 수집 콘텐츠 {analysis.collectedContentCount}건</AnalysisFields>
          <AnalysisFields label="마지막 게시일">마지막 게시일 {analysis.lastPostDate}</AnalysisFields>
          <AnalysisFields label="평균 조회 수">{metricValue(analysis.averages.views)}</AnalysisFields>
          <AnalysisFields label="평균 좋아요">{metricValue(analysis.averages.likes)}</AnalysisFields>
          <AnalysisFields label="평균 댓글">{metricValue(analysis.averages.comments)}</AnalysisFields>
          <AnalysisFields label="콘텐츠 형식 통계">{analysis.formatMix.map((format) => `${format.label} ${format.count}건`).join(" · ")}</AnalysisFields>
          <AnalysisFields label="ER (Engagement Rate)">ER {creator.profile.engagementRate.toFixed(1)}% · (좋아요 + 댓글) ÷ {audience} × 100 · 표본 {analysis.engagementSampleSize}건</AnalysisFields>
          <AnalysisFields label="플랫폼 보조 상호작용">{analysis.supplementalInteractions.length > 0 ? analysis.supplementalInteractions.map((item) => `${item.label} ${formatNumber(item.value)}`).join(" · ") : "집계 불가"}</AnalysisFields>
        </dl>
      </section>

      <section aria-label="AI 정성 분석" className="fuma-content-section">
        <header className="fuma-content-section__header"><h2>AI 정성 분석</h2></header>
        <dl className="fuma-key-value-grid">
          {analysis.qualitativeClaims.map((claim) => (
            <AnalysisFields key={claim.label} label={claim.label}>
              <span>{claim.value}</span>{" "}
              <a href={claim.evidence.url} rel="noreferrer" target="_blank">{claim.evidence.label}</a>
            </AnalysisFields>
          ))}
        </dl>
      </section>

      <section aria-label="크리에이터 풀 TopN 선정" className="fuma-content-section">
        <header className="fuma-content-section__header"><h2>크리에이터 풀 TopN 선정</h2></header>
        <dl className="fuma-key-value-grid">
          <AnalysisFields label="1차 2N 선정">ER × log(1 + 팔로워·구독자 수) · 현재 점수 {topNScore(creator).toFixed(2)}</AnalysisFields>
          <AnalysisFields label="최종 N 선정">카테고리 분포 조절</AnalysisFields>
        </dl>
      </section>
    </section>
  );
}
