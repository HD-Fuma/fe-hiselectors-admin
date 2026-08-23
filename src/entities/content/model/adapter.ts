import type {
  CollectedContent,
  CollectedContentType,
  ContentDetail,
  ContentEvidenceLocation,
  ContentVersionInspectionStatus,
  ContentVersionSummary,
  ContentViolation,
  ContentViolationItemStatus,
} from "../api";
import type {
  ContentAnnotation,
  ContentFormat,
  ContentInspectionFixture,
  ContentInspectionHistoryItem,
  ContentInspectionSignal,
  InspectionSignalTone,
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

const VERSION_HISTORY_LABELS: Record<ContentVersionInspectionStatus, string> = {
  COMPLETED: "자동 검수 완료",
  FAILED: "검수 실패",
  INSPECTING: "검수 중",
  PENDING: "검수 대기",
};

const CLOSED_VIOLATION_STATUSES = new Set<ContentViolationItemStatus>([
  "DISMISSED",
  "RESOLVED",
]);

function inspectionStatus(status: string | null) {
  return status ? INSPECTION_STATUSES[status] ?? "검수 대기" : "검수 대기";
}

function processingState(status: InspectionStatus): ProcessingState {
  if (status === "수정 요청") return "안내 대기";
  if (status === "승인" || status === "위반 확정") return "처리 완료";
  return "미처리";
}

function trimmedTexts(texts: readonly string[] | null | undefined) {
  return (texts ?? []).filter((text) => text.trim());
}

function clockTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const remainder = String(total % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function locationSource(location: ContentEvidenceLocation | undefined) {
  if (!location) return "자동 감지";
  if (location.mediaType === "TEXT") return "게시물 본문(TEXT)";
  if (location.mediaType === "IMAGE") return "OCR";
  if (location.startTime != null && location.endTime != null) {
    return `STT · ${clockTime(location.startTime)}–${clockTime(location.endTime)}`;
  }
  return "STT";
}

function locationQuote(location: ContentEvidenceLocation | undefined, text: string) {
  const excerpt = location?.excerpt?.trim();
  if (excerpt) return excerpt;
  if (
    location?.startIndex != null
    && location.endIndex != null
    && location.startIndex >= 0
    && location.endIndex <= text.length
    && location.startIndex < location.endIndex
  ) {
    return text.slice(location.startIndex, location.endIndex);
  }
  return "";
}

function signalTone(status: ContentViolationItemStatus): InspectionSignalTone {
  if (CLOSED_VIOLATION_STATUSES.has(status)) return "pass";
  if (status === "PENDING") return "warning";
  return "critical";
}

function signalsFromViolations(
  violations: readonly ContentViolation[],
  text: string,
): ContentInspectionSignal[] {
  return violations.map((violation) => {
    const location = violation.evidence?.locations[0];
    return {
      detail: violation.evidence?.reason?.trim() || violation.violationTypeDescription,
      evidence: locationQuote(location, text) || violation.violationTypeDescription,
      source: locationSource(location),
      title: violation.violationTypeDescription,
      tone: signalTone(violation.status),
    };
  });
}

function annotationsFromViolations(
  violations: readonly ContentViolation[],
  text: string,
): ContentAnnotation[] {
  return violations.flatMap((violation) => (
    (violation.evidence?.locations ?? [])
      .filter((location) => location.mediaType === "TEXT")
      .flatMap((location, locationIndex) => {
        const quote = locationQuote(location, text);
        if (!quote) return [];
        const hasMatchingRange = location.startIndex != null
          && location.endIndex != null
          && location.startIndex >= 0
          && location.endIndex <= text.length
          && location.startIndex < location.endIndex
          && text.slice(location.startIndex, location.endIndex) === quote;
        return [{
          guidance: violation.evidence?.reason?.trim() || "표시된 근거를 확인해 주세요.",
          id: `violation-${violation.violationItemId}-${locationIndex}`,
          location: locationSource(location),
          reason: violation.evidence?.reason?.trim() || violation.violationTypeDescription,
          severity: signalTone(violation.status) === "warning" ? "warning" : "critical",
          source: "자동 감지" as const,
          state: CLOSED_VIOLATION_STATUSES.has(violation.status) ? "resolved" as const : "active" as const,
          target: {
            kind: "text" as const,
            occurrence: 1,
            quote,
            ...(hasMatchingRange
              ? { endIndex: location.endIndex ?? undefined, startIndex: location.startIndex ?? undefined }
              : {}),
          },
          title: violation.violationTypeDescription,
        }];
      })
  ));
}

function historyFromVersions(
  storedAt: string,
  versions: readonly ContentVersionSummary[],
): ContentInspectionHistoryItem[] {
  const items: ContentInspectionHistoryItem[] = [
    { actor: "수집 시스템", at: storedAt, label: "콘텐츠 수집" },
  ];

  [...versions]
    .sort((left, right) => left.versionNo - right.versionNo)
    .forEach((version) => {
      if (version.versionNo > 1) {
        items.push({
          actor: "수집 시스템",
          at: version.createdAt,
          label: `버전 ${version.versionNo} 수집`,
        });
      }
      if (version.inspectedAt) {
        items.push({
          actor: "검수 시스템",
          at: version.inspectedAt,
          label: VERSION_HISTORY_LABELS[version.inspectionStatus] ?? "자동 검수 완료",
        });
      }
    });

  return items;
}

export function adaptContentInspection(content: CollectedContent): ContentInspectionFixture {
  const texts = trimmedTexts(content.texts);
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

export function adaptContentInspectionDetail(
  detail: ContentDetail,
  base?: ContentInspectionFixture,
): ContentInspectionFixture {
  const selectedVersion = detail.selectedVersion;
  const texts = trimmedTexts(selectedVersion.texts);
  const text = texts.join("\n") || base?.currentSnapshot.text || "";
  const violations = selectedVersion.violations ?? [];
  const contentReport = selectedVersion.contentReport;
  const analysisReady = Boolean(contentReport)
    || violations.length > 0
    || selectedVersion.inspectionStatus === "COMPLETED";
  const activeViolations = violations.filter((violation) => !CLOSED_VIOLATION_STATUSES.has(violation.status));
  const contentFormat = CONTENT_FORMATS[detail.contentType];
  const status = base?.inspectionStatus ?? "검수 대기";
  const latestVersionNo = Math.max(
    selectedVersion.versionNo,
    base?.latestVersionNo ?? 0,
    ...(detail.versions ?? []).map((version) => version.versionNo),
  );

  return {
    accountId: base?.accountId,
    aiStatus: analysisReady ? "ready" : "pending",
    aiSummary: contentReport?.summary?.trim() || (analysisReady ? "분석 완료" : "분석 대기"),
    author: base?.author || detail.snsContentId,
    availableActions: base?.availableActions ?? [],
    changeItems: base?.changeItems ?? [],
    cohort: base?.cohort ?? "",
    contentFormat: base?.contentFormat ?? contentFormat,
    contentTitle: texts[0] ?? base?.contentTitle ?? detail.snsContentId,
    contentUrl: detail.contentUrl || base?.contentUrl,
    contentVersionId: selectedVersion.contentVersionId,
    currentSnapshot: {
      capturedAt: selectedVersion.createdAt,
      label: base?.currentSnapshot.label ?? contentFormat,
      mediaCount: base?.currentSnapshot.mediaCount ?? 0,
      mediaKinds: base?.currentSnapshot.mediaKinds ?? [],
      mediaUrls: base?.currentSnapshot.mediaUrls ?? [],
      text,
      urls: base?.currentSnapshot.urls
        ?? (detail.contentUrl ? [detail.contentUrl] : []),
      youtubeVideoId: base?.currentSnapshot.youtubeVideoId
        ?? (detail.snsCode === "YOUTUBE" ? detail.snsContentId : undefined),
      annotations: annotationsFromViolations(violations, text),
    },
    detectedIssues: activeViolations.map((violation) => violation.violationTypeDescription),
    id: String(detail.contentId),
    inspectionStatus: status,
    inspectionType: latestVersionNo > 1 ? "EDITED" : "NEW",
    latestVersionNo,
    previousSnapshot: base?.previousSnapshot ?? null,
    processingState: processingState(status),
    profileImageUrl: base?.profileImageUrl,
    report: {
      extracts: [],
      flow: contentReport?.flow ?? null,
      generatedAt: selectedVersion.inspectedAt,
      history: historyFromVersions(detail.storedAt, detail.versions ?? []),
      overallAssessment: contentReport?.overallAssessment ?? null,
      purpose: contentReport?.purpose ?? null,
      signals: signalsFromViolations(violations, text),
    },
    selectorsId: detail.selectorsId,
    sourcePlatform: detail.snsCode === "YOUTUBE" ? "YouTube" : "Instagram",
    submittedAt: detail.storedAt,
    versions: detail.versions ?? [],
    violationType: activeViolations[0]?.violationTypeDescription ?? null,
  };
}
