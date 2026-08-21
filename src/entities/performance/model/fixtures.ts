import { SELECTORS } from "../../selectors/model/fixtures";

export function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatRate(conversions: number, clicks: number) {
  if (clicks === 0) {
    return "0.00%";
  }

  return `${((conversions / clicks) * 100).toFixed(2)}%`;
}

export type CampaignPerformanceStatus = "시작 전" | "진행 중" | "종료";
export type SelectorActivityStatus = "활동 중" | "경고" | "박탈" | "수료";
export type ContentPerformanceFormat =
  | "유튜브 롱폼"
  | "유튜브 쇼츠"
  | "인스타 릴스"
  | "인스타 피드"
  | "인스타 이미지";

interface CampaignMetadata {
  id: string;
  name: string;
  status: CampaignPerformanceStatus;
}

interface SelectorMetadata {
  id: string;
  name: string;
  cohort: string;
  status: SelectorActivityStatus;
  category: string;
  followers: number;
  contentCount: number;
  platforms: Array<"Instagram" | "YouTube">;
  clicks: number;
  conversions: number;
}

interface CreatorMetadata {
  id: string;
  name: string;
  cohort: string;
  platform: string;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  status: CampaignPerformanceStatus;
  clicks: number;
  conversions: number;
}

export interface SelectorPerformance {
  id: string;
  name: string;
  cohort: string;
  status: SelectorActivityStatus;
  category: string;
  followers: number;
  contentCount: number;
  platforms: Array<"Instagram" | "YouTube">;
  clicks: number;
  conversions: number;
}

export interface ContentInfluence {
  accountId?: string;
  authorName?: string;
  id: string;
  title: string;
  caption: string;
  contentFormat: ContentPerformanceFormat;
  creatorId: string;
  selectorId: string;
  campaignId: string;
  platform: string;
  followers: number;
  publishedAt: string;
  clicks: number;
  conversions: number;
  views: number;
  likes: number;
  comments: number;
  cohort?: string;
  viewsTrend: readonly ContentViewPoint[];
  reactionTrend: readonly ContentReactionPoint[];
  profileImageUrl?: string | null;
  thumbnailUrl?: string | null;
}

export interface ContentUploadActivity {
  activityDate: string;
  editedUploads: number;
  newUploads: number;
}

export interface ContentViewPoint {
  recordedAt: string;
  views: number;
}

export interface ContentReactionPoint {
  recordedAt: string;
  likes: number;
  comments: number;
}

export interface ProductInfluence {
  id: string;
  name: string;
  category: string;
  campaignId: string;
  contentCount: number;
  clicks: number;
  conversions: number;
}

const CAMPAIGN_METADATA: readonly CampaignMetadata[] = [
  {
    id: "cp-001",
    name: "2026 가을 골프웨어 셀렉션",
    status: "시작 전",
  },
  {
    id: "cp-002",
    name: "여름 바캉스 스타일링",
    status: "진행 중",
  },
  {
    id: "cp-003",
    name: "초여름 패션 리뷰",
    status: "종료",
  },
];

function platformsFromSns(sns: string): Array<"Instagram" | "YouTube"> {
  const platforms = sns
    .split(" / ")
    .filter((platform): platform is "Instagram" | "YouTube" => (
      platform === "Instagram" || platform === "YouTube"
    ));

  return platforms.length > 0 ? platforms : ["Instagram"];
}

const SELECTOR_METADATA: readonly SelectorMetadata[] = SELECTORS.map((selector) => ({
  id: selector.id,
  name: selector.name,
  cohort: selector.cohort,
  status: selector.status,
  category: selector.category ?? "리빙/라이프",
  followers: selector.followers ?? 0,
  contentCount: selector.contentCount,
  platforms: platformsFromSns(selector.sns),
  clicks: selector.clicks,
  conversions: selector.conversions,
}));

