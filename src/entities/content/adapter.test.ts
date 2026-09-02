import * as contentEntity from ".";

type AdaptContentInspection = (content: Record<string, unknown>) => {
  [key: string]: unknown;
  currentSnapshot: {
    capturedAt: string;
    mediaKinds: string[];
    mediaUrls: string[];
    text: string;
    youtubeVideoId?: string;
  };
  report: {
    extracts: unknown[];
    generatedAt: string | null;
    history: unknown[];
    signals: unknown[];
  };
};

type AdaptContentInspectionDetail = (
  detail: Record<string, unknown>,
  base?: Record<string, unknown>,
) => {
  [key: string]: unknown;
  aiStatus: "ready" | "pending";
  currentSnapshot: {
    annotations?: unknown[];
    capturedAt: string;
    mediaUrls: string[];
    text: string;
  };
  report: {
    extracts: unknown[];
    flow?: string | null;
    generatedAt: string | null;
    history: Array<{ label: string }>;
    overallAssessment?: string | null;
    purpose?: string | null;
    signals: unknown[];
  };
};

test("adapts collected backend content without inventing analysis or violation results", () => {
  const adaptContentInspection = (
    contentEntity as unknown as { adaptContentInspection?: AdaptContentInspection }
  ).adaptContentInspection;

  expect(adaptContentInspection).toBeTypeOf("function");
  if (!adaptContentInspection) return;

  const inspection = adaptContentInspection({
    accountId: "@actual-channel",
    contentId: 42,
    contentType: "LONG_FORM",
    contentUrl: "https://youtube.com/watch?v=video-42",
    generationName: "4기",
    inspectedAt: null,
    inspectionStatus: null,
    latestVersionId: 420,
    latestVersionNo: 2,
    latestVersionStoredAt: "2026-08-18T10:05:00",
    media: [
      {
        mediaType: "IMAGE",
        mediaUrl: "https://cdn.example.com/image.jpg",
        sequenceNo: 3,
        snsMediaId: "image-42",
        thumbnailUrl: "https://cdn.example.com/image-thumbnail.jpg",
      },
      {
        mediaType: "VIDEO",
        mediaUrl: null,
        sequenceNo: 2,
        snsMediaId: "video-42",
      },
    ],
    profileImageUrl: "https://cdn.example.com/profile.jpg",
    selectorsId: 7,
    selectorsNickname: "실제 셀렉터",
    snsCode: "YOUTUBE",
    snsContentId: "video-42",
    storedAt: "2026-08-18T10:00:00",
    texts: ["", "YouTube 제목", "영상 본문"],
  });

  expect(inspection).toMatchObject({
    accountId: "@actual-channel",
    aiStatus: "pending",
    author: "실제 셀렉터",
    cohort: "4기",
    contentFormat: "유튜브 롱폼",
    contentTitle: "YouTube 제목",
    contentUrl: "https://youtube.com/watch?v=video-42",
    detectedIssues: [],
    id: "42",
    inspectionStatus: "검수 대기",
    inspectionType: "EDITED",
    latestVersionNo: 2,
    previousSnapshot: null,
    processingState: "미처리",
    profileImageUrl: "https://cdn.example.com/profile.jpg",
    selectorsId: 7,
    submittedAt: "2026-08-18T10:00:00",
    violationType: null,
  });
  expect(inspection.currentSnapshot).toMatchObject({
    capturedAt: "2026-08-18T10:05:00",
    mediaKinds: ["동영상", "이미지"],
    mediaThumbnailUrls: ["", "https://cdn.example.com/image-thumbnail.jpg"],
    mediaUrls: ["", "https://cdn.example.com/image.jpg"],
    text: "YouTube 제목\n영상 본문",
    youtubeVideoId: "video-42",
  });
  expect(inspection.report).toEqual({
    extracts: [],
    generatedAt: null,
    history: [{
      actor: "수집 시스템",
      at: "2026-08-18T10:00:00",
      label: "콘텐츠 수집",
    }],
    signals: [],
  });
});

