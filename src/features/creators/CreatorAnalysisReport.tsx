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
    comments: AverageMetric;
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
    averages: { views: 48_200, likes: 3_050, comments: 228 },
    formatMix: [
      { label: "이미지 포함 피드", count: 8 },
      { label: "동영상 포함 피드", count: 6 },
      { label: "릴스", count: 15 },
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
    averages: { views: 26_800, likes: 1_130, comments: null },
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
      comments: null,
    },
    formatMix: [{ label: "수집 콘텐츠", count: engagementSamples.length }],
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

export function CreatorAnalysisReport({ creator }: { creator: CreatorFixture }) {
  const analysis = CREATOR_ANALYSES[creator.id] ?? fallbackAnalysis(creator);
  const cadence = deriveCadence(analysis.postDates, analysis.updatedAt.replaceAll(".", "-"), analysis.collectionDays);
  const collectedContentCount = Math.round(cadence.dailyAverage * analysis.collectionDays);
  const engagement = engagementResultForCreator(creator);
  const formatTotal = analysis.formatMix.reduce((sum, format) => sum + format.count, 0);
  const supplementalInteractions = analysis.supplementalInteractions.length > 0
    ? analysis.supplementalInteractions.map((item) => `${item.label} ${formatNumber(item.value)}`).join(" · ")
    : "집계 불가";
  const requiredClaims: Array<[string, string]> = [
    ["카테고리", creator.category],
    ["키워드", creator.keywords.join(" · ")],
    ["타깃", "AI 분석 결과 생성 중"],
    ["협업 이력", "최근 90일 수집 데이터에서 분석 중"],
    ["콘텐츠 유형", analysis.formatMix.map((format) => `${format.label} ${format.count}건`).join(" · ")],
    ["톤앤매너", "AI 이미지·텍스트 분석 중"],
    ["위험 요소", "최근 수집 콘텐츠 기준 특이 위험 요소 분석 중"],
    ["강점/유의점", "AI 분석 결과 생성 중"],
  ];
  const qualitativeClaims = [...analysis.qualitativeClaims];
  for (const [label, value] of requiredClaims) {
    if (!qualitativeClaims.some((claim) => claim.label === label)) {
      qualitativeClaims.push({ label, value, evidence: { label: "콘텐츠 URL", url: creator.profile.profileUrl } });
    }
  }

  return (
    <section aria-labelledby="creator-analysis-title" className="fuma-creator-analysis-report" id="analysis">
      <header className="fuma-content-section__header">
        <div>
          <p>CREATOR REPORT</p>
          <h2 id="creator-analysis-title">크리에이터 분석</h2>
        </div>
        <span>
          {creator.aiReport.status === "ready" ? "생성 완료" : "생성 대기"} · 최종 업데이트 {analysis.updatedAt} · 최근 {analysis.collectionDays}일 수집 데이터
        </span>
      </header>

      <div className="fuma-creator-analysis-report__content">
          <section aria-label="리포트 요약" className="fuma-creator-analysis-overview">
            <div>
              <span>분석 요약</span>
              <p>{creator.aiReport.status === "ready" ? creator.aiReport.summary : "AI 리포트를 생성하고 있습니다."}</p>
            </div>
            <dl>
              <div><dt>적합도 평가</dt><dd>{creator.aiReport.fitnessScore ?? "-"}<small>점</small></dd></div>
              <div><dt>수집 콘텐츠</dt><dd>{collectedContentCount}<small>건</small></dd></div>
              <div><dt>주간 업로드</dt><dd>{cadence.weeklyAverage.toFixed(1)}<small>회</small></dd></div>
            </dl>
          </section>

          <section aria-label="정량 분석" className="fuma-creator-analysis-block">
            <div className="fuma-creator-analysis-block__heading">
              <h3>정량 분석</h3>
              <span>수집 데이터 기준</span>
            </div>
            <div className="fuma-creator-analysis-metrics">
              <section className="fuma-creator-metric-group fuma-creator-metric-group--performance">
                <header>
                  <div><strong>반응 성과</strong><span>콘텐츠 1건당 평균 반응</span></div>
                  <b>{engagement.value === null ? "ER 집계 불가" : `ER ${engagement.value.toFixed(1)}%`}</b>
                </header>
                <dl className="fuma-creator-metric-hero-list">
                  <div><dt>평균 조회</dt><dd>{metricValue(analysis.averages.views)}</dd></div>
                  <div><dt>평균 좋아요</dt><dd>{metricValue(analysis.averages.likes)}</dd></div>
                  <div><dt>평균 댓글</dt><dd>{metricValue(analysis.averages.comments)}</dd></div>
                </dl>
              </section>

              <section className="fuma-creator-metric-group fuma-creator-metric-group--activity">
                <header>
                  <div><strong>활동 리듬</strong><span>최근 {analysis.collectionDays}일 업로드 흐름</span></div>
                  <b>주 {cadence.weeklyAverage.toFixed(1)}회</b>
                </header>
                <dl className="fuma-creator-metric-data-list">
                  <div><dt>수집 게시물</dt><dd>{collectedContentCount}<small>건</small></dd></div>
                  <div><dt>마지막 게시</dt><dd>{analysis.lastPostDate}</dd></div>
                  <div><dt>최대 공백</dt><dd>{cadence.longestGapDays}<small>일</small></dd></div>
                  <div><dt>전체 콘텐츠</dt><dd>{formatNumber(creator.contentCount)}<small>건</small></dd></div>
                </dl>
              </section>

              <section className="fuma-creator-metric-group fuma-creator-metric-group--format">
                <header>
                  <div><strong>콘텐츠 구성</strong><span>수집된 콘텐츠 형식 비중</span></div>
                  <b>{formatTotal}<small>건</small></b>
                </header>
                <ul className="fuma-creator-metric-format-list">
                  {analysis.formatMix.map((format) => (
                    <li key={format.label}>
                      <span>{format.label}</span>
                      <i><b style={{ width: `${formatTotal > 0 ? (format.count / formatTotal) * 100 : 0}%` }} /></i>
                      <strong>{format.count}<small>건</small></strong>
                    </li>
                  ))}
                </ul>
                <div className="fuma-creator-metric-footnotes">
                  <span>보조 상호작용 <b>{supplementalInteractions}</b></span>
                  <span>분석 기준 <b>{analysis.updatedAt} · 최근 {analysis.collectionDays}일</b></span>
                </div>
              </section>
            </div>
          </section>

          <section aria-label="AI 정성 분석" className="fuma-creator-analysis-block">
            <h3>AI 정성 분석</h3>
            <dl className="fuma-creator-analysis-claims">
              {qualitativeClaims.map((claim) => (
                <div key={claim.label}>
                  <dt>{claim.label}</dt>
                  <dd><span>{claim.value}</span><a href={claim.evidence.url} rel="noreferrer" target="_blank">근거 보기 ↗</a></dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
    </section>
  );
}
