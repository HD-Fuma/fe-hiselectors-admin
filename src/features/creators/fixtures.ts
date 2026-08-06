export type ProposalChannel = "Instagram DM" | "이메일";
export type ProposalStatus = "발송 대기" | "발송 완료" | "발송 실패";
export type CreatorPlatform = "Instagram" | "YouTube";
export const CREATOR_CATEGORIES = [
  "뷰티", "패션", "푸드", "리빙/라이프", "유아동/패밀리", "컬처/서비스", "스포츠/레저", "여행", "반려생활", "아울렛",
] as const;
export type CreatorCategory = (typeof CREATOR_CATEGORIES)[number];
export type CreatorMediaVisual =
  | "beauty"
  | "fashion"
  | "skincare"
  | "cooking"
  | "coffee"
  | "table"
  | "coast"
  | "city"
  | "packing"
  | "dessert";

export interface CreatorFeaturedContentFixture {
  id: string;
  title: string;
  mediaType: "이미지" | "동영상";
  views: number;
  visual: CreatorMediaVisual;
  thumbnailUrl: string;
}

export interface CreatorProfileFixture {
  platform: CreatorPlatform;
  handle: string;
  profileUrl: string;
  followers: number;
  averageViews: number;
  averageReactions: number;
  engagementRate: number;
  profileImageUrl: string;
}

export interface AiReportFixture {
  status: "ready" | "pending";
  summary: string;
  fitnessScore: number | null;
  evidence: string[];
}

interface CreatorBaseFixture {
  id: string;
  name: string;
  profile: CreatorProfileFixture;
  category: CreatorCategory;
  keywords: string[];
  tier: "T0" | "T1" | "T2" | "T3";
  contentCount: number;
  recentActivity: string;
  featuredContents: CreatorFeaturedContentFixture[];
  aiReport: AiReportFixture;
  proposalStatus: ProposalStatus | "미제안";
}

export type CreatorProposalContact = {
  availableProposalChannels: readonly ["이메일"];
  email: string;
};

export type CreatorFixture = CreatorBaseFixture & CreatorProposalContact;

export interface ProposalFixture {
  id: string;
  targetId: string;
  targetName: string;
  channel: ProposalChannel;
  sendMethod: "수동" | "자동";
  sentAt: string;
  status: ProposalStatus;
  constraintNote?: string;
}

export const META_MANUAL_SEND_NOTE =
  "Meta 정책상 자동 선접촉이 불가합니다. 관리자 확인 후 수동 발송이 필요합니다.";

const SEOYEON_AI_REPORT: AiReportFixture = {
  status: "ready",
  summary:
    "뷰티·패션 콘텐츠의 반응률이 높고 최근 브랜드 협업 활동이 꾸준한 크리에이터입니다.",
  fitnessScore: 92,
  evidence: [
    "최근 30일 평균 조회 수 48,200회",
    "평균 반응률 6.8%",
    "브랜드 협업 콘텐츠 비중 34%",
  ],
};

export const PENDING_AI_REPORT: AiReportFixture = {
  status: "pending",
  summary: "",
  fitnessScore: null,
  evidence: [],
};