test("adapts latest-version detail into report, text, and active violations", () => {
  const adaptContentInspectionDetail = (
    contentEntity as unknown as { adaptContentInspectionDetail?: AdaptContentInspectionDetail }
  ).adaptContentInspectionDetail;

  expect(adaptContentInspectionDetail).toBeTypeOf("function");
  if (!adaptContentInspectionDetail) return;

  const inspection = adaptContentInspectionDetail({
    contentId: 42,
    contentType: "FEED",
    contentUrl: "https://instagram.com/p/actual-42",
    selectedVersion: {
      contentReport: {
        contentReportId: 8,
        flow: "본문 후 상품 링크를 안내합니다.",
        overallAssessment: "과장 표현 수정 후 재검수가 필요합니다.",
        purpose: "상품 소개",
        summary: "광고 표기는 확인됐고 최저가 단정 표현이 있습니다.",
      },
      contentVersionId: 420,
      creationReason: "SOURCE_CHANGE",
      createdAt: "2026-08-18T10:05:00",
      inspectedAt: "2026-08-18T10:06:00",
      inspectionStatus: "COMPLETED",
      media: [
        {
          contentMediaId: 4201,
          mediaType: "TEXT",
          mediaUrl: null,
          sequenceNo: 0,
          snsMediaId: null,
          text: "가을 패딩",
        },
        {
          contentMediaId: 4202,
          mediaType: "TEXT",
          mediaUrl: null,
          sequenceNo: 1,
          snsMediaId: null,
          text: "지금 가장 저렴한 가격",
        },
        {
          contentMediaId: 4203,
          mediaType: "IMAGE",
          mediaUrl: "https://cdn.example.com/image.jpg",
          sequenceNo: 2,
          snsMediaId: "image-42",
          text: null,
        },
        {
          contentMediaId: 4204,
          mediaType: "VIDEO",
          mediaUrl: "https://cdn.example.com/video.mp4",
          sequenceNo: 3,
          snsMediaId: "video-42",
          text: "영상에서 가장 저렴하다고 안내합니다.",
        },
      ],
      violations: [{
        evidence: {
          confidence: 0.91,
          locations: [{
            bbox: null,
            contentMediaId: 4202,
            endIndex: "지금 가장 저렴한 가격".indexOf("가장 저렴한") + "가장 저렴한".length,
            endTime: null,
            excerpt: "가장 저렴한",
            mediaType: "TEXT",
            startIndex: "지금 가장 저렴한 가격".indexOf("가장 저렴한"),
            startTime: null,
          }, {
            bbox: null,
            contentMediaId: 4202,
            endIndex: 4,
            endTime: null,
            excerpt: "원문에 없는 문구",
            mediaType: "TEXT",
            startIndex: 0,
            startTime: null,
          }],
          reason: "비교 근거 없이 최저가를 단정했습니다.",
          source: "AI",
        },
        currentStatus: "PENDING",
        detectedAt: "2026-08-18T10:06:00",
        inspectionPolicyId: 7,
        violationEvidenceHistoryId: 99,
        violationItemId: 9,
        violationType: "FALSE_EXAGGERATED_CLAIM",
        violationTypeDescription: "허위·과장 표현",
      }],
      versionNo: 2,
    },
    selectorsId: 7,
    snsCode: "INSTAGRAM",
    snsContentId: "actual-42",
    storedAt: "2026-08-18T10:00:00",
    versions: [
      {
        contentVersionId: 410,
        createdAt: "2026-08-17T09:00:00",
        inspectedAt: "2026-08-17T09:10:00",
        inspectionStatus: "COMPLETED",
        versionNo: 1,
      },
      {
        contentVersionId: 420,
        createdAt: "2026-08-18T10:05:00",
        inspectedAt: "2026-08-18T10:06:00",
        inspectionStatus: "COMPLETED",
        versionNo: 2,
      },
    ],
  }, {
    accountId: "@actual-channel",
    author: "실제 셀렉터",
    cohort: "4기",
    currentSnapshot: {
      capturedAt: "2026-08-18T10:05:00",
      label: "인스타 피드",
      mediaCount: 1,
      mediaKinds: ["이미지"],
      mediaUrls: ["https://cdn.example.com/image.jpg"],
      text: "목록 본문",
      urls: ["https://instagram.com/p/actual-42"],
    },
    profileImageUrl: "https://cdn.example.com/profile.jpg",
    inspectionStatus: "검수 대기",
  });

  expect(inspection).toMatchObject({
    aiStatus: "ready",
    aiSummary: "광고 표기는 확인됐고 최저가 단정 표현이 있습니다.",
    author: "실제 셀렉터",
    contentTitle: "가을 패딩",
    contentVersionId: 420,
    detectedIssues: ["허위·과장 표현"],
    id: "42",
    inspectionType: "EDITED",
    latestVersionNo: 2,
    profileImageUrl: "https://cdn.example.com/profile.jpg",
    violationType: "허위·과장 표현",
  });
  expect(inspection.currentSnapshot).toMatchObject({
    capturedAt: "2026-08-18T10:05:00",
    mediaUrls: ["https://cdn.example.com/image.jpg", "https://cdn.example.com/video.mp4"],
    text: "가을 패딩\n지금 가장 저렴한 가격",
  });
  expect(inspection.currentSnapshot.annotations).toEqual([
    expect.objectContaining({
      state: "active",
      target: expect.objectContaining({
        kind: "text",
        quote: "가장 저렴한",
        startIndex: "가을 패딩\n지금 가장 저렴한 가격".indexOf("가장 저렴한"),
      }),
      title: "허위·과장 표현",
    }),
    expect.objectContaining({
      state: "active",
      target: {
        kind: "text-start",
        quote: "원문에 없는 문구",
      },
      title: "허위·과장 표현",
    }),
  ]);
  expect(inspection.report).toMatchObject({
    extracts: [{
      location: "동영상 2",
      text: "영상에서 가장 저렴하다고 안내합니다.",
      type: "STT",
    }],
    flow: "본문 후 상품 링크를 안내합니다.",
    generatedAt: "2026-08-18T10:06:00",
    overallAssessment: "과장 표현 수정 후 재검수가 필요합니다.",
    purpose: "상품 소개",
    signals: [{
      detail: "비교 근거 없이 최저가를 단정했습니다.",
      evidence: "가장 저렴한",
      source: "게시물 본문(TEXT)",
      title: "허위·과장 표현",
      tone: "warning",
      violationType: "FALSE_EXAGGERATED_CLAIM",
    }],
  });
  expect(inspection.report.history.map(({ label }) => label)).toEqual([
    "콘텐츠 수집",
    "자동 검수 완료",
    "버전 2 수집",
    "자동 검수 완료",
  ]);
});

