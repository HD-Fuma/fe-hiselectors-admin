import { adminFetch } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";
import type { ContentInfluence, ContentPerformanceFormat } from "./model/fixtures";

const AUTH_STORAGE_KEY = "selectors-auth";

interface ApiResult<T> {
  data: T | null;
  message: string | null;
  success: boolean;
}

interface SpringPage<T> {
  content: T[];
  totalPages: number;
}

interface ContentPerformanceMedia {
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string | null;
  sequenceNo: number;
  snsMediaId: string | null;
}

interface ContentPerformanceTrendPoint {
  commentCount: number;
  likeCount: number;
  recordedAt: string;
  viewCount: number;
}

export interface ContentPerformanceApiItem {
  accountId: string;
  commentCount: number;
  contentId: number;
  contentType: "SHORT_FORM" | "LONG_FORM" | "SHORTS" | "FEED";
  contentUrl: string;
  followerCount: number;
  generationName: string;
  likeCount: number;
  media: ContentPerformanceMedia[];
  profileImageUrl: string | null;
  publishedAt: string;
  selectorsId: number;
  selectorsNickname: string;
  snsCode: "INSTAGRAM" | "YOUTUBE";
  snsContentId: string;
  texts: string[];
  trend: ContentPerformanceTrendPoint[];
  viewCount: number;
}

export interface ContentPerformanceSummaryApi {
  currentGenerationContentCount: number;
  currentGenerationName: string;
  formats: Array<{
    contentType: ContentPerformanceApiItem["contentType"];
    count: number;
  }>;
  previousGenerationContentCount: number;
  previousGenerationName: string | null;
  totalContentCount: number;
}

const CONTENT_FORMAT: Record<ContentPerformanceApiItem["contentType"], ContentPerformanceFormat> = {
  FEED: "인스타 피드",
  LONG_FORM: "유튜브 롱폼",
  SHORTS: "유튜브 쇼츠",
  SHORT_FORM: "인스타 릴스",
};

function authorizationHeader() {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedSession) return null;

  try {
    const session = JSON.parse(storedSession) as { accessToken?: unknown; tokenType?: unknown };
    if (typeof session.accessToken !== "string" || !session.accessToken) return null;
    const tokenType = typeof session.tokenType === "string" && session.tokenType
      ? session.tokenType
      : "Bearer";
    return `${tokenType} ${session.accessToken}`;
  } catch {
    return null;
  }
}

async function getContentPerformancePage(page: number, signal?: AbortSignal) {
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);
  const params = new URLSearchParams({ page: String(page), size: "100" });
  const response = await adminFetch(
    `${API_BASE_URL}/api/admin/content-performance?${params.toString()}`,
    { headers, signal },
  );
  let result: ApiResult<SpringPage<ContentPerformanceApiItem>>;
  try {
    result = await response.json() as ApiResult<SpringPage<ContentPerformanceApiItem>>;
  } catch {
    throw new Error("콘텐츠 성과 목록 조회에 실패했습니다.");
  }
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || "콘텐츠 성과 목록 조회에 실패했습니다.");
  }
  return result.data;
}

export async function getContentPerformance(signal?: AbortSignal) {
  const items: ContentPerformanceApiItem[] = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages) {
    const result = await getContentPerformancePage(page, signal);
    items.push(...result.content);
    totalPages = result.totalPages;
    page += 1;
  }
  return items;
}

export async function getContentPerformanceSummary(signal?: AbortSignal) {
  const headers = new Headers();
  const authorization = authorizationHeader();
  if (authorization) headers.set("Authorization", authorization);
  const response = await adminFetch(`${API_BASE_URL}/api/admin/content-performance/summary`, {
    headers,
    signal,
  });
  let result: ApiResult<ContentPerformanceSummaryApi>;
  try {
    result = await response.json() as ApiResult<ContentPerformanceSummaryApi>;
  } catch {
    throw new Error("콘텐츠 업로드 요약 조회에 실패했습니다.");
  }
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || "콘텐츠 업로드 요약 조회에 실패했습니다.");
  }
  return result.data;
}

function contentTitle(item: ContentPerformanceApiItem) {
  const firstLine = item.texts.find((text) => text.trim())?.trim().split(/\r?\n/)[0];
  return firstLine || `${item.selectorsNickname} 콘텐츠`;
}

export function adaptContentPerformance(item: ContentPerformanceApiItem): ContentInfluence {
  const sortedMedia = [...item.media].sort((left, right) => left.sequenceNo - right.sequenceNo);
  return {
    accountId: item.accountId,
    authorName: item.selectorsNickname,
    campaignId: "",
    caption: item.texts.join("\n"),
    clicks: 0,
    cohort: item.generationName,
    comments: item.commentCount,
    contentFormat: CONTENT_FORMAT[item.contentType],
    conversions: 0,
    creatorId: `selector-${item.selectorsId}`,
    followers: item.followerCount,
    id: String(item.contentId),
    likes: item.likeCount,
    platform: item.snsCode === "YOUTUBE" ? "YouTube" : "Instagram",
    profileImageUrl: item.profileImageUrl,
    publishedAt: item.publishedAt.slice(0, 10),
    reactionTrend: item.trend.map((point) => ({
      comments: point.commentCount,
      likes: point.likeCount,
      recordedAt: point.recordedAt.slice(0, 10),
    })),
    selectorId: `selector-${item.selectorsId}`,
    thumbnailUrl: sortedMedia.find((media) => media.mediaUrl)?.mediaUrl ?? null,
    title: contentTitle(item),
    views: item.viewCount,
    viewsTrend: item.trend.map((point) => ({
      recordedAt: point.recordedAt.slice(0, 10),
      views: point.viewCount,
    })),
  };
}
