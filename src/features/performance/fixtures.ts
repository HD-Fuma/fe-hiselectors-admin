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
  clicks: number;
  conversions: number;
}

export interface CreatorInfluence {
  id: string;
  name: string;
  cohort: string;
  platform: string;
  campaign: string;
  conversions: number;
  views: number;
  likes: number;
  comments: number;
}

export interface ContentInfluence {
  id: string;
  title: string;
  creatorId: string;
  selectorId: string;
  campaignId: string;
  platform: string;
  clicks: number;
  conversions: number;
  views: number;
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

export interface PerformanceTrendPoint {
  date: string;
  label: string;
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

const SELECTOR_METADATA: readonly SelectorMetadata[] = [
  {
    id: "sl-001",
    name: "김서연",
    cohort: "3기",
    status: "활동 중",
  },
  {
    id: "sl-002",
    name: "박도윤",
    cohort: "3기",
    status: "경고",
  },
  {
    id: "sl-003",
    name: "이지아",
    cohort: "2기",
    status: "박탈",
  },
  {
    id: "sl-004",
    name: "오하늘",
    cohort: "2기",
    status: "수료",
  },
];

const CREATOR_METADATA: readonly CreatorMetadata[] = [
  {
    id: "cr-001",
    name: "김서연",
    cohort: "3기",
    platform: "Instagram / YouTube",
  },
  {
    id: "cr-002",
    name: "박도윤",
    cohort: "3기",
    platform: "YouTube",
  },
  {
    id: "cr-003",
    name: "이지아",
    cohort: "2기",
    platform: "Instagram",
  },
  {
    id: "cr-004",
    name: "오하늘",
    cohort: "2기",
    platform: "Instagram",
  },
];

export const CONTENT_INFLUENCE: readonly ContentInfluence[] = [
  {
    id: "ct-001",
    title: "가을 라운딩 패딩 팬츠 소개",
    creatorId: "cr-001",
    selectorId: "sl-001",
    campaignId: "cp-001",
    platform: "Instagram",
    clicks: 6_420,
    conversions: 164,
    views: 48_200,
    likes: 3_880,
    comments: 274,
  },
  {
    id: "ct-002",
    title: "세인트앤드류스 패딩 팬츠 후기",
    creatorId: "cr-002",
    selectorId: "sl-002",
    campaignId: "cp-001",
    platform: "YouTube",
    clicks: 7_640,
    conversions: 206,
    views: 26_800,
    likes: 1_230,
    comments: 90,
  },
  {
    id: "ct-003",
    title: "여름 바캉스 컬러 스타일링",
    creatorId: "cr-001",
    selectorId: "sl-001",
    campaignId: "cp-002",
    platform: "Instagram",
    clicks: 6_420,
    conversions: 264,
    views: 62_200,
    likes: 4_980,
    comments: 312,
  },
  {
    id: "ct-004",
    title: "초여름 패션 스타일링 릴스",
    creatorId: "cr-003",
    selectorId: "sl-003",
    campaignId: "cp-003",
    platform: "Instagram",
    clicks: 3_120,
    conversions: 54,
    views: 17_900,
    likes: 912,
    comments: 68,
  },
  {
    id: "ct-005",
    title: "바캉스 푸드 스타일링",
    creatorId: "cr-004",
    selectorId: "sl-004",
    campaignId: "cp-002",
    platform: "Instagram",
    clicks: 18_600,
    conversions: 711,
    views: 154_200,
    likes: 11_920,
    comments: 940,
  },
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

export const PERFORMANCE_TREND: readonly PerformanceTrendPoint[] = [
  {
    date: "2026-08-01",
    label: "8월 1일",
    clicks: 13_200,
    conversions: 410,
  },
  {
    date: "2026-08-02",
    label: "8월 2일",
    clicks: 14_100,
    conversions: 463,
  },
  {
    date: "2026-08-03",
    label: "8월 3일",
    clicks: 14_900,
    conversions: 526,
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

export const CREATOR_INFLUENCE: readonly CreatorInfluence[] = CREATOR_METADATA.map(
  (creator) => {
    const contents = CONTENT_INFLUENCE.filter(
      (content) => content.creatorId === creator.id,
    );
    const campaignIds = [...new Set(contents.map((content) => content.campaignId))];

    return {
      ...creator,
      campaign:
        campaignIds.length === 1
          ? campaignNameById(campaignIds[0])
          : `${campaignIds.length}개 캠페인`,
      conversions: sumContentMetric(contents, "conversions"),
      views: sumContentMetric(contents, "views"),
      likes: sumContentMetric(contents, "likes"),
      comments: sumContentMetric(contents, "comments"),
    };
  },
);