test("keeps analysis pending when the latest version has no report yet", () => {
  const adaptContentInspectionDetail = (
    contentEntity as unknown as { adaptContentInspectionDetail?: AdaptContentInspectionDetail }
  ).adaptContentInspectionDetail;

  expect(adaptContentInspectionDetail).toBeTypeOf("function");
  if (!adaptContentInspectionDetail) return;

  const inspection = adaptContentInspectionDetail({
    contentId: 42,
    contentType: "FEED",
    contentUrl: "https://instagram.com/p/actual-42",
    selectedVersion: {
      contentReport: null,
      contentVersionId: 420,
      creationReason: "INITIAL",
      createdAt: "2026-08-18T10:05:00",
      inspectedAt: null,
      inspectionStatus: "PENDING",
      media: [{
        contentMediaId: 4201,
        mediaType: "TEXT",
        mediaUrl: null,
        sequenceNo: 0,
        snsMediaId: null,
        text: "대기 본문",
      }],
      violations: [],
      versionNo: 1,
    },
    selectorsId: 7,
    snsCode: "INSTAGRAM",
    snsContentId: "actual-42",
    storedAt: "2026-08-18T10:00:00",
    versions: [{
      contentVersionId: 420,
      createdAt: "2026-08-18T10:05:00",
      inspectedAt: null,
      inspectionStatus: "PENDING",
      versionNo: 1,
    }],
  });

  expect(inspection.aiStatus).toBe("pending");
  expect(inspection.report).toMatchObject({
    extracts: [],
    generatedAt: null,
    signals: [],
  });
});

