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
  author: string;
  cohort: string;
  campaign: string;
  platform: string;
  conversions: number;
  views: number;
  likes: number;
  comments: number;
}

export const CAMPAIGN_PERFORMANCE: readonly CampaignPerformance[] = [
  {
    id: "cp-001",
    name: "2026 가을 골프웨어 셀렉션",
    status: "시작 전",
    clicks: 0,
    conversions: 0,
  },
  {
    id: "cp-002",
    name: "여름 바캉스 스타일링",
    status: "진행 중",
    clicks: 24_820,
    conversions: 829,
  },
  {
    id: "cp-003",
    name: "초여름 패션 리뷰",
    status: "종료",
    clicks: 17_380,
    conversions: 570,
  },
];

export const SELECTOR_PERFORMANCE: readonly SelectorPerformance[] = [
  {
    id: "sl-001",
    name: "김서연",
    cohort: "3기",
    status: "활동 중",
    clicks: 12_840,
    conversions: 428,
  },
  {
    id: "sl-002",
    name: "박도윤",
    cohort: "3기",
    status: "경고",
    clicks: 7_640,
    conversions: 206,
  },
  {
    id: "sl-003",
    name: "이지아",
    cohort: "2기",
    status: "박탈",
    clicks: 3_120,
    conversions: 54,
  },
  {
    id: "sl-004",
    name: "오하늘",
    cohort: "2기",
    status: "수료",
    clicks: 18_600,
    conversions: 711,
  },
];

export const CREATOR_INFLUENCE: readonly CreatorInfluence[] = [
  {
    id: "cr-001",
    name: "김서연",
    cohort: "3기",
    platform: "Instagram / YouTube",
    campaign: "2026 가을 골프웨어 셀렉션",
    conversions: 428,
    views: 79_600,
    likes: 4_860,
    comments: 363,
  },
  {
    id: "cr-002",
    name: "박도윤",
    cohort: "3기",
    platform: "YouTube",
    campaign: "여름 바캉스 스타일링",
    conversions: 206,
    views: 26_800,
    likes: 1_230,
    comments: 90,
  },
  {
    id: "cr-003",
    name: "이지아",
    cohort: "2기",
    platform: "Instagram",
    campaign: "초여름 패션 리뷰",
    conversions: 54,
    views: 17_900,
    likes: 912,
    comments: 68,
  },
  {
    id: "cr-004",
    name: "오하늘",
    cohort: "2기",
    platform: "Instagram",
    campaign: "초여름 패션 리뷰",
    conversions: 711,
    views: 154_200,
    likes: 11_920,
    comments: 940,
  },
];

export const CONTENT_INFLUENCE: readonly ContentInfluence[] = [
  {
    id: "ct-001",
    title: "가을 라운딩 패딩 팬츠 소개",
    author: "김서연",
    cohort: "3기",
    campaign: "2026 가을 골프웨어 셀렉션",
    platform: "Instagram",
    conversions: 164,
    views: 48_200,
    likes: 3_880,
    comments: 274,
  },
  {
    id: "ct-002",
    title: "세인트앤드류스 패딩 팬츠 후기",
    author: "박도윤",
    cohort: "3기",
    campaign: "2026 가을 골프웨어 셀렉션",
    platform: "YouTube",
    conversions: 206,
    views: 26_800,
    likes: 1_230,
    comments: 90,
  },
  {
    id: "ct-003",
    title: "여름 바캉스 컬러 스타일링",
    author: "김서연",
    cohort: "3기",
    campaign: "여름 바캉스 스타일링",
    platform: "Instagram",
    conversions: 264,
    views: 62_200,
    likes: 4_980,
    comments: 312,
  },
  {
    id: "ct-004",
    title: "초여름 패션 스타일링 릴스",
    author: "이지아",
    cohort: "2기",
    campaign: "초여름 패션 리뷰",
    platform: "Instagram",
    conversions: 54,
    views: 17_900,
    likes: 912,
    comments: 68,
  },
  {
    id: "ct-005",
    title: "바캉스 푸드 스타일링",
    author: "오하늘",
    cohort: "2기",
    campaign: "여름 바캉스 스타일링",
    platform: "Instagram",
    conversions: 711,
    views: 154_200,
    likes: 11_920,
    comments: 940,
  },
];
