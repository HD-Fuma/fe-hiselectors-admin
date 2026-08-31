import {
  adaptContentPerformance,
  getContentPerformance,
  getContentPerformanceSummary,
  type ContentPerformanceApiItem,
} from ".";

const API_ITEM: ContentPerformanceApiItem = {
  accountId: "creator_account",
  commentCount: 3,
  contentId: 10,
  contentType: "SHORT_FORM",
  contentUrl: "https://instagram.com/reel/10",
  followerCount: 12000,
  generationName: "1기",
  likeCount: 30,
  media: [{
    mediaType: "VIDEO",
    mediaUrl: "https://cdn.example.com/10.mp4",
    sequenceNo: 0,
    snsMediaId: "10",
    thumbnailUrl: "https://cdn.example.com/10.jpg",
  }],
  profileImageUrl: "https://cdn.example.com/profile.jpg",
  publishedAt: "2026-08-18T09:00:00",
  selectorsId: 11,
  selectorsNickname: "셀렉터",
  snsCode: "INSTAGRAM",
  snsContentId: "10",
  texts: ["콘텐츠 제목\n두 번째 줄", "본문"],
  trend: [{ commentCount: 3, likeCount: 30, recordedAt: "2026-08-19T10:00:00", viewCount: 300 }],
  viewCount: 300,
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("selectors-auth", JSON.stringify({
    accessToken: "admin.jwt",
    tokenType: "Bearer",
  }));
});

afterEach(() => vi.unstubAllGlobals());

test("loads every content performance page with admin authentication", async () => {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const page = Number(new URL(String(input)).searchParams.get("page"));
    return Promise.resolve(new Response(JSON.stringify({
      code: "OK",
      data: { content: [{ ...API_ITEM, contentId: 10 + page }], totalPages: 2 },
      message: null,
      success: true,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
  });
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();

  const items = await getContentPerformance(controller.signal);

  expect(items.map((item) => item.contentId)).toEqual([10, 11]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  fetchMock.mock.calls.forEach(([input, init], page) => {
    const url = new URL(String(input));
    expect(url.pathname).toBe("/api/admin/content-performance");
    expect(url.searchParams.get("page")).toBe(String(page));
    expect(url.searchParams.get("size")).toBe("100");
    expect(new Headers((init as RequestInit).headers).get("Authorization"))
      .toBe("Bearer admin.jwt");
    expect((init as RequestInit).signal).toBe(controller.signal);
  });
});

test("adapts API metrics, media, author and trend for the dashboard", () => {
  const content = adaptContentPerformance(API_ITEM);

  expect(content).toMatchObject({
    authorName: "셀렉터",
    cohort: "1기",
    comments: 3,
    contentFormat: "인스타 릴스",
    followers: 12000,
    likes: 30,
    mediaType: "VIDEO",
    mediaUrl: "https://cdn.example.com/10.mp4",
    publishedAt: "2026-08-18",
    thumbnailUrl: "https://cdn.example.com/10.jpg",
    title: "콘텐츠 제목",
    views: 300,
  });
  expect(content.viewsTrend).toEqual([{ recordedAt: "2026-08-19", views: 300 }]);
  expect(content.reactionTrend).toEqual([
    { comments: 3, likes: 30, recordedAt: "2026-08-19" },
  ]);
});

test("uses the YouTube media id when the API has no thumbnail URL", () => {
  const content = adaptContentPerformance({
    ...API_ITEM,
    contentType: "LONG_FORM",
    media: [{ mediaType: "VIDEO", mediaUrl: null, sequenceNo: 0, snsMediaId: "youtube-video-10" }],
    snsCode: "YOUTUBE",
    snsContentId: "youtube-content-10",
  });

  expect(content.thumbnailUrl)
    .toBe("https://i.ytimg.com/vi/youtube-video-10/hqdefault.jpg");
  expect(content.mediaUrl).toBeNull();
});

test("uses the image thumbnail URL and falls back to its media URL", () => {
  const thumbnailContent = adaptContentPerformance({
    ...API_ITEM,
    contentType: "FEED",
    media: [{
      mediaType: "IMAGE",
      mediaUrl: "https://cdn.example.com/image-original.jpg",
      sequenceNo: 0,
      snsMediaId: "image-10",
      thumbnailUrl: "https://cdn.example.com/image-thumbnail.jpg",
    }],
  });
  const legacyContent = adaptContentPerformance({
    ...API_ITEM,
    contentType: "FEED",
    media: [{
      mediaType: "IMAGE",
      mediaUrl: "https://cdn.example.com/image-original.jpg",
      sequenceNo: 0,
      snsMediaId: "image-10",
      thumbnailUrl: null,
    }],
  });

  expect(thumbnailContent).toMatchObject({
    mediaType: "IMAGE",
    mediaUrl: null,
    thumbnailUrl: "https://cdn.example.com/image-thumbnail.jpg",
  });
  expect(legacyContent.thumbnailUrl).toBe("https://cdn.example.com/image-original.jpg");
});

test("loads upload and content format summary", async () => {
  const summary = {
    currentGenerationContentCount: 8,
    currentGenerationName: "1기",
    formats: [{ contentType: "SHORT_FORM", count: 5 }],
    previousGenerationContentCount: 4,
    previousGenerationName: "이전 기수",
    totalContentCount: 12,
  };
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    code: "OK",
    data: summary,
    message: null,
    success: true,
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(getContentPerformanceSummary()).resolves.toEqual(summary);
  const [input, init] = fetchMock.mock.calls[0];
  expect(new URL(String(input)).pathname).toBe("/api/admin/content-performance/summary");
  expect((init as RequestInit).headers).toBeInstanceOf(Headers);
});
