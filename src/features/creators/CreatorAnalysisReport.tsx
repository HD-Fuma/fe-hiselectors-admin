import { formatNumber } from "../../lib/formatters";
import { ProfileAnalysisReport } from "../../components/ui/ProfileAnalysisReport";
import {
  CREATORS,
  deriveCadence,
  deriveEngagementRate,
  type CreatorFixture,
} from "../../entities/creator";

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
  collectedAt: string;
  collectionDays: number;
  postDates: readonly string[];
  engagementSamples: readonly { audience: number; likes: number; comments: number | null }[];
  lastPostDate: string;
  averages: {
    views: AverageMetric;
    likes: AverageMetric;
  };
  formatMix: readonly { label: string; count: number }[];
  supplementalInteractions: readonly { label: string; value: number }[];
  qualitativeClaims: readonly QualitativeClaim[];
}

export interface AnalysisPercentileContext {
  label: string;
  audience: readonly number[];
  views: readonly number[];
  likes: readonly number[];
  comments: readonly number[];
  engagement: readonly number[];
}

export interface AnalysisMetricOverrides {
  averageComments?: number | null;
  engagementRate?: number | null;
}

const SEOYEON_POST_DATES = Array.from({ length: 29 }, (_, index) => {
  const offset = index * 3 + (index > 0 ? 2 : 0);
  return new Date(Date.UTC(2026, 7, 2 - offset)).toISOString().slice(0, 10);
});
const SEOYEON_ENGAGEMENT_SAMPLES = Array.from({ length: 29 }, () => ({
  audience: 82_400,
  likes: 3_050,
  comments: 228,
}));
const DOYOON_POST_DATES = Array.from({ length: 20 }, (_, index) =>
  new Date(Date.UTC(2026, 6, 31 - index * 4)).toISOString().slice(0, 10),
);
const DOYOON_ENGAGEMENT_SAMPLES = Array.from({ length: 20 }, () => ({
  audience: 76_200,
  likes: 1_130,
  comments: null,
}));
const ADDITIONAL_ENGAGEMENT_SAMPLES: Record<
  string,
  readonly { audience: number; likes: number; comments: number | null }[]
> = {
  "cr-003": Array.from({ length: 18 }, () => ({ audience: 32_700, likes: 900, comments: 81 })),
  "cr-004": Array.from({ length: 24 }, () => ({ audience: 486_000, likes: 12_000, comments: 636 })),
};

