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

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function metricValue(value: AverageMetric) {
  return value === null ? "-" : formatNumber(value);
}

export function topNScore(creator: CreatorFixture) {
  const engagement = engagementResultForCreator(creator);
  return engagement.value === null ? null : engagement.value * Math.log(1 + creator.profile.followers);
}

export function deriveCadence(postDates: readonly string[], updatedAt: string, windowDays: number) {
  const toDay = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000;
  const updatedDay = toDay(updatedAt);
  const firstDay = updatedDay - windowDays + 1;
  const sortedDays = postDates
    .map(toDay)
    .filter((day) => day >= firstDay && day <= updatedDay)
    .sort((left, right) => right - left);
  const longestGapDays = sortedDays.slice(1).reduce((longest, day, index) => {
    return Math.max(longest, sortedDays[index] - day - 1);
  }, 0);
  return {
    dailyAverage: Number((sortedDays.length / windowDays).toFixed(2)),
    weeklyAverage: Number(((sortedDays.length / windowDays) * 7).toFixed(1)),
    longestGapDays,
  };
}

export function deriveEngagementRate(
  samples: readonly { audience: number; likes: number; comments: number | null }[],
) {
  const eligible = samples.filter(
    (sample): sample is { audience: number; likes: number; comments: number } =>
      sample.audience > 0 && sample.comments !== null,
  );
  if (eligible.length === 0) {
    return { value: null, sampleSize: 0 };
  }

  const totalRate = eligible.reduce(
    (sum, sample) => sum + ((sample.likes + sample.comments) / sample.audience) * 100,
    0,
  );
  return { value: Number((totalRate / eligible.length).toFixed(2)), sampleSize: eligible.length };
}

export function engagementResultForCreator(creator: CreatorFixture) {
  const samples = CREATOR_ANALYSES[creator.id]?.engagementSamples
    ?? ADDITIONAL_ENGAGEMENT_SAMPLES[creator.id]
    ?? [];
  return deriveEngagementRate(samples);
}

export function rankTopTwoN(creators: readonly CreatorFixture[], targetCount: number) {
  return [...creators]
    .filter((creator) => topNScore(creator) !== null)
    .sort((left, right) => (topNScore(right) ?? 0) - (topNScore(left) ?? 0))
    .slice(0, targetCount * 2);
}

export function selectTopNWithCategoryQuota(
  candidates: readonly CreatorFixture[],
  targetCount: number,
  maxPerCategory: number,
) {
  const categoryCounts = new Map<string, number>();
  const selected: CreatorFixture[] = [];
  for (const creator of candidates) {
    if (selected.length === targetCount || (categoryCounts.get(creator.category) ?? 0) >= maxPerCategory) {
      continue;
    }
    categoryCounts.set(creator.category, (categoryCounts.get(creator.category) ?? 0) + 1);
    selected.push(creator);
  }
  return selected;
}