const CREATOR_METADATA: readonly CreatorMetadata[] = SELECTOR_METADATA.map((selector) => ({
  id: selector.id.replace(/^sl-/, "cr-"),
  name: selector.name,
  cohort: selector.cohort,
  platform: selector.platforms.join(" / "),
}));

const CONTENT_TREND_DATES = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (6 - index));

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
});

const CONTENT_TREND_RATES = [0.18, 0.34, 0.5, 0.65, 0.78, 0.91, 1] as const;

function createViewTrend(views: number): readonly ContentViewPoint[] {
  if (views <= 0) {
    return [];
  }

  return CONTENT_TREND_DATES.map((recordedAt, index) => ({
    recordedAt,
    views: Math.round(views * CONTENT_TREND_RATES[index]),
  }));
}

function createReactionTrend(likes: number, comments: number): readonly ContentReactionPoint[] {
  return CONTENT_TREND_DATES.map((recordedAt, index) => ({
    recordedAt,
    likes: Math.round(likes * CONTENT_TREND_RATES[index]),
    comments: Math.round(comments * CONTENT_TREND_RATES[index]),
  }));
}

const BASE_CONTENT_INFLUENCE: readonly ContentInfluence[] = [
  {
    id: "ct-001",
    title: "가을 라운딩 패딩 팬츠 소개",
    caption: "가볍고 따뜻한 라운딩 팬츠를 직접 입어 본 포인트를 정리했습니다. #셀렉터스 #광고",
    contentFormat: "인스타 피드",
    creatorId: "cr-001",
    selectorId: "sl-001",
    campaignId: "cp-001",
    platform: "Instagram",
    followers: 82_400,
    publishedAt: "2026-07-22",
    clicks: 6_420,
    conversions: 164,
    views: 0,
    likes: 3_880,
    comments: 274,
    viewsTrend: createViewTrend(0),
    reactionTrend: createReactionTrend(3_880, 274),
  },
  {
    id: "ct-002",
    title: "세인트앤드류스 패딩 팬츠 후기",
    caption: "필드에서 확인한 착용감과 보온성을 영상으로 자세히 소개합니다. #셀렉터스 #광고",
    contentFormat: "유튜브 롱폼",
    creatorId: "cr-002",
    selectorId: "sl-002",
    campaignId: "cp-001",
    platform: "YouTube",
    followers: 76_200,
    publishedAt: "2026-07-23",
    clicks: 7_640,
    conversions: 206,
    views: 26_800,
    likes: 1_230,
    comments: 90,
    viewsTrend: createViewTrend(26_800),
    reactionTrend: createReactionTrend(1_230, 90),
  },
  {
    id: "ct-003",
    title: "여름 바캉스 컬러 스타일링",
    caption: "휴양지에서 활용하기 좋은 컬러 조합을 짧은 영상으로 담았습니다. #셀렉터스 #광고",
    contentFormat: "인스타 릴스",
    creatorId: "cr-001",
    selectorId: "sl-001",
    campaignId: "cp-002",
    platform: "Instagram",
    followers: 82_400,
    publishedAt: "2026-07-24",
    clicks: 6_420,
    conversions: 264,
    views: 62_200,
    likes: 4_980,
    comments: 312,
    viewsTrend: createViewTrend(62_200),
    reactionTrend: createReactionTrend(4_980, 312),
  },
  {
    id: "ct-004",
    title: "초여름 패션 스타일링 릴스",
    caption: "초여름 데일리 룩 세 가지를 릴스로 빠르게 비교해 보세요. #셀렉터스 #광고",
    contentFormat: "인스타 릴스",
    creatorId: "cr-003",
    selectorId: "sl-003",
    campaignId: "cp-003",
    platform: "Instagram",
    followers: 32_700,
    publishedAt: "2026-07-25",
    clicks: 3_120,
    conversions: 54,
    views: 17_900,
    likes: 912,
    comments: 68,
    viewsTrend: createViewTrend(17_900),
    reactionTrend: createReactionTrend(912, 68),
  },
  {
    id: "ct-005",
    title: "바캉스 푸드 스타일링",
    caption: "여름 식탁을 산뜻하게 만드는 플레이팅 아이디어를 공유합니다. #셀렉터스 #광고",
    contentFormat: "인스타 이미지",
    creatorId: "cr-004",
    selectorId: "sl-004",
    campaignId: "cp-002",
    platform: "Instagram",
    followers: 486_000,
    publishedAt: "2026-07-26",
    clicks: 18_600,
    conversions: 711,
    views: 154_200,
    likes: 11_920,
    comments: 940,
    viewsTrend: createViewTrend(154_200),
    reactionTrend: createReactionTrend(11_920, 940),
  },
];