export const CREATORS: CreatorFixture[] = [
  {
    id: "cr-001",
    name: "김서연",
    profile: {
      platform: "Instagram",
      handle: "@seo.yeon",
      profileUrl: "https://www.instagram.com/seo.yeon",
      followers: 82_400,
      averageViews: 48_200,
      averageReactions: 3_278,
      engagementRate: 4,
      profileImageUrl: "/creator-media/kr-cr-001-profile.jpg",
    },
    category: "뷰티",
    keywords: ["#데일리룩", "#톤메이크업", "#뷰티리뷰"],
    tier: "T1",
    contentCount: 184,
    recentActivity: "2026-08-02",
    featuredContents: [
      {
        id: "seo-look",
        title: "여름 데일리 룩",
        mediaType: "이미지",
        views: 98_600,
        visual: "fashion",
        thumbnailUrl: "/creator-media/kr-cr-001-01.jpg",
      },
      {
        id: "seo-tone",
        title: "가을 톤 메이크업",
        mediaType: "이미지",
        views: 74_200,
        visual: "beauty",
        thumbnailUrl: "/creator-media/kr-cr-001-02.jpg",
      },
      {
        id: "seo-video",
        title: "5분 출근 룩북",
        mediaType: "동영상",
        views: 63_100,
        visual: "skincare",
        thumbnailUrl: "/creator-media/kr-cr-001-03.jpg",
      },
    ],
    aiReport: SEOYEON_AI_REPORT,
    proposalStatus: "발송 완료",
    availableProposalChannels: ["이메일"],
    email: "seoyeon@example.com",
  },
  {
    id: "cr-002",
    name: "박도윤",
    profile: {
      platform: "YouTube",
      handle: "도윤의 집밥",
      profileUrl: "https://www.youtube.com/@doyoonhome",
      followers: 76_200,
      averageViews: 26_800,
      averageReactions: 1_320,
      engagementRate: 1.7,
      profileImageUrl: "/creator-media/kr-cr-002-profile.jpg",
    },
    category: "리빙/라이프",
    keywords: ["#집밥", "#홈카페", "#주말요리"],
    tier: "T2",
    contentCount: 96,
    recentActivity: "2026-07-31",
    featuredContents: [
      {
        id: "doyoon-home",
        title: "퇴근 후 집밥",
        mediaType: "동영상",
        views: 54_800,
        visual: "cooking",
        thumbnailUrl: "/creator-media/kr-cr-002-01.jpg",
      },
      {
        id: "doyoon-coffee",
        title: "홈카페 레시피",
        mediaType: "동영상",
        views: 37_400,
        visual: "coffee",
        thumbnailUrl: "/creator-media/kr-cr-002-02.jpg",
      },
      {
        id: "doyoon-table",
        title: "주말 한 상",
        mediaType: "이미지",
        views: 29_600,
        visual: "table",
        thumbnailUrl: "/creator-media/kr-cr-002-03.jpg",
      },
    ],
    aiReport: {
      status: "ready",
      summary: "리빙과 푸드 분야에서 안정적인 시청 반응을 확보한 크리에이터입니다.",
      fitnessScore: 86,
      evidence: ["최근 30일 평균 조회 수 26,800회"],
    },
    proposalStatus: "발송 완료",
    availableProposalChannels: ["이메일"],
    email: "doyoon@example.com",
  },
  {
    id: "cr-003",
    name: "이지아",
    profile: {
      platform: "Instagram",
      handle: "@zia.trip",
      profileUrl: "https://www.instagram.com/zia.trip",
      followers: 32_700,
      averageViews: 17_900,
      averageReactions: 980,
      engagementRate: 3,
      profileImageUrl: "/creator-media/kr-cr-003-profile.jpg",
    },
    category: "여행",
    keywords: ["#국내여행", "#여행브이로그", "#주말여행"],
    tier: "T3",
    contentCount: 142,
    recentActivity: "2026-07-29",
    featuredContents: [
      {
        id: "zia-coast",
        title: "여름 바다 산책",
        mediaType: "이미지",
        views: 42_300,
        visual: "coast",
        thumbnailUrl: "/creator-media/kr-cr-003-01.jpg",
      },
      {
        id: "zia-city",
        title: "도시 여행 노트",
        mediaType: "이미지",
        views: 28_100,
        visual: "city",
        thumbnailUrl: "/creator-media/kr-cr-003-02.jpg",
      },
      {
        id: "zia-pack",
        title: "3박 4일 패킹",
        mediaType: "동영상",
        views: 19_600,
        visual: "packing",
        thumbnailUrl: "/creator-media/kr-cr-003-03.jpg",
      },
    ],
    aiReport: PENDING_AI_REPORT,
    proposalStatus: "발송 실패",
    availableProposalChannels: ["이메일"],
    email: "zia@example.com",
  },
  {
    id: "cr-004",
    name: "오하늘",
    profile: {
      platform: "Instagram",
      handle: "@today_haneul",
      profileUrl: "https://www.instagram.com/today_haneul",
      followers: 486_000,
      averageViews: 154_200,
      averageReactions: 12_860,
      engagementRate: 2.6,
      profileImageUrl: "/creator-media/kr-cr-004-profile.jpg",
    },
    category: "푸드",
    keywords: ["#브런치", "#디저트", "#카페리뷰"],
    tier: "T0",
    contentCount: 356,
    recentActivity: "2026-08-03",
    featuredContents: [
      {
        id: "haneul-dessert",
        title: "제철 과일 디저트",
        mediaType: "동영상",
        views: 218_000,
        visual: "dessert",
        thumbnailUrl: "/creator-media/kr-cr-004-01.jpg",
      },
      {
        id: "haneul-table",
        title: "오늘의 브런치",
        mediaType: "이미지",
        views: 184_000,
        visual: "table",
        thumbnailUrl: "/creator-media/kr-cr-004-02.jpg",
      },
      {
        id: "haneul-coffee",
        title: "카페 신메뉴 리뷰",
        mediaType: "동영상",
        views: 169_000,
        visual: "coffee",
        thumbnailUrl: "/creator-media/kr-cr-004-03.jpg",
      },
    ],
    aiReport: {
      status: "ready",
      summary: "푸드 콘텐츠의 도달 범위와 반응 수가 모두 높은 크리에이터입니다.",
      fitnessScore: 95,
      evidence: ["최근 30일 평균 조회 수 154,200회"],
    },
    proposalStatus: "미제안",
    availableProposalChannels: ["이메일"],
    email: "haneul@example.com",
  },
];

export const PROPOSALS: ProposalFixture[] = [
  {
    id: "pr-001",
    targetId: "cr-001",
    targetName: "김서연",
    channel: "Instagram DM",
    sendMethod: "수동",
    sentAt: "2026-08-03 10:24",
    status: "발송 완료",
    constraintNote: META_MANUAL_SEND_NOTE,
  },
  {
    id: "pr-002",
    targetId: "cr-002",
    targetName: "박도윤",
    channel: "이메일",
    sendMethod: "자동",
    sentAt: "2026-08-02 14:10",
    status: "발송 완료",
  },
  {
    id: "pr-003",
    targetId: "cr-003",
    targetName: "이지아",
    channel: "이메일",
    sendMethod: "자동",
    sentAt: "2026-08-01 09:05",
    status: "발송 실패",
  },
  {
    id: "pr-004",
    targetId: "cr-004",
    targetName: "오하늘",
    channel: "Instagram DM",
    sendMethod: "수동",
    sentAt: "2026-08-03 16:00",
    status: "발송 대기",
    constraintNote: META_MANUAL_SEND_NOTE,
  },
];
