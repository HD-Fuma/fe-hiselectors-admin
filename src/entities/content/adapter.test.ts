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
