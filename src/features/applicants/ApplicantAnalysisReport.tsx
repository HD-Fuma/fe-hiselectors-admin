import { ProfileAnalysisReport } from "../../components/ui/ProfileAnalysisReport";
import { categoryLabel } from "../../entities/creator";
import type {
  AdminApplicationAiReport,
  AdminApplicationDetail,
  ApplicationContentFormat,
  ApplicationMetricValue,
  ApplicationRepresentativeContentType,
} from "../../entities/application";
import { assetUrl } from "../../lib/assetUrl";
import { formatCompactCount, formatNumber } from "../../lib/formatters";

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

const MAX_KEYWORDS = 5;

const BRACKET_OPEN = new Set(["(", "[", "{"]);
const BRACKET_CLOSE = new Set([")", "]", "}"]);

/** 괄호 안의 쉼표(예: "메뉴(피자, 파스타)")는 무시하고, 최상위 쉼표에서만 나눈다. */
function splitTopLevelCommas(value: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (BRACKET_OPEN.has(char)) depth++;
    else if (BRACKET_CLOSE.has(char)) depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function splitCsv(...values: (string | undefined)[]) {
  return values
    .flatMap((value) => (value ? splitTopLevelCommas(value) : []))
    .map((value) => value.trim().replace(/^[-–—]\s*/, ""))
    .filter(Boolean);
}

const CONTENT_TYPE_TOKENS = new Set(["SHORT_FORM", "LONG_FORM", "SHORTS", "FEED", "REELS", "POST"]);

/** 톤앤매너 응답에 콘텐츠 유형 원시값(예: LONG_FORM)이 섞여 나오는 백엔드 이슈 방어. */
function excludeContentTypeTokens(values: string[]) {
  return values.filter((value) => !CONTENT_TYPE_TOKENS.has(value.toUpperCase()));
}

const GENERIC_UI_TOKENS = new Set([
  "게시물", "게시글", "미디어", "팔로우", "팔로워", "팔로잉", "보기", "가입", "좋아요", "댓글", "공유", "저장", "더보기", "프로필", "편집", "메시지",
]);

/** 키워드 응답에 SNS 화면의 버튼/메뉴 라벨(예: 팔로우, 가입)이 섞여 나오는 백엔드 이슈 방어. */
function excludeGenericUiTokens(values: readonly string[]) {
  return values.filter((value) => !GENERIC_UI_TOKENS.has(value.trim()));
}

function narrativeValues(raw: string | undefined, fallback: string) {
  const values = splitCsv(raw);
  return values.length > 0 ? values : [fallback];
}

const YOUTUBE_VIDEO_ID_PATTERN = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const INSTAGRAM_POST_PATTERN = /instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/;

function youtubeEmbedUrl(url: string) {
  const videoId = YOUTUBE_VIDEO_ID_PATTERN.exec(url)?.[1];
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1` : null;
}

function instagramEmbedUrl(url: string) {
  const match = INSTAGRAM_POST_PATTERN.exec(url);
  return match ? `https://www.instagram.com/${match[1]}/${match[2]}/embed` : null;
}

function representativeEmbedUrl(snsCode: "INSTAGRAM" | "YOUTUBE", url: string) {
  return snsCode === "YOUTUBE" ? youtubeEmbedUrl(url) : instagramEmbedUrl(url);
}

function representativeContentTypeLabel(type: ApplicationRepresentativeContentType) {
  if (type === "SHORT_FORM") return "숏폼";
  if (type === "FEED") return "피드";
  return "롱폼";
}

function representativeBasis(representativeViewCount: number | null, averageViewCount: number | null) {
  if (representativeViewCount === null || averageViewCount === null || averageViewCount <= 0) {
    return { bars: [], insight: null };
  }
  const multiplier = representativeViewCount / averageViewCount;
  const insight = multiplier >= 1.05
    ? `평균보다 ${multiplier.toFixed(1)}배 높은 조회수예요.`
    : multiplier <= 0.95
      ? "평균보다 낮은 조회수예요."
      : "평균과 비슷한 조회수예요.";
  return {
    bars: [
      {
        label: "대표 콘텐츠",
        tone: "accent" as const,
        value: representativeViewCount,
        valueLabel: `${formatCompactCount(representativeViewCount)}회`,
      },
      {
        label: "평균 콘텐츠",
        tone: "muted" as const,
        value: averageViewCount,
        valueLabel: `${formatCompactCount(averageViewCount)}회`,
      },
    ],
    insight,
  };
}

function qualitativeStatusMessage(aiReport: AdminApplicationAiReport | null | undefined, applicant: AdminApplicationDetail) {
  if (aiReport) return null;
  if (applicant.mediaCollectionStatus === "FAILED") {
    return "SNS 콘텐츠 수집에 실패해 AI 분석을 시작하지 못했습니다.";
  }
  if (applicant.status === "REJECTED") {
    return "반려된 지원서는 AI 분석 대상에서 제외됩니다.";
  }
  if (applicant.analysisStatus === "PENDING" || applicant.analysisStatus === "IN_PROGRESS") {
    return "AI 리포트를 생성하는 중입니다. 잠시 후 다시 확인해주세요.";
  }
  if (applicant.analysisStatus === "FAILED") {
    return "AI 리포트 생성에 실패했습니다.";
  }
  return null;
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

export function ApplicantAnalysisReport({ aiReport, applicant }: {
  aiReport?: AdminApplicationAiReport | null;
  applicant: AdminApplicationDetail;
}) {
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
  const basis = representativeBasis(
    aiReport?.representativeViewCount ?? null,
    collectionDone ? applicant.metrics.averageViewCount.value : null,
  );
  const representativeMatchedContent = aiReport?.representativeContentUrl
    ? applicant.contents.find((content) => content.contentUrl === aiReport.representativeContentUrl)
    : null;
  const representativeContent = aiReport?.representativeContentUrl && aiReport.representativeContentType
    ? {
      basisBars: basis.bars,
      basisInsight: basis.insight,
      category: categoryLabel(aiReport.representativeCategory || aiReport.category || null),
      contentTypeLabel: representativeContentTypeLabel(aiReport.representativeContentType),
      embedUrl: representativeEmbedUrl(applicant.snsCode, aiReport.representativeContentUrl),
      isVideo: aiReport.representativeContentType !== "FEED",
      keywords: excludeGenericUiTokens(
        aiReport.representativeKeywords?.length ? aiReport.representativeKeywords : aiReport.keywords,
      ),
      mediaAlt: `${applicant.applicantName} 대표 콘텐츠`,
      mediaUrl: (() => {
        const thumbnailUrl = representativeMatchedContent?.thumbnailUrl
          ?? (representativeMatchedContent?.mediaType === "IMAGE" ? representativeMatchedContent.mediaUrl : null);
        return thumbnailUrl ? assetUrl(thumbnailUrl) : null;
      })(),
      url: aiReport.representativeContentUrl,
      videoUrl: representativeMatchedContent?.mediaType === "VIDEO" && representativeMatchedContent.mediaUrl
        ? assetUrl(representativeMatchedContent.mediaUrl)
        : null,
      viewCountLabel: aiReport.representativeViewCount === null
        ? null
        : `조회수 ${formatCompactCount(aiReport.representativeViewCount)}`,
    }
    : null;
  const engagementFunnel = collectionDone
    ? [
      {
        label: "평균 조회",
        percentile: applicant.metrics.viewCountPercentile ?? null,
        value: applicant.metrics.averageViewCount.value,
      },
      {
        label: "평균 좋아요",
        percentile: applicant.metrics.likeCountPercentile ?? null,
        value: applicant.metrics.averageLikeCount.value,
      },
      {
        label: "평균 댓글",
        percentile: applicant.metrics.commentCountPercentile ?? null,
        value: applicant.metrics.averageCommentCount.value,
      },
    ]
      .filter((metric): metric is { label: string; percentile: number | null; value: number } => (
        metric.value !== null
      ))
      .map((metric) => ({
        label: metric.label,
        tone: "accent" as const,
        value: metric.percentile === null ? 0 : 101 - metric.percentile,
        valueLabel: metric.percentile === null
          ? `${formatNumber(metric.value)}건`
          : `상위 ${metric.percentile}% · ${formatNumber(metric.value)}건`,
      }))
    : [];
  const qualitativeStatus = qualitativeStatusMessage(aiReport, applicant);
  const riskValues = splitCsv(aiReport?.risks);
  const riskNarrative = riskValues.length > 0 ? { label: "위험 요소", values: riskValues } : null;

  return (
    <ProfileAnalysisReport
      completedAt={aiReport
        ? dateTime(aiReport.createdAt || applicant.mediaCollectedAt)
        : applicant.analysisStatus === "DONE"
          ? dateTime(applicant.mediaCollectedAt)
          : null}
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
          value: collectionDone && applicant.metrics.uploadCadence.weeklyAverage !== null
            ? `주 ${applicant.metrics.uploadCadence.weeklyAverage.toFixed(1)}회`
            : "-",
        },
        { label: "마지막 게시일", value: dateTime(applicant.metrics.lastPublishedAt).slice(0, 10) },
      ]}
      engagementFunnel={engagementFunnel}
      engagementMetrics={[
        {
          label: "팔로워/구독자",
          value: applicant.followerCount === null ? "-" : `${formatNumber(applicant.followerCount)}명`,
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
      narratives={aiReport ? [
        { label: "강점", values: narrativeValues(aiReport.strength, unavailableNarrative) },
        { label: "유의점", values: narrativeValues(aiReport.cautions, unavailableNarrative) },
      ] : [
        { label: "강점", values: [unavailableNarrative] },
        { label: "유의점", values: [unavailableNarrative] },
      ]}
      qualitativeStatus={qualitativeStatus}
      representativeContent={representativeContent}
      riskNarrative={riskNarrative}
      summary={aiReport?.summary || reportSummary(applicant)}
      tagGroups={[
        { label: "카테고리", values: aiReport?.category ? [categoryLabel(aiReport.category) ?? aiReport.category] : [] },
        { label: "키워드", values: excludeGenericUiTokens(aiReport?.keywords ?? []).slice(0, MAX_KEYWORDS) },
        { label: "콘텐츠 유형", values: formatSegments.map((format) => format.label) },
        {
          label: "톤앤매너",
          values: aiReport ? excludeContentTypeTokens(splitCsv(aiReport.tone, aiReport.contentStyle)) : [],
        },
      ]}
      title="지원자 분석 리포트"
    />
  );
}
