import type {
  CollectedContent,
  CollectedContentType,
  ContentDetail,
  ContentEvidenceLocation,
  ContentVersionInspectionStatus,
  ContentVersionMedia,
  ContentVersionSummary,
  ContentViolation,
  ContentViolationItemStatus,
  ContentViolationType,
} from "../api";
import type {
  ContentAnnotation,
  ContentFormat,
  ContentInspectionExtract,
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
  REJECTED: "위반",
  REVISION_REQUESTED: "수정 요청",
  VIOLATION_CONFIRMED: "위반",
  "검수 대기": "검수 대기",
  "수정 요청": "수정 요청",
  "승인": "승인",
  "위반": "위반",
  "위반 확정": "위반",
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

const ABSENCE_VIOLATION_TYPES = new Set<ContentViolationType>([
  "AD_DISCLOSURE_INVALID",
  "AFFILIATE_LINK_INVALID",
]);

const COMPLETED_ANALYSIS_STATUSES = new Set([
  "APPROVED",
  "COMPLETED",
  "REJECTED",
  "REVISION_REQUESTED",
  "VIOLATION_CONFIRMED",
  "수정 요청",
  "승인",
  "위반",
  "위반 확정",
]);

function analysisStatus(status: string | null): "ready" | "pending" {
  return status && COMPLETED_ANALYSIS_STATUSES.has(status) ? "ready" : "pending";
}

function inspectionStatus(status: string | null) {
  return status ? INSPECTION_STATUSES[status] ?? "검수 대기" : "검수 대기";
}

function processingState(status: InspectionStatus): ProcessingState {
  if (status === "수정 요청") return "안내 대기";
  if (status === "승인" || status === "위반") return "처리 완료";
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

function playbackRange(location: ContentEvidenceLocation) {
  if (location.startMs != null && location.endMs != null && location.endMs > location.startMs) {
    return { endMs: location.endMs, startMs: location.startMs };
  }
  if (location.startTime != null && location.endTime != null
      && location.endTime > location.startTime) {
    return {
      endMs: Math.round(location.endTime * 1000),
      startMs: Math.round(location.startTime * 1000),
    };
  }
  return null;
}

function timeRangeFromLocation(location: ContentEvidenceLocation) {
  const range = playbackRange(location);
  return range
    ? {
        end: clockTime(range.endMs / 1000),
        endMs: range.endMs,
        start: clockTime(range.startMs / 1000),
        startMs: range.startMs,
      }
    : undefined;
}

function mediaBoxFromLocation(location: ContentEvidenceLocation) {
  const bbox = location.bbox;
  if (!bbox) return {};
  const normalized = location.bboxCoordinateSpace === "NORMALIZED"
    || (bbox.x <= 1 && bbox.y <= 1 && bbox.width <= 1 && bbox.height <= 1);
  return {
    box: normalized
      ? {
          height: bbox.height * 100,
          width: bbox.width * 100,
          x: bbox.x * 100,
          y: bbox.y * 100,
        }
      : bbox,
    boxUnit: (normalized ? "percent" : "pixel") as "percent" | "pixel",
  };
}

function violationLocations(violation: ContentViolation) {
  const resolved = violation.resolvedLocations;
  if (resolved && resolved.length > 0) return resolved;
  return violation.evidence?.locations ?? [];
}

function locationSource(location: ContentEvidenceLocation | undefined) {
  if (!location) return "콘텐츠 전체";
  if (location.mediaType === "TEXT" || location.targetKind === "TEXT_BODY") {
    return "게시물 본문(TEXT)";
  }
  if (location.targetKind === "OCR_SEGMENT" || location.mediaType === "IMAGE") {
    return "OCR";
  }
  const range = playbackRange(location);
  if (range) {
    return `STT · ${clockTime(range.startMs / 1000)}–${clockTime(range.endMs / 1000)}`;
  }
  if (location.targetKind === "STT_SEGMENT" || location.mediaType === "VIDEO") {
    return "STT";
  }
  return "콘텐츠 전체";
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

<<<<<<< HEAD
function annotationState(
  status: ContentViolationItemStatus,
  showHistoricalEvidence: boolean,
): ContentAnnotation["state"] {
  return !showHistoricalEvidence && CLOSED_VIOLATION_STATUSES.has(status)
    ? "resolved"
    : "active";
}

function isAbsenceViolation(violation: ContentViolation) {
  return ABSENCE_VIOLATION_TYPES.has(violation.violationType)
    && violationLocations(violation).length === 0;
}

function needsDisclosureTextStartPin(violation: ContentViolation) {
  return violation.violationType === "AD_DISCLOSURE_INVALID"
    && !violationLocations(violation).some((location) => location.mediaType === "TEXT");
=======
function isAbsenceViolation(violation: ContentViolation) {
  return ABSENCE_VIOLATION_TYPES.has(violation.violationType)
    && (violation.evidence?.locations.length ?? 0) === 0;
>>>>>>> 232c7c06dd1c7cd0670a298ff0c7cdfc22d9e5d6
}

function signalsFromViolations(
  violations: readonly ContentViolation[],
  mediaTextById: ReadonlyMap<number, string>,
): ContentInspectionSignal[] {
  return violations.map((violation) => {
    const location = violationLocations(violation)[0];
    const locationText = location?.contentMediaId == null
      ? ""
      : mediaTextById.get(location.contentMediaId) ?? "";
    const absence = isAbsenceViolation(violation);
    return {
      detail: violation.evidence?.reason?.trim() || violation.violationTypeDescription,
      detectorSource: violation.evidence?.source,
      evidence: locationQuote(location, locationText) || violation.violationTypeDescription,
      locationAvailable: location !== undefined || absence,
      source: location ? locationSource(location) : absence ? "게시물 본문(TEXT)" : "콘텐츠 전체",
      title: violation.violationTypeDescription,
      tone: signalTone(violation.currentStatus),
      violationItemId: violation.violationItemId,
      violationType: violation.violationType,
      violationStatus: violation.currentStatus,
      inspectionPolicyId: violation.inspectionPolicyId,
      violationEvidenceHistoryId: violation.violationEvidenceHistoryId,
    };
  });
}

function annotationsFromViolations(
  violations: readonly ContentViolation[],
  media: readonly ContentVersionMedia[],
  textOffsets: ReadonlyMap<number, number>,
  showHistoricalEvidence: boolean,
): ContentAnnotation[] {
  const mediaById = new Map(media.map((item) => [item.contentMediaId, item]));
  const visualMedia = media.filter((item) => item.mediaType !== "TEXT");
  return violations.flatMap((violation) => {
<<<<<<< HEAD
    const locations = violationLocations(violation);
=======
    const locations = violation.evidence?.locations ?? [];
>>>>>>> 232c7c06dd1c7cd0670a298ff0c7cdfc22d9e5d6
    if (locations.length === 0 && isAbsenceViolation(violation)) {
      const textMedia = media.find((item) => item.mediaType === "TEXT");
      const visualIndex = textMedia
        ? -1
        : visualMedia.findIndex((item) => item.mediaType === "VIDEO" || item.mediaType === "IMAGE");
      const sourceMedia = textMedia ?? visualMedia[visualIndex];
      if (!sourceMedia) return [];
      const quote = violation.violationTypeDescription;
      return [{
        guidance: violation.evidence?.reason?.trim() || "표시된 근거를 확인해 주세요.",
        id: `violation-history-${violation.violationEvidenceHistoryId}-absence`,
        location: textMedia ? "게시물 본문(TEXT)" : locationSource(undefined),
        reason: violation.evidence?.reason?.trim() || violation.violationTypeDescription,
        severity: signalTone(violation.currentStatus) === "warning" ? "warning" : "critical",
        source: "자동 감지" as const,
<<<<<<< HEAD
          state: annotationState(violation.currentStatus, showHistoricalEvidence),
=======
          state: !showHistoricalEvidence && violation.currentStatus != null
            && violation.currentStatus !== "PENDING"
            ? "resolved" as const
            : "active" as const,
>>>>>>> 232c7c06dd1c7cd0670a298ff0c7cdfc22d9e5d6
        target: textMedia
          ? { kind: "text-start" as const, quote }
          : {
              kind: "media" as const,
              ...(visualIndex >= 0 ? { mediaIndex: visualIndex } : {}),
              quote,
            },
        title: violation.violationTypeDescription,
      }];
    }
<<<<<<< HEAD
    const locationAnnotations: ContentAnnotation[] = locations
      .flatMap((location, locationIndex): ContentAnnotation[] => {
=======
    return locations
      .flatMap((location, locationIndex) => {
>>>>>>> 232c7c06dd1c7cd0670a298ff0c7cdfc22d9e5d6
        const sourceMedia = location.contentMediaId == null
          ? undefined
          : mediaById.get(location.contentMediaId);
        if (!sourceMedia) return [];
        const mediaText = sourceMedia.text ?? "";
        const quote = locationQuote(location, mediaText)
          || location.excerpt?.trim()
          || violation.violationTypeDescription;
        const hasMatchingRange = location.startIndex != null
          && location.endIndex != null
          && location.startIndex >= 0
          && location.endIndex <= mediaText.length
          && location.startIndex < location.endIndex
          && mediaText.slice(location.startIndex, location.endIndex) === quote;
        const offset = textOffsets.get(sourceMedia.contentMediaId);
        const useTextTarget = sourceMedia.mediaType === "TEXT" && hasMatchingRange
          && offset !== undefined
          && location.startTime == null
          && location.startMs == null
          && location.bbox == null;
        const timeRange = timeRangeFromLocation(location);
        const visualIndex = visualMedia.findIndex(
          (item) => item.contentMediaId === sourceMedia.contentMediaId,
        );
        return [{
          guidance: violation.evidence?.reason?.trim() || "표시된 근거를 확인해 주세요.",
          id: `violation-history-${violation.violationEvidenceHistoryId}-${locationIndex}`,
          location: locationSource(location),
          reason: violation.evidence?.reason?.trim() || violation.violationTypeDescription,
          severity: signalTone(violation.currentStatus) === "warning" ? "warning" : "critical",
          source: "자동 감지" as const,
<<<<<<< HEAD
          state: annotationState(violation.currentStatus, showHistoricalEvidence),
=======
          state: !showHistoricalEvidence && violation.currentStatus != null
            && violation.currentStatus !== "PENDING"
            ? "resolved" as const
            : "active" as const,
>>>>>>> 232c7c06dd1c7cd0670a298ff0c7cdfc22d9e5d6
          target: useTextTarget
            ? {
                endIndex: offset + (location.endIndex ?? 0),
                kind: "text" as const,
                occurrence: 1,
                quote,
                startIndex: offset + (location.startIndex ?? 0),
              }
            : sourceMedia.mediaType === "TEXT"
              ? {
                  kind: "text-start" as const,
                  quote,
                }
            : {
                ...mediaBoxFromLocation(location),
                kind: "media" as const,
                ...(visualIndex >= 0 ? { mediaIndex: visualIndex } : {}),
                quote,
                ...(timeRange ? { timeRange } : {}),
              },
          title: violation.violationTypeDescription,
        }];
      });
<<<<<<< HEAD

    if (needsDisclosureTextStartPin(violation)) {
      const textMedia = media.find((item) => item.mediaType === "TEXT");
      if (textMedia) {
        locationAnnotations.unshift({
          guidance: violation.evidence?.reason?.trim() || "본문 첫 줄의 광고·수수료 안내 문구를 확인해 주세요.",
          id: `violation-history-${violation.violationEvidenceHistoryId}-disclosure-text-start`,
          location: "게시물 본문(TEXT)",
          reason: violation.evidence?.reason?.trim() || violation.violationTypeDescription,
          severity: signalTone(violation.currentStatus) === "warning" ? "warning" : "critical",
          source: "자동 감지" as const,
          state: annotationState(violation.currentStatus, showHistoricalEvidence),
          target: {
            kind: "text-start" as const,
            quote: violation.violationTypeDescription,
          },
          title: violation.violationTypeDescription,
        });
      }
    }

    return locationAnnotations;
=======
>>>>>>> 232c7c06dd1c7cd0670a298ff0c7cdfc22d9e5d6
  });
}

function mediaTextLayout(media: readonly ContentVersionMedia[]) {
  const offsets = new Map<number, number>();
  const textById = new Map<number, string>();
  let text = "";

  media.forEach((item) => {
    const value = item.text?.trim();
    if (!value) return;
    textById.set(item.contentMediaId, value);
    if (item.mediaType !== "TEXT") return;
    if (text) text += "\n";
    offsets.set(item.contentMediaId, text.length);
    text += value;
  });
  return { offsets, text, textById };
}

function extractsFromMedia(media: readonly ContentVersionMedia[]): ContentInspectionExtract[] {
  return media
    .filter((item) => item.mediaType !== "TEXT")
    .flatMap((item, index) => {
      const text = item.text?.trim();
      if (!text) return [];
      return [{
        location: `${item.mediaType === "VIDEO" ? "동영상" : "이미지"} ${index + 1}`,
        text,
        type: item.mediaType === "VIDEO" ? "STT" as const : "OCR" as const,
      }];
    });
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
          label: version.creationReason === "EXTRACTION_CHANGE"
            ? `버전 ${version.versionNo} 추출 정책 변경`
            : `버전 ${version.versionNo} 수집`,
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
  const media = [...(content.media ?? [])].sort((left, right) => left.sequenceNo - right.sequenceNo);
  const status = inspectionStatus(content.inspectionStatus);
  const aiStatus = analysisStatus(content.inspectionStatus);
  const contentFormat = CONTENT_FORMATS[content.contentType];
  const youtubeVideoId = content.snsCode === "YOUTUBE"
    ? media.find(({ mediaType }) => mediaType === "VIDEO")?.snsMediaId ?? content.snsContentId
    : undefined;

  return {
    accountId: content.accountId,
    aiStatus,
    aiSummary: aiStatus === "ready" ? "분석 완료" : "분석 대기",
    author: content.selectorsNickname?.trim() || content.accountId,
    availableActions: [],
    changeItems: [],
    cohort: content.generationName,
    contentFormat,
    contentTitle: texts[0] ?? content.snsContentId,
    contentUrl: content.contentUrl,
    contentVersionId: content.latestVersionId,
    currentSnapshot: {
      capturedAt: content.latestVersionStoredAt,
      label: contentFormat,
      mediaCount: media.length,
      mediaKinds: media.map(({ mediaType }) => mediaType === "VIDEO" ? "동영상" : "이미지"),
      mediaThumbnailUrls: media.map(({ thumbnailUrl }) => thumbnailUrl ?? ""),
      mediaUrls: media.map(({ mediaUrl }) => mediaUrl ?? ""),
      text: texts.join("\n"),
      urls: content.contentUrl ? [content.contentUrl] : [],
      youtubeVideoId,
    },
    detectedIssues: [],
    id: String(content.contentId),
    inspectionDecision: content.inspectionStatus === "APPROVED"
      || content.inspectionStatus === "REJECTED"
      ? content.inspectionStatus
      : null,
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
  const media = [...(selectedVersion.media ?? [])]
    .sort((left, right) => left.sequenceNo - right.sequenceNo);
  const textLayout = mediaTextLayout(media);
  const text = textLayout.text || base?.currentSnapshot.text || "";
  const visualMedia = media.filter((item) => item.mediaType !== "TEXT");
  const violations = selectedVersion.violations ?? [];
  const contentReport = selectedVersion.contentReport;
  const analysisReady = Boolean(contentReport)
    || violations.length > 0
    || selectedVersion.inspectionStatus === "COMPLETED";
  const activeViolations = violations.filter(
    (violation) => !CLOSED_VIOLATION_STATUSES.has(violation.currentStatus),
  );
  const contentFormat = CONTENT_FORMATS[detail.contentType];
  const status = selectedVersion.inspectionDecision
    ? inspectionStatus(selectedVersion.inspectionDecision)
    : base?.inspectionStatus ?? "검수 대기";
  const latestVersionNo = Math.max(
    selectedVersion.versionNo,
    base?.latestVersionNo ?? 0,
    ...(detail.versions ?? []).map((version) => version.versionNo),
  );
  const showHistoricalEvidence = selectedVersion.versionNo < latestVersionNo;

  return {
    accountId: base?.accountId,
    aiStatus: analysisReady ? "ready" : "pending",
    aiSummary: contentReport?.analysis?.overview?.summary?.trim()
      || contentReport?.summary?.trim()
      || (analysisReady ? "분석 완료" : "분석 대기"),
    author: base?.author || detail.snsContentId,
    availableActions: base?.availableActions ?? [],
    changeItems: base?.changeItems ?? [],
    cohort: base?.cohort ?? "",
    contentFormat: base?.contentFormat ?? contentFormat,
    contentTitle: media.find((item) => item.mediaType === "TEXT")?.text?.trim()
      || base?.contentTitle
      || detail.snsContentId,
    contentUrl: detail.contentUrl || base?.contentUrl,
    contentVersionId: selectedVersion.contentVersionId,
    currentSnapshot: {
      capturedAt: selectedVersion.createdAt,
      label: base?.currentSnapshot.label ?? contentFormat,
      contentMediaIds: visualMedia.map((item) => item.contentMediaId),
      mediaCount: visualMedia.length,
      mediaKinds: visualMedia.map((item) => item.mediaType === "VIDEO" ? "동영상" : "이미지"),
      mediaUrls: visualMedia.map((item) => item.mediaUrl ?? ""),
      text,
      urls: base?.currentSnapshot.urls
        ?? (detail.contentUrl ? [detail.contentUrl] : []),
      youtubeVideoId: detail.snsCode === "YOUTUBE"
        ? visualMedia.find((item) => item.mediaType === "VIDEO")?.snsMediaId
          ?? base?.currentSnapshot.youtubeVideoId
          ?? detail.snsContentId
        : undefined,
      annotations: annotationsFromViolations(
        violations, media, textLayout.offsets, showHistoricalEvidence,
      ),
    },
    detectedIssues: activeViolations.map((violation) => violation.violationTypeDescription),
    id: String(detail.contentId),
    inspectionDecision: selectedVersion.inspectionDecision ?? null,
    inspectionStatus: status,
    inspectionType: latestVersionNo > 1 ? "EDITED" : "NEW",
    latestVersionNo,
    previousSnapshot: base?.previousSnapshot ?? null,
    processingState: processingState(status),
    profileImageUrl: base?.profileImageUrl,
    report: {
      analysis: contentReport?.analysis ?? null,
      extracts: extractsFromMedia(media),
      flow: contentReport?.analysis?.overview?.flow ?? contentReport?.flow ?? null,
      generatedAt: selectedVersion.inspectedAt,
      history: historyFromVersions(detail.storedAt, detail.versions ?? []),
      overallAssessment: contentReport?.analysis?.overview?.overallAssessment
        ?? contentReport?.overallAssessment ?? null,
      purpose: contentReport?.analysis?.overview?.purpose
        ?? contentReport?.purpose ?? null,
      signals: signalsFromViolations(violations, textLayout.textById),
    },
    selectorsId: detail.selectorsId,
    sourcePlatform: detail.snsCode === "YOUTUBE" ? "YouTube" : "Instagram",
    submittedAt: detail.storedAt,
    versions: detail.versions ?? [],
    violationType: activeViolations[0]?.violationTypeDescription ?? null,
  };
}