test("synthesizes a text-start pin when absence violations have no locations", () => {
  const adaptContentInspectionDetail = (
    contentEntity as unknown as { adaptContentInspectionDetail?: AdaptContentInspectionDetail }
  ).adaptContentInspectionDetail;
  expect(adaptContentInspectionDetail).toBeTypeOf("function");
  if (!adaptContentInspectionDetail) return;

  const inspection = adaptContentInspectionDetail({
    contentId: 42,
    contentType: "FEED",
    contentUrl: "https://instagram.com/p/actual-42",
    selectedVersion: {
      contentReport: null,
      contentVersionId: 420,
      creationReason: "INITIAL",
      createdAt: "2026-08-18T10:05:00",
      inspectedAt: "2026-08-18T10:06:00",
      inspectionStatus: "COMPLETED",
      media: [{
        contentMediaId: 4201,
        mediaType: "TEXT",
        mediaUrl: null,
        sequenceNo: 0,
        snsMediaId: null,
        text: "종이컵이 8개",
      }],
      violations: [{
        evidence: {
          confidence: 1,
          locations: [],
          reason: "콘텐츠에서 셀렉터스 제휴 링크를 확인할 수 없습니다.",
          source: "RULE",
        },
        currentStatus: "PENDING",
        detectedAt: "2026-08-18T10:06:00",
        inspectionPolicyId: 7,
        violationEvidenceHistoryId: 11,
        violationItemId: 21,
        violationType: "AFFILIATE_LINK_INVALID",
        violationTypeDescription: "제휴 링크 확인 필요",
      }, {
        evidence: {
          confidence: 1,
          locations: [],
          reason: "제목 또는 본문 첫 줄의 광고·수수료 안내 문구 및 영상 내부 광고 안내 문구를 확인할 수 없습니다.",
          source: "RULE",
        },
        currentStatus: "PENDING",
        detectedAt: "2026-08-18T10:06:00",
        inspectionPolicyId: 7,
        violationEvidenceHistoryId: 12,
        violationItemId: 22,
        violationType: "AD_DISCLOSURE_INVALID",
        violationTypeDescription: "광고·수수료 안내 문구 확인 필요",
      }],
      versionNo: 1,
    },
    selectorsId: 7,
    snsCode: "INSTAGRAM",
    snsContentId: "actual-42",
    storedAt: "2026-08-18T10:00:00",
    versions: [],
  });

  expect(inspection.currentSnapshot.annotations).toEqual([
    expect.objectContaining({
      target: { kind: "text-start", quote: "제휴 링크 확인 필요" },
      title: "제휴 링크 확인 필요",
    }),
    expect.objectContaining({
      target: { kind: "text-start", quote: "광고·수수료 안내 문구 확인 필요" },
      title: "광고·수수료 안내 문구 확인 필요",
    }),
  ]);
  expect(inspection.report.signals).toEqual([
    expect.objectContaining({
      locationAvailable: true,
      source: "게시물 본문(TEXT)",
      violationType: "AFFILIATE_LINK_INVALID",
    }),
    expect.objectContaining({
      locationAvailable: true,
      source: "게시물 본문(TEXT)",
      violationType: "AD_DISCLOSURE_INVALID",
    }),
  ]);
});