const CATEGORY_CONTENT_TOPICS: Record<string, string> = {
  "뷰티": "출근 전 빠르게 완성하는 톤 메이크업",
  "패션": "한 벌로 완성한 주말 데일리 룩",
  "푸드": "집에서 즐기는 제철 메뉴 추천",
  "리빙/라이프": "실사용으로 고른 생활 아이템",
  "유아동/패밀리": "주말 가족 나들이 준비 리스트",
  "컬처/서비스": "도심에서 즐기는 이번 주 문화 생활",
  "스포츠/레저": "주말 러닝을 위한 필수 준비물",
  "여행": "여름 국내 여행 짐싸기 노하우",
  "반려생활": "반려동물과 함께 쓰는 데일리 아이템",
  "아울렛": "알뜰하게 고른 시즌 베스트 아이템",
};

const GENERATED_CONTENT_INFLUENCE: readonly ContentInfluence[] = SELECTOR_METADATA
  .filter((selector) => selector.id !== "sl-001" && selector.id !== "sl-002" && selector.id !== "sl-003" && selector.id !== "sl-004")
  .map((selector, index) => {
    const viewMultiplier = 0.54 + (index % 4) * 0.12;
    const platform = selector.platforms[index % selector.platforms.length];
    const contentFormat: ContentPerformanceFormat = platform === "YouTube"
      ? index % 2 === 0 ? "유튜브 쇼츠" : "유튜브 롱폼"
      : index % 3 === 0 ? "인스타 릴스" : index % 3 === 1 ? "인스타 피드" : "인스타 이미지";
    const views = platform === "Instagram" && index % 4 === 0
      ? 0
      : Math.round(selector.followers * viewMultiplier);
    const likes = Math.round(
      (views || selector.followers * 0.36) * (0.038 + (index % 3) * 0.008),
    );
    const comments = Math.max(36, Math.round(likes * (0.055 + (index % 2) * 0.012)));

    return {
      id: `ct-${String(index + 6).padStart(3, "0")}`,
      title: CATEGORY_CONTENT_TOPICS[selector.category] ?? "셀렉터스 추천 콘텐츠",
      caption: `${CATEGORY_CONTENT_TOPICS[selector.category] ?? "셀렉터스 추천 아이템"}의 사용 포인트를 직접 정리했습니다. #셀렉터스 #광고`,
      contentFormat,
      creatorId: selector.id.replace(/^sl-/, "cr-"),
      selectorId: selector.id,
      campaignId: ["cp-001", "cp-002", "cp-003"][index % 3],
      platform,
      followers: selector.followers,
      publishedAt: `2026-07-${String(10 + (index % 18)).padStart(2, "0")}`,
      clicks: selector.clicks,
      conversions: selector.conversions,
      views,
      likes,
      comments,
      viewsTrend: createViewTrend(views),
      reactionTrend: createReactionTrend(likes, comments),
    };
  });

export const CONTENT_INFLUENCE: readonly ContentInfluence[] = [
  ...BASE_CONTENT_INFLUENCE,
  ...GENERATED_CONTENT_INFLUENCE,
];

