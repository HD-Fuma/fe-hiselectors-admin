import { ProfileAnalysisReport } from "../../components/ui/ProfileAnalysisReport";
import type {
  AdminApplicationDetail,
  ApplicationContentFormat,
  ApplicationMetricValue,
} from "../../entities/application";
import { formatNumber } from "../../lib/formatters";

const FORMAT_COLORS = ["#de76ce", "#667085", "#a0a8b0", "#c8cdd2"];

function dateTime(value: string | null) {
  return value ? value.replace("T", " ").slice(0, 16).replaceAll("-", ".") : "-";
}

function metricValue(metric: ApplicationMetricValue, suffix = "") {
  const value = metric.value === null ? "-" : `${formatNumber(metric.value)}${suffix}`;
  return `${value} · 표본 ${formatNumber(metric.sampleCount)}건`;
}

function formatLabel(format: ApplicationContentFormat) {
  if (format === "SHORT_FORM") return "릴스";
  if (format === "LONG_FORM") return "롱폼";
  if (format === "SHORTS") return "Shorts";
  if (format === "FEED") return "피드";
  return "미분류";
}

function reportSummary(applicant: AdminApplicationDetail) {
  if (applicant.mediaCollectionStatus === "PENDING") {
    return "SNS 정량 지표 수집을 기다리고 있습니다.";
  }
  if (applicant.mediaCollectionStatus === "FAILED") {
    return "SNS 정량 지표를 수집하지 못했습니다.";
  }
  if (applicant.metrics.recent90DayContentCount === null) {
    return "SNS 정량 지표를 확인할 수 없습니다.";
  }
  if (applicant.metrics.recent90DayContentCount === 0) {
    return `최근 ${applicant.metrics.analysisWindowDays}일에 수집된 콘텐츠가 없습니다.`;
  }
  return `최근 ${applicant.metrics.analysisWindowDays}일 콘텐츠 ${formatNumber(applicant.metrics.recent90DayContentCount)}건의 공개 정량 지표입니다.`;
}

export function ApplicantAnalysisReport({ applicant }: { applicant: AdminApplicationDetail }) {
  const collectionDone = applicant.mediaCollectionStatus === "DONE";
  const formatTotal = applicant.metrics.contentFormats.reduce((total, format) => (
    total + format.count
  ), 0);
  const formatSegments = applicant.metrics.contentFormats.map((format, index) => {
    const previousCount = applicant.metrics.contentFormats
      .slice(0, index)
      .reduce((total, previous) => total + previous.count, 0);
    return {
      color: FORMAT_COLORS[index % FORMAT_COLORS.length],
      count: format.count,
      label: formatLabel(format.contentType),
      percentage: formatTotal === 0 ? 0 : (format.count / formatTotal) * 100,
      start: formatTotal === 0 ? 0 : (previousCount / formatTotal) * 100,
    };
  });
  const unavailableNarrative = "정성 분석 데이터가 제공되지 않았습니다.";

  return (
    <ProfileAnalysisReport
      collectedAt={dateTime(applicant.mediaCollectedAt)}
      collectionDays={applicant.metrics.analysisWindowDays}
      comparisonLabel="지원자 중"
      contentMetrics={[
        {
          label: "전체 공개 콘텐츠",
          value: applicant.metrics.totalContentCount === null
            ? "-"
            : `${formatNumber(applicant.metrics.totalContentCount)}건`,
        },
        {
          label: `최근 ${applicant.metrics.analysisWindowDays}일 콘텐츠`,
          value: applicant.metrics.recent90DayContentCount === null
            ? "-"
            : `${formatNumber(applicant.metrics.recent90DayContentCount)}건`,
        },
        {
          label: "업로드 주기",
          value: collectionDone
            ? `${applicant.metrics.uploadCadence.weeklyAverage === null
              ? "-"
              : `주 ${applicant.metrics.uploadCadence.weeklyAverage.toFixed(1)}회`} · 표본 ${formatNumber(applicant.metrics.uploadCadence.sampleCount)}건`
            : "-",
        },
        {
          label: "최장 게시 공백",
          value: applicant.metrics.uploadCadence.maximumGapDays === null
            ? "-"
            : `${formatNumber(applicant.metrics.uploadCadence.maximumGapDays)}일`,
        },
        { label: "마지막 게시일", value: dateTime(applicant.metrics.lastPublishedAt).slice(0, 10) },
      ]}
      engagementMetrics={[
        {
          label: "팔로워/구독자",
          value: applicant.followerCount === null ? "-" : `${formatNumber(applicant.followerCount)}명`,
          percentile: null,
        },
        {
          label: "평균 조회",
          value: collectionDone ? metricValue(applicant.metrics.averageViewCount) : "-",
          percentile: null,
        },
        {
          label: "평균 좋아요",
          value: collectionDone ? metricValue(applicant.metrics.averageLikeCount) : "-",
          percentile: null,
        },
        {
          label: "평균 댓글",
          value: collectionDone ? metricValue(applicant.metrics.averageCommentCount) : "-",
          percentile: null,
        },
        {
          label: "ER",
          value: collectionDone ? metricValue(applicant.metrics.engagementRate, "%") : "-",
          percentile: null,
        },
      ]}
      eyebrow="APPLICANT REPORT"
      formatSegments={formatSegments}
      formatTotal={applicant.mediaCollectionStatus === "DONE"
        && applicant.metrics.recent90DayContentCount !== null
        ? formatTotal
        : null}
      formatTotalLabel="수집 콘텐츠"
      narratives={[
        { label: "위험 요소", value: `미확인 (${unavailableNarrative})` },
        { label: "강점", value: unavailableNarrative },
        { label: "유의점", value: unavailableNarrative },
      ]}
      summary={reportSummary(applicant)}
      tagGroups={[
        { label: "카테고리", values: [] },
        { label: "키워드", values: [] },
        { label: "협업 이력", values: [] },
        { label: "콘텐츠 유형", values: formatSegments.map((format) => format.label) },
        { label: "톤앤매너", values: [] },
      ]}
      title="지원자 분석 리포트"
    />
  );
}
