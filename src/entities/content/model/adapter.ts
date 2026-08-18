import type { CollectedContent, CollectedContentType } from "../api";
import type {
  ContentFormat,
  ContentInspectionFixture,
  InspectionStatus,
  ProcessingState,
} from "./fixtures";

const CONTENT_FORMATS: Record<CollectedContentType, ContentFormat> = {
  FEED: "인스타 피드",
  LONG_FORM: "유튜브 롱폼",
  SHORT_FORM: "인스타 릴스",
  SHORTS: "유튜브 쇼츠",
};

const INSPECTION_STATUSES: Record<string, InspectionStatus> = {
  APPROVED: "승인",
  PENDING: "검수 대기",
  REVISION_REQUESTED: "수정 요청",
  VIOLATION_CONFIRMED: "위반 확정",
  "검수 대기": "검수 대기",
  "수정 요청": "수정 요청",
  "승인": "승인",
  "위반 확정": "위반 확정",
};

function inspectionStatus(status: string | null) {
  return status ? INSPECTION_STATUSES[status] ?? "검수 대기" : "검수 대기";
}

function processingState(status: InspectionStatus): ProcessingState {
  if (status === "수정 요청") return "안내 대기";
  if (status === "승인" || status === "위반 확정") return "처리 완료";
  return "미처리";
}

export function adaptContentInspection(content: CollectedContent): ContentInspectionFixture {
  const texts = content.texts.filter((text) => text.trim());
  const media = [...content.media].sort((left, right) => left.sequenceNo - right.sequenceNo);
  const status = inspectionStatus(content.inspectionStatus);
  const contentFormat = CONTENT_FORMATS[content.contentType];
  const youtubeVideoId = content.snsCode === "YOUTUBE"
    ? media.find(({ mediaType }) => mediaType === "VIDEO")?.snsMediaId ?? content.snsContentId
    : undefined;

  return {
    accountId: content.accountId,
    aiStatus: "pending",
    aiSummary: "분석 대기",
    author: content.selectorsNickname?.trim() || content.accountId,
    availableActions: [],
    changeItems: [],
    cohort: content.generationName,
    contentFormat,
    contentTitle: texts[0] ?? content.snsContentId,
    contentUrl: content.contentUrl,
    currentSnapshot: {
      capturedAt: content.latestVersionStoredAt,
      label: contentFormat,
      mediaCount: media.length,
      mediaKinds: media.map(({ mediaType }) => mediaType === "VIDEO" ? "동영상" : "이미지"),
      mediaUrls: media.map(({ mediaUrl }) => mediaUrl ?? ""),
      text: texts.join("\n"),
      urls: content.contentUrl ? [content.contentUrl] : [],
      youtubeVideoId,
    },
    detectedIssues: [],
    id: String(content.contentId),
    inspectionStatus: status,
    inspectionType: content.latestVersionNo > 1 ? "EDITED" : "NEW",
    latestVersionNo: content.latestVersionNo,
    previousSnapshot: null,
    processingState: processingState(status),
    profileImageUrl: content.profileImageUrl,
    report: {
      extracts: [],
      generatedAt: null,
      history: [
        { at: content.storedAt, label: "콘텐츠 수집", actor: "수집 시스템" },
        ...(content.inspectedAt && content.inspectionStatus
          ? [{ at: content.inspectedAt, label: status, actor: "콘텐츠 운영자" }]
          : []),
      ],
      signals: [],
    },
    selectorsId: content.selectorsId,
    sourcePlatform: content.snsCode === "YOUTUBE" ? "YouTube" : "Instagram",
    submittedAt: content.storedAt,
    violationType: null,
  };
}