function AnalysisFields({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="fuma-key-value-grid__item">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

void AnalysisFields;

export function CreatorAnalysisReport({
  creator,
  title = "크리에이터 분석 리포트",
}: {
  creator: CreatorFixture;
  title?: string;
}) {
  const analysis = CREATOR_ANALYSES[creator.id] ?? fallbackAnalysis(creator);
  const cadence = deriveCadence(analysis.postDates, analysis.updatedAt.replaceAll(".", "-"), analysis.collectionDays);
  const collectedContentCount = Math.round(cadence.dailyAverage * analysis.collectionDays);
  const engagement = deriveEngagementRate(analysis.engagementSamples);
  const commentSamples = analysis.engagementSamples.filter(
    (sample): sample is { audience: number; likes: number; comments: number } => sample.comments !== null,
  );
  const averageComments = commentSamples.length === 0
    ? null
    : Math.round(commentSamples.reduce((total, sample) => total + sample.comments, 0) / commentSamples.length);
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
  const formatGradient = formatSegments.length === 0
    ? "#d7dadd"
    : `conic-gradient(${formatSegments.map((segment) => `${segment.color} ${segment.start}% ${segment.start + segment.percentage}%`).join(", ")})`;
  const lastContentLabel = creator.profile.platform === "YouTube" ? "마지막 업로드일" : "마지막 게시일";
  const engagementCards = [
    {
      label: "평균 조회",
      value: metricValue(analysis.averages.views),
      description: "콘텐츠 1건당 평균",
    },
    {
      label: "평균 좋아요",
      value: metricValue(analysis.averages.likes),
      description: "콘텐츠 1건당 평균",
    },
    {
      label: "평균 댓글",
      value: metricValue(averageComments),
      description: commentSamples.length === 0 ? "수집된 댓글 표본 없음" : `수집 표본 ${commentSamples.length}건 기준`,
    },
    {
      label: "ER",
      value: engagement.value === null ? "-" : `${engagement.value.toFixed(1)}%`,
      description: engagement.value === null ? "유효 반응 표본 없음" : `유효 표본 ${engagement.sampleSize}건 기준`,
    },
  ];
  const contentCards = [
    {
      label: "팔로워·구독자",
      value: `${formatNumber(creator.profile.followers)}명`,
      description: "현재 공개 채널 기준",
    },
    {
      label: "업로드 주기",
      value: `주 ${cadence.weeklyAverage.toFixed(1)}회`,
      description: `최근 ${analysis.collectionDays}일 수집 기준`,
    },
    {
      label: "콘텐츠 수",
      value: `${formatNumber(creator.contentCount)}건`,
      description: "전체 공개 콘텐츠",
    },
    {
      label: `최근 ${analysis.collectionDays}일 콘텐츠`,
      value: `${formatNumber(collectedContentCount)}건`,
      description: "분석에 사용한 수집 콘텐츠",
    },
    {
      label: lastContentLabel,
      value: analysis.lastPostDate,
      description: "수집된 최신 콘텐츠",
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
  const narrativeClaims: QualitativeClaim[] = ["위험 요소", "강점/유의점"].flatMap((label) => {
    const claim = claimFor(label);
    return claim ? [claim] : [];
  });
  const collaborationClaim = claimFor("협업 이력");
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
      values: analysis.formatMix.map((format) => `${format.label} ${format.count}건`),
      evidence: claimFor("콘텐츠 유형")?.evidence ?? fallbackEvidence,
    },
    {
      label: "톤앤매너",
      values: toneClaim ? splitTagValues(toneClaim.value) : [],
      evidence: toneClaim?.evidence ?? fallbackEvidence,
    },
  ];

  return (
    <section aria-labelledby="creator-analysis-title" className="fuma-creator-analysis-report" id="analysis">
      <header className="fuma-content-section__header">
        <div>
          <p>CREATOR REPORT</p>
          <h2 id="creator-analysis-title">{title}</h2>
        </div>
      </header>

      <div className="fuma-creator-analysis-report__content">
          <section aria-label="리포트 요약" className="fuma-creator-analysis-overview">
            <div>
              <span>분석 요약</span>
              <p>{summaryClaim.value}</p>
            </div>
          </section>

          <section aria-label="정량 분석" className="fuma-creator-analysis-block">
            <div className="fuma-creator-analysis-block__heading">
              <h3>정량 분석</h3>
              <span>수집 데이터 기준</span>
            </div>
            <div className="fuma-creator-analysis-metrics">
              <section className="fuma-creator-metric-group fuma-creator-metric-group--performance fuma-analysis-engagement">
                <header className="fuma-analysis-engagement__header">
                  <div><strong>인게이지먼트</strong><span>수집된 콘텐츠의 평균 반응</span></div>
                </header>
                <div className="fuma-analysis-engagement__grid">
                  {engagementCards.map((metric) => (
                    <article className="fuma-analysis-engagement__card" key={metric.label}>
                      <span>{metric.label}</span>
                      <strong className={metric.label === "ER" ? "fuma-analysis-engagement__er" : undefined}>{metric.value}</strong>
                      <small>{metric.description}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="fuma-creator-metric-group fuma-analysis-content">
                <header className="fuma-analysis-content__header">
                  <div><strong>콘텐츠</strong><span>최근 {analysis.collectionDays}일 수집 데이터</span></div>
                </header>
                <div className="fuma-analysis-content__grid">
                  {contentCards.map((metric) => (
                    <article className="fuma-analysis-content__card" key={metric.label}>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                      <small>{metric.description}</small>
                    </article>
                  ))}
                  <article className="fuma-analysis-content__card fuma-analysis-content__card--formats">
                    <span>콘텐츠 형식</span>
                    <strong>{formatNumber(formatTotal)}건</strong>
                    <div className="fuma-analysis-format-breakdown">
                      <div
                        aria-label={`콘텐츠 형식 총 ${formatNumber(formatTotal)}건`}
                        className="fuma-analysis-format-breakdown__donut"
                        role="img"
                        style={{ background: formatGradient }}
                      >
                        <div><strong>{formatNumber(formatTotal)}</strong><span>건</span></div>
                      </div>
                      <ul className="fuma-analysis-format-breakdown__legend">
                        {formatSegments.map((format) => (
                          <li key={format.label}>
                            <i style={{ backgroundColor: format.color }} />
                            <span>{format.label}</span>
                            <strong>{format.percentage.toFixed(0)}% <small>{formatNumber(format.count)}건</small></strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </section>

          <section aria-label="AI 정성 분석" className="fuma-creator-analysis-block fuma-analysis-qualitative">
            <h3>AI 정성 분석</h3>
            <dl className="fuma-creator-analysis-claims fuma-analysis-qualitative__narrative-list">
              {narrativeClaims.map((claim) => (
                <div key={claim.label}>
                  <dt>{claim.label}</dt>
                  <dd><span>{claim.value}</span><a href={claim.evidence.url} rel="noreferrer" target="_blank">근거 보기 ↗</a></dd>
                </div>
              ))}
            </dl>
            <div className="fuma-analysis-tags">
              {tagGroups.map((group) => (
                <section aria-label={`${group.label} 태그`} className="fuma-analysis-tags__group" key={group.label}>
                  <header>
                    <strong>{group.label}</strong>
                    <a className="fuma-analysis-tags__evidence" href={group.evidence.url} rel="noreferrer" target="_blank">근거 보기 ↗</a>
                  </header>
                  <ul className="fuma-analysis-tags__list">
                    {group.values.length > 0
                      ? group.values.map((value) => (
                        <li className={`fuma-analysis-tags__tag${group.label === "키워드" ? " fuma-analysis-tags__tag--keyword" : ""}`} key={value}>
                          {value}
                        </li>
                      ))
                      : <li className="fuma-analysis-tags__empty">수집된 태그 없음</li>}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        </div>
    </section>
  );
}