const CREATOR_ANALYSES: Record<string, CreatorAnalysisFixture> = {
  "cr-001": {
    updatedAt: "2026.08.05",
    collectedAt: "2026.08.05 09:30",
    collectionDays: 90,
    postDates: SEOYEON_POST_DATES,
    engagementSamples: SEOYEON_ENGAGEMENT_SAMPLES,
    lastPostDate: "2026.08.02",
    averages: { views: 48_200, likes: 3_050 },
    formatMix: [
      { label: "릴스", count: 15 },
      { label: "이미지", count: 8 },
      { label: "영상", count: 6 },
    ],
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
        value: "뷰티",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_02evidence/" },
      },
      {
        label: "키워드",
        value: "#톤메이크업 38% · #데일리룩 34% · #뷰티리뷰 28%",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_03evidence/" },
      },
      {
        label: "협업 이력",
        value: "올리브영 · 무신사 · A브랜드 (최근 90일 8건)",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_04evidence/" },
      },
      {
        label: "콘텐츠 유형",
        value: "리뷰 · 브이로그 · 하울",
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
        label: "강점",
        value: "신뢰도 높은 실사용 비교 콘텐츠",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_08evidence/" },
      },
      {
        label: "유의점",
        value: "광고 고지 문구 사전 협의 필요",
        evidence: { label: "AI 분석 근거 게시글", url: "https://www.instagram.com/p/C_08evidence/" },
      },
    ],
  },
  "cr-002": {
    updatedAt: "2026.08.05",
    collectedAt: "2026.08.05 09:45",
    collectionDays: 90,
    postDates: DOYOON_POST_DATES,
    engagementSamples: DOYOON_ENGAGEMENT_SAMPLES,
    lastPostDate: "2026.07.31",
    averages: { views: 26_800, likes: 1_130 },
    formatMix: [{ label: "숏폼", count: 14 }, { label: "롱폼", count: 6 }],
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
  const engagementSamples = ADDITIONAL_ENGAGEMENT_SAMPLES[creator.id] ?? creator.featuredContents.map(() => ({
    audience: creator.profile.followers,
    likes: creator.profile.averageReactions,
    comments: null,
  }));
  return {
    updatedAt: "2026.08.05",
    collectedAt: "2026.08.05 10:00",
    collectionDays: 90,
    postDates: engagementSamples.map((_, index) =>
      new Date(Date.parse(`${creator.recentActivity}T00:00:00Z`) - index * 3 * 86_400_000)
        .toISOString()
        .slice(0, 10),
    ),
    engagementSamples,
    lastPostDate: creator.recentActivity,
    averages: {
      views: creator.profile.averageViews,
      likes: creator.profile.averageReactions,
    },
    formatMix: creator.profile.platform === "YouTube"
      ? [
        { label: "숏폼", count: Math.max(1, Math.round(engagementSamples.length * 0.7)) },
        { label: "롱폼", count: Math.max(1, Math.floor(engagementSamples.length * 0.3)) },
      ]
      : [
        { label: "릴스", count: Math.max(1, Math.round(engagementSamples.length * 0.5)) },
        { label: "이미지", count: Math.max(1, Math.round(engagementSamples.length * 0.3)) },
        { label: "영상", count: Math.max(1, Math.floor(engagementSamples.length * 0.2)) },
      ],
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

function topPercentile(value: number, pool: readonly number[]) {
  if (pool.length === 0) return null;
  const rank = pool.filter((candidate) => candidate > value).length + 1;
  return Math.max(1, Math.ceil((rank / pool.length) * 100));
}

function metricValue(value: AverageMetric) {
  return value === null ? "-" : formatNumber(value);
}

function averageCommentsForSamples(
  samples: CreatorAnalysisFixture["engagementSamples"],
) {
  const comments = samples
    .map((sample) => sample.comments)
    .filter((value): value is number => value !== null);
  return comments.length === 0
    ? null
    : Math.round(comments.reduce((total, value) => total + value, 0) / comments.length);
}

function creatorPercentileContext(): AnalysisPercentileContext {
  const analyses = CREATORS.map((candidate) => (
    CREATOR_ANALYSES[candidate.id] ?? fallbackAnalysis(candidate)
  ));
  const comments = analyses
    .map((candidate) => averageCommentsForSamples(candidate.engagementSamples))
    .filter((value): value is number => value !== null);

  return {
    label: "크리에이터 풀",
    audience: CREATORS.map((candidate) => candidate.profile.followers),
    views: CREATORS.map((candidate) => candidate.profile.averageViews),
    likes: CREATORS.map((candidate) => candidate.profile.averageReactions),
    comments,
    engagement: CREATORS.map((candidate) => candidate.profile.engagementRate),
  };
}

export function CreatorAnalysisReport({
  creator,
  eyebrow = "CREATOR REPORT",
  metricOverrides,
  percentileContext,
  title = "크리에이터 분석 리포트",
}: {
  creator: CreatorFixture;
  eyebrow?: string;
  metricOverrides?: AnalysisMetricOverrides;
  percentileContext?: AnalysisPercentileContext;
  title?: string;
}) {
  const analysis = CREATOR_ANALYSES[creator.id] ?? fallbackAnalysis(creator);
  const cadence = deriveCadence(analysis.postDates, analysis.updatedAt.replaceAll(".", "-"), analysis.collectionDays);
  const collectedContentCount = Math.round(cadence.dailyAverage * analysis.collectionDays);
  const engagement = deriveEngagementRate(analysis.engagementSamples);
  const engagementRate = metricOverrides?.engagementRate === undefined
    ? engagement.value
    : metricOverrides.engagementRate;
  const averageComments = metricOverrides?.averageComments === undefined
    ? averageCommentsForSamples(analysis.engagementSamples)
    : metricOverrides.averageComments;
  const comparison = percentileContext ?? creatorPercentileContext();
  const poolPercentiles = {
    audience: topPercentile(creator.profile.followers, comparison.audience),
    views: analysis.averages.views === null
      ? null
      : topPercentile(analysis.averages.views, comparison.views),
    likes: analysis.averages.likes === null
      ? null
      : topPercentile(analysis.averages.likes, comparison.likes),
    comments: averageComments === null
      ? null
      : topPercentile(averageComments, comparison.comments),
    engagement: engagementRate === null
      ? null
      : topPercentile(engagementRate, comparison.engagement),
  };
  const formatTotal = analysis.formatMix.reduce((sum, format) => sum + format.count, 0);
  const formatColors = ["#de76ce", "#667085", "#a0a8b0", "#c8cdd2"];
  const formatSegments = analysis.formatMix.map((format, index) => {
    const previousCount = analysis.formatMix
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.count, 0);
    const percentage = formatTotal === 0 ? 0 : (format.count / formatTotal) * 100;
    const start = formatTotal === 0 ? 0 : (previousCount / formatTotal) * 100;
    return {
      ...format,
      color: formatColors[index % formatColors.length],
      percentage,
      start,
    };
  });
  const engagementCards = [
    {
      label: "팔로워/구독자",
      value: `${formatNumber(creator.profile.followers)}명`,
      percentile: poolPercentiles.audience,
    },
    {
      label: "평균 조회",
      value: metricValue(analysis.averages.views),
      percentile: poolPercentiles.views,
    },
    {
      label: "평균 좋아요",
      value: metricValue(analysis.averages.likes),
      percentile: poolPercentiles.likes,
    },
    {
      label: "평균 댓글",
      value: metricValue(averageComments),
      percentile: poolPercentiles.comments,
    },
    {
      label: "ER",
      value: engagementRate === null ? "-" : `${engagementRate.toFixed(1)}%`,
      percentile: poolPercentiles.engagement,
    },
  ];
  const contentCards = [
    {
      label: "콘텐츠 수",
      value: `${formatNumber(creator.contentCount)}건`,
    },
    {
      label: `최근 ${analysis.collectionDays}일 콘텐츠`,
      value: `${formatNumber(collectedContentCount)}건`,
    },
    {
      label: "업로드 주기",
      value: `주 ${cadence.weeklyAverage.toFixed(1)}회`,
    },
    {
      label: "마지막 게시일",
      value: analysis.lastPostDate,
    },
  ];
  const fallbackEvidence: AnalysisEvidence = { label: "채널 프로필", url: creator.profile.profileUrl };
  const claimFor = (label: string) => analysis.qualitativeClaims.find((claim) => claim.label === label);
  const summarySource = claimFor("요약");
  const summaryClaim: QualitativeClaim = summarySource
    && (creator.aiReport.status !== "ready" || summarySource.value !== "분석 리포트 생성 대기")
    ? summarySource
    : {
      label: "요약",
      value: creator.aiReport.summary || summarySource?.value || "분석 리포트 생성 대기",
      evidence: summarySource?.evidence ?? fallbackEvidence,
    };
  const combinedStrengthClaim = claimFor("강점/유의점");
  const combinedParts = combinedStrengthClaim?.value.split("·").map((value) => value.trim()) ?? [];
  const narrativeClaims: QualitativeClaim[] = [
    claimFor("위험 요소") ?? {
      label: "위험 요소",
      value: "최근 수집 콘텐츠에서 특이 위험 요소 미확인",
      evidence: fallbackEvidence,
    },
    claimFor("강점") ?? {
      label: "강점",
      value: combinedParts[0]?.replace(/^강점:\s*/, "")
        || creator.aiReport.summary
        || `${creator.category} 콘텐츠의 반응이 안정적입니다.`,
      evidence: combinedStrengthClaim?.evidence ?? fallbackEvidence,
    },
    claimFor("유의점") ?? {
      label: "유의점",
      value: combinedParts[1]?.replace(/^유의점:\s*/, "")
        || "협업 전 최근 콘텐츠의 광고 고지 방식과 업로드 일정을 확인해야 합니다.",
      evidence: combinedStrengthClaim?.evidence ?? fallbackEvidence,
    },
  ];
  const collaborationClaim = claimFor("협업 이력");
  const contentTypeClaim = claimFor("콘텐츠 유형");
  const toneClaim = claimFor("톤앤매너");
  const splitTagValues = (value: string) => value.split(" · ").map((item) => item.trim()).filter(Boolean);
  const tagGroups = [
    {
      label: "카테고리",
      values: [creator.category],
      evidence: claimFor("카테고리")?.evidence ?? fallbackEvidence,
    },
    {
      label: "키워드",
      values: creator.keywords,
      evidence: claimFor("키워드")?.evidence ?? fallbackEvidence,
    },
    {
      label: "협업 이력",
      values: collaborationClaim ? splitTagValues(collaborationClaim.value) : [],
      evidence: collaborationClaim?.evidence ?? fallbackEvidence,
    },
    {
      label: "콘텐츠 유형",
      values: contentTypeClaim ? splitTagValues(contentTypeClaim.value) : ["리뷰", "브이로그", "하울"],
      evidence: contentTypeClaim?.evidence ?? fallbackEvidence,
    },
    {
      label: "톤앤매너",
      values: toneClaim ? splitTagValues(toneClaim.value) : [],
      evidence: toneClaim?.evidence ?? fallbackEvidence,
    },
  ];

  return (
    <ProfileAnalysisReport
      collectedAt={analysis.collectedAt}
      collectionDays={analysis.collectionDays}
      comparisonLabel={comparison.label}
      contentMetrics={contentCards}
      engagementMetrics={engagementCards}
      eyebrow={eyebrow}
      formatSegments={formatSegments}
      formatTotal={formatTotal}
      narratives={narrativeClaims}
      summary={summaryClaim.value}
      tagGroups={tagGroups}
      title={title}
    />
  );
}