export const CONTENT_UPLOAD_ACTIVITY: readonly ContentUploadActivity[] = [
  { activityDate: "2026-07-10", newUploads: 3, editedUploads: 1 },
  { activityDate: "2026-07-11", newUploads: 2, editedUploads: 0 },
  { activityDate: "2026-07-12", newUploads: 4, editedUploads: 2 },
  { activityDate: "2026-07-13", newUploads: 2, editedUploads: 1 },
  { activityDate: "2026-07-14", newUploads: 3, editedUploads: 2 },
  { activityDate: "2026-07-15", newUploads: 5, editedUploads: 1 },
  { activityDate: "2026-07-16", newUploads: 2, editedUploads: 3 },
  { activityDate: "2026-07-17", newUploads: 4, editedUploads: 1 },
  { activityDate: "2026-07-18", newUploads: 3, editedUploads: 2 },
  { activityDate: "2026-07-19", newUploads: 2, editedUploads: 1 },
  { activityDate: "2026-07-20", newUploads: 4, editedUploads: 2 },
  { activityDate: "2026-07-21", newUploads: 3, editedUploads: 3 },
  { activityDate: "2026-07-22", newUploads: 5, editedUploads: 2 },
  { activityDate: "2026-07-23", newUploads: 4, editedUploads: 1 },
  { activityDate: "2026-07-24", newUploads: 6, editedUploads: 3 },
  { activityDate: "2026-07-25", newUploads: 3, editedUploads: 2 },
  { activityDate: "2026-07-26", newUploads: 4, editedUploads: 1 },
  { activityDate: "2026-07-27", newUploads: 2, editedUploads: 2 },
];

export const PRODUCT_INFLUENCE: readonly ProductInfluence[] = [
  {
    id: "pd-001",
    name: "에어핏 라운딩 패딩 팬츠",
    category: "골프웨어",
    campaignId: "cp-001",
    contentCount: 2,
    clicks: 14_060,
    conversions: 370,
  },
  {
    id: "pd-002",
    name: "리조트 린넨 셋업",
    category: "여성 패션",
    campaignId: "cp-002",
    contentCount: 2,
    clicks: 25_020,
    conversions: 975,
  },
  {
    id: "pd-003",
    name: "썸머 에센셜 가디건",
    category: "여성 패션",
    campaignId: "cp-003",
    contentCount: 1,
    clicks: 3_120,
    conversions: 54,
  },
];

type ContentMetric = "clicks" | "conversions" | "views" | "likes" | "comments";

function sumContentMetric(contents: readonly ContentInfluence[], metric: ContentMetric) {
  return contents.reduce((total, content) => total + content[metric], 0);
}

export function campaignNameById(campaignId: string) {
  return CAMPAIGN_METADATA.find((campaign) => campaign.id === campaignId)?.name ?? campaignId;
}

export function creatorNameById(creatorId: string) {
  return CREATOR_METADATA.find((creator) => creator.id === creatorId)?.name ?? creatorId;
}

export function selectorCohortById(selectorId: string) {
  return SELECTOR_METADATA.find((selector) => selector.id === selectorId)?.cohort ?? "-";
}

export const CAMPAIGN_PERFORMANCE: readonly CampaignPerformance[] = CAMPAIGN_METADATA.map(
  (campaign) => {
    const contents = CONTENT_INFLUENCE.filter(
      (content) => content.campaignId === campaign.id,
    );

    return {
      ...campaign,
      clicks: sumContentMetric(contents, "clicks"),
      conversions: sumContentMetric(contents, "conversions"),
    };
  },
);

export const SELECTOR_PERFORMANCE: readonly SelectorPerformance[] = SELECTOR_METADATA.map(
  (selector) => {
    const contents = CONTENT_INFLUENCE.filter(
      (content) => content.selectorId === selector.id,
    );

    return {
      ...selector,
      clicks: sumContentMetric(contents, "clicks"),
      conversions: sumContentMetric(contents, "conversions"),
    };
  },
);
