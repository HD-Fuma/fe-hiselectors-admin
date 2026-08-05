export type ProposalChannel = "Instagram DM" | "이메일";
export type ProposalStatus = "발송 대기" | "발송 완료" | "발송 실패" | "셀렉터스 전환";
export type CreatorPlatform = "Instagram" | "YouTube" | "Facebook";
export type CreatorPortraitVariant = "sage" | "navy" | "coral" | "amber";
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
  platform: CreatorPlatform;
  title: string;
  mediaType: "이미지" | "동영상";
  views: number;
  visual: CreatorMediaVisual;
}

export interface CreatorChannelFixture {
  platform: CreatorPlatform;
  handle: string;
  followers: number;
  views: number;
  reactions: number;
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
  portrait: CreatorPortraitVariant;
  platforms: CreatorPlatform[];
  categories: string[];
  tier: "T0" | "T1" | "T2" | "T3";
  followers: number;
  contentCount: number;
  recentActivity: string;
  featuredContents: CreatorFeaturedContentFixture[];
  channels: CreatorChannelFixture[];
  aiReport: AiReportFixture;
  proposalStatus: ProposalStatus | "미제안";
}

export type CreatorProposalContact =
  | {
      availableProposalChannels: readonly ["Instagram DM"];
      email?: never;
    }
  | {
      availableProposalChannels: readonly ["이메일"];
      email: string;
    }
  | {
      availableProposalChannels: readonly ["Instagram DM", "이메일"];
      email: string;
    };

export type InstagramOnlyCreatorFixture = CreatorBaseFixture &
  Extract<CreatorProposalContact, { availableProposalChannels: readonly ["Instagram DM"] }>;

export type EmailCreatorFixture = CreatorBaseFixture &
  Exclude<CreatorProposalContact, { availableProposalChannels: readonly ["Instagram DM"] }>;

export type CreatorFixture = InstagramOnlyCreatorFixture | EmailCreatorFixture;

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
    portrait: "sage",
    platforms: ["Instagram", "YouTube"],
    categories: ["뷰티", "패션"],
    tier: "T1",
    followers: 128400,
    contentCount: 184,
    recentActivity: "2026-08-02",
    featuredContents: [
      {
        id: "seo-look",
        platform: "Instagram",
        title: "여름 데일리 룩",
        mediaType: "이미지",
        views: 98_600,
        visual: "fashion",
      },
      {
        id: "seo-tone",
        platform: "Instagram",
        title: "가을 톤 메이크업",
        mediaType: "이미지",
        views: 74_200,
        visual: "beauty",
      },
      {
        id: "seo-video",
        platform: "YouTube",
        title: "5분 출근 룩북",
        mediaType: "동영상",
        views: 63_100,
        visual: "skincare",
      },
    ],
    channels: [
      {
        platform: "Instagram",
        handle: "@seo.yeon",
        followers: 82400,
        views: 48200,
        reactions: 3278,
      },
      {
        platform: "YouTube",
        handle: "서연의 옷장",
        followers: 46000,
        views: 31400,
        reactions: 1945,
      },
    ],
    aiReport: SEOYEON_AI_REPORT,
    proposalStatus: "발송 완료",
    availableProposalChannels: ["Instagram DM", "이메일"],
    email: "seoyeon@example.com",
  },
  {
    id: "cr-002",
    name: "박도윤",
    portrait: "navy",
    platforms: ["YouTube"],
    categories: ["리빙", "푸드"],
    tier: "T2",
    followers: 76200,
    contentCount: 96,
    recentActivity: "2026-07-31",
    featuredContents: [
      {
        id: "doyoon-home",
        platform: "YouTube",
        title: "퇴근 후 집밥",
        mediaType: "동영상",
        views: 54_800,
        visual: "cooking",
      },
      {
        id: "doyoon-coffee",
        platform: "YouTube",
        title: "홈카페 레시피",
        mediaType: "동영상",
        views: 37_400,
        visual: "coffee",
      },
      {
        id: "doyoon-table",
        platform: "YouTube",
        title: "주말 한 상",
        mediaType: "이미지",
        views: 29_600,
        visual: "table",
      },
    ],
    channels: [
      {
        platform: "YouTube",
        handle: "도윤의 집밥",
        followers: 76200,
        views: 26800,
        reactions: 1320,
      },
    ],
    aiReport: {
      status: "ready",
      summary: "리빙과 푸드 분야에서 안정적인 시청 반응을 확보한 크리에이터입니다.",
      fitnessScore: 86,
      evidence: ["최근 30일 평균 조회 수 26,800회"],
    },
    proposalStatus: "셀렉터스 전환",
    availableProposalChannels: ["이메일"],
    email: "doyoon@example.com",
  },
  {
    id: "cr-003",
    name: "이지아",
    portrait: "coral",
    platforms: ["Instagram", "Facebook"],
    categories: ["여행", "라이프"],
    tier: "T3",
    followers: 51100,
    contentCount: 142,
    recentActivity: "2026-07-29",
    featuredContents: [
      {
        id: "zia-coast",
        platform: "Instagram",
        title: "여름 바다 산책",
        mediaType: "이미지",
        views: 42_300,
        visual: "coast",
      },
      {
        id: "zia-city",
        platform: "Facebook",
        title: "도시 여행 노트",
        mediaType: "이미지",
        views: 28_100,
        visual: "city",
      },
      {
        id: "zia-pack",
        platform: "Instagram",
        title: "3박 4일 패킹",
        mediaType: "동영상",
        views: 19_600,
        visual: "packing",
      },
    ],
    channels: [
      {
        platform: "Instagram",
        handle: "@zia.trip",
        followers: 32700,
        views: 17900,
        reactions: 980,
      },
      {
        platform: "Facebook",
        handle: "지아의 여행노트",
        followers: 18_400,
        views: 9_300,
        reactions: 420,
      },
    ],
    aiReport: PENDING_AI_REPORT,
    proposalStatus: "발송 실패",
    availableProposalChannels: ["Instagram DM", "이메일"],
    email: "zia@example.com",
  },
  {
    id: "cr-004",
    name: "오하늘",
    portrait: "amber",
    platforms: ["Instagram"],
    categories: ["푸드"],
    tier: "T0",
    followers: 486000,
    contentCount: 356,
    recentActivity: "2026-08-03",
    featuredContents: [
      {
        id: "haneul-dessert",
        platform: "Instagram",
        title: "제철 과일 디저트",
        mediaType: "동영상",
        views: 218_000,
        visual: "dessert",
      },
      {
        id: "haneul-table",
        platform: "Instagram",
        title: "오늘의 브런치",
        mediaType: "이미지",
        views: 184_000,
        visual: "table",
      },
      {
        id: "haneul-coffee",
        platform: "Instagram",
        title: "카페 신메뉴 리뷰",
        mediaType: "동영상",
        views: 169_000,
        visual: "coffee",
      },
    ],
    channels: [
      {
        platform: "Instagram",
        handle: "@today_haneul",
        followers: 486000,
        views: 154200,
        reactions: 12860,
      },
    ],
    aiReport: {
      status: "ready",
      summary: "푸드 콘텐츠의 도달 범위와 반응 수가 모두 높은 크리에이터입니다.",
      fitnessScore: 95,
      evidence: ["최근 30일 평균 조회 수 154,200회"],
    },
    proposalStatus: "미제안",
    availableProposalChannels: ["Instagram DM"],
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
    status: "셀렉터스 전환",
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
