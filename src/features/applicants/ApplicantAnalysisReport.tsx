import { formatNumber } from "../../lib/formatters";
import { ProfileAnalysisReport } from "../../components/ui/ProfileAnalysisReport";
import {
  APPLICANTS,
  applicantAnalysisFor,
  applicantFeaturedContentFor,
  type ApplicantFixture,
} from "./fixtures";

function topPercentile(value: number, pool: readonly number[]) {
  if (pool.length === 0) return null;
  const rank = pool.filter((candidate) => candidate > value).length + 1;
  return Math.max(1, Math.ceil((rank / pool.length) * 100));
}

function fallbackCadence(recentActivity: string, sampleCount: number) {
  const updatedAt = Date.parse("2026-08-05T00:00:00Z") / 86_400_000;
  const firstDay = updatedAt - 90 + 1;
  const sortedDays = Array.from({ length: sampleCount }, (_, index) => (
    (Date.parse(`${recentActivity}T00:00:00Z`) - index * 3 * 86_400_000) / 86_400_000
  ))
    .filter((day) => day >= firstDay && day <= updatedAt)
    .sort((left, right) => right - left);

  return {
    collectedContentCount: sortedDays.length,
    weeklyAverage: Number(((sortedDays.length / 90) * 7).toFixed(1)),
  };
}

export function ApplicantAnalysisReport({ applicant }: { applicant: ApplicantFixture }) {
  const analysis = applicantAnalysisFor(applicant);
  const poolAnalyses = APPLICANTS.map((candidate) => applicantAnalysisFor(candidate));
  const featuredContents = applicantFeaturedContentFor(applicant);
  const cadence = fallbackCadence(applicant.recentActivity, featuredContents.length);
  const fallbackFormats = applicant.platform === "YouTube"
    ? [
      { label: "숏폼", count: Math.max(1, Math.round(featuredContents.length * 0.7)) },
      { label: "롱폼", count: Math.max(1, Math.floor(featuredContents.length * 0.3)) },
    ]
    : [
      { label: "릴스", count: Math.max(1, Math.round(featuredContents.length * 0.5)) },
      { label: "이미지", count: Math.max(1, Math.round(featuredContents.length * 0.3)) },
      { label: "영상", count: Math.max(1, Math.floor(featuredContents.length * 0.2)) },
    ];
  const formatTotal = fallbackFormats.reduce((total, format) => total + format.count, 0);
  const formatColors = ["#de76ce", "#667085", "#a0a8b0", "#c8cdd2"];
  const formatSegments = fallbackFormats.map((format, index) => {
    const previousCount = fallbackFormats
      .slice(0, index)
      .reduce((total, previous) => total + previous.count, 0);
    const percentage = formatTotal === 0 ? 0 : (format.count / formatTotal) * 100;
    return {
      ...format,
      color: formatColors[index % formatColors.length],
      percentage,
      start: formatTotal === 0 ? 0 : (previousCount / formatTotal) * 100,
    };
  });

  return (
    <ProfileAnalysisReport
      collectedAt="2026.08.05 10:00"
      collectionDays={90}
      comparisonLabel="지원자 중"
      contentMetrics={[
        { label: "콘텐츠 수", value: `${formatNumber(applicant.contentCount)}건` },
        { label: "최근 90일 콘텐츠", value: `${formatNumber(cadence.collectedContentCount)}건` },
        { label: "업로드 주기", value: `주 ${cadence.weeklyAverage.toFixed(1)}회` },
        { label: "마지막 게시일", value: applicant.recentActivity },
      ]}
      engagementMetrics={[
        {
          label: "팔로워/구독자",
          value: `${formatNumber(applicant.followerCount)}명`,
          percentile: topPercentile(applicant.followerCount, APPLICANTS.map((candidate) => candidate.followerCount)),
        },
        {
          label: "평균 조회",
          value: formatNumber(applicant.averageViews),
          percentile: topPercentile(applicant.averageViews, APPLICANTS.map((candidate) => candidate.averageViews)),
        },
        {
          label: "평균 좋아요",
          value: formatNumber(applicant.averageReactions),
          percentile: topPercentile(applicant.averageReactions, poolAnalyses.map((candidate) => candidate.averageLikes)),
        },
        {
          label: "평균 댓글",
          value: formatNumber(analysis.averageComments),
          percentile: topPercentile(analysis.averageComments, poolAnalyses.map((candidate) => candidate.averageComments)),
        },
        {
          label: "ER",
          value: `${analysis.engagementRate.toFixed(1)}%`,
          percentile: topPercentile(analysis.engagementRate, poolAnalyses.map((candidate) => candidate.engagementRate)),
        },
      ]}
      eyebrow="APPLICANT REPORT"
      formatSegments={formatSegments}
      formatTotal={formatTotal}
      narratives={[
        { label: "위험 요소", value: "최근 수집 콘텐츠에서 특이 위험 요소 미확인" },
        { label: "강점", value: applicant.aiReport.summary || `${analysis.category} 콘텐츠의 반응이 안정적입니다.` },
        { label: "유의점", value: "협업 전 최근 콘텐츠의 광고 고지 방식과 업로드 일정을 확인해야 합니다." },
      ]}
      summary={applicant.aiReport.summary || "분석 리포트 생성 대기"}
      tagGroups={[
        { label: "카테고리", values: [analysis.category] },
        { label: "키워드", values: analysis.keywords.map((keyword) => `#${keyword.label}`) },
        { label: "협업 이력", values: [] },
        { label: "콘텐츠 유형", values: ["리뷰", "브이로그", "하울"] },
        { label: "톤앤매너", values: [] },
      ]}
      title="지원자 분석 리포트"
    />
  );
}