test("keeps a confirmed ad-disclosure pin at the body start when evidence only points to video", () => {
  const adaptContentInspectionDetail = (
    contentEntity as unknown as { adaptContentInspectionDetail?: AdaptContentInspectionDetail }
  ).adaptContentInspectionDetail;
  expect(adaptContentInspectionDetail).toBeTypeOf("function");
  if (!adaptContentInspectionDetail) return;

  const inspection = adaptContentInspectionDetail({
    contentId: 43,
    contentType: "LONG_FORM",
    contentUrl: "https://youtube.com/watch?v=abcdefghijk",
    selectedVersion: {
      contentReport: null,
      contentVersionId: 430,
      creationReason: "INITIAL",
      createdAt: "2026-09-02T10:05:00",
      inspectedAt: "2026-09-02T10:06:00",
      inspectionStatus: "COMPLETED",
      media: [{
        contentMediaId: 4301,
        mediaType: "TEXT",
        mediaUrl: null,
        sequenceNo: 0,
        snsMediaId: null,
        text: "광고 안내가 없는 게시물 본문입니다.",
      }, {
        contentMediaId: 4302,
        mediaType: "VIDEO",
        mediaUrl: "https://youtube.com/watch?v=abcdefghijk",
        sequenceNo: 1,
        snsMediaId: "abcdefghijk",
        text: null,
      }],
      violations: [{
        evidence: {
          confidence: 1,
          locations: [{
            bbox: null,
            contentMediaId: 4302,
            endIndex: null,
            endTime: 5,
            excerpt: null,
            mediaType: "VIDEO",
            startIndex: null,
            startTime: 0,
          }],
          reason: "본문 첫 줄과 영상에서 광고·수수료 안내 문구를 확인할 수 없습니다.",
          source: "RULE",
        },
        currentStatus: "VIOLATION_CONFIRMED",
        detectedAt: "2026-09-02T10:06:00",
        inspectionPolicyId: 7,
        violationEvidenceHistoryId: 13,
        violationItemId: 23,
        violationType: "AD_DISCLOSURE_INVALID",
        violationTypeDescription: "광고·수수료 안내 문구 확인 필요",
      }],
      versionNo: 1,
    },
    selectorsId: 7,
    snsCode: "YOUTUBE",
    snsContentId: "abcdefghijk",
    storedAt: "2026-09-02T10:00:00",
    versions: [],
  });

  expect(inspection.currentSnapshot.annotations).toEqual(expect.arrayContaining([
    expect.objectContaining({
      location: "게시물 본문(TEXT)",
      target: {
        kind: "text-start",
        quote: "광고·수수료 안내 문구 확인 필요",
      },
      title: "광고·수수료 안내 문구 확인 필요",
    }),
    expect.objectContaining({
      target: expect.objectContaining({ kind: "media", mediaIndex: 0 }),
      title: "광고·수수료 안내 문구 확인 필요",
    }),
  ]));
});

test("maps approved and rejected decisions to separate inspection statuses", () => {
  const adaptContentInspection = (
    contentEntity as unknown as { adaptContentInspection?: AdaptContentInspection }
  ).adaptContentInspection;
  const adaptContentInspectionDetail = (
    contentEntity as unknown as { adaptContentInspectionDetail?: AdaptContentInspectionDetail }
  ).adaptContentInspectionDetail;
  expect(adaptContentInspection).toBeTypeOf("function");
  expect(adaptContentInspectionDetail).toBeTypeOf("function");
  if (!adaptContentInspection || !adaptContentInspectionDetail) return;

  expect(adaptContentInspection({
    accountId: "@actual-channel",
    contentId: 42,
    contentType: "FEED",
    contentUrl: "https://instagram.com/p/actual-42",
    generationName: "4기",
    inspectedAt: "2026-08-18T10:06:00",
    inspectionStatus: "REJECTED",
    latestVersionId: 420,
    latestVersionNo: 1,
    latestVersionStoredAt: "2026-08-18T10:05:00",
    media: [],
    profileImageUrl: null,
    selectorsId: 7,
    selectorsNickname: "실제 셀렉터",
    snsCode: "INSTAGRAM",
    snsContentId: "actual-42",
    storedAt: "2026-08-18T10:00:00",
    texts: ["반려된 콘텐츠"],
  })).toMatchObject({
    aiStatus: "ready",
    inspectionStatus: "위반",
    processingState: "처리 완료",
  });

  expect(adaptContentInspectionDetail({
    contentId: 42,
    contentType: "FEED",
    contentUrl: "https://instagram.com/p/actual-42",
    selectedVersion: {
      contentReport: null,
      contentVersionId: 420,
      creationReason: "INITIAL",
      createdAt: "2026-08-18T10:05:00",
      inspectedAt: "2026-08-18T10:06:00",
      inspectionDecision: "APPROVED",
      inspectionStatus: "COMPLETED",
      media: [],
      violations: [],
      versionNo: 1,
    },
    selectorsId: 7,
    snsCode: "INSTAGRAM",
    snsContentId: "actual-42",
    storedAt: "2026-08-18T10:00:00",
    versions: [],
  })).toMatchObject({
    inspectionDecision: "APPROVED",
    inspectionStatus: "승인",
    processingState: "처리 완료",
  });
});
