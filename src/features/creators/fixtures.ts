export type ProposalChannel = "Instagram DM" | "이메일";
export type ProposalStatus = "발송 대기" | "발송 완료" | "발송 실패" | "셀렉터스 전환";

export interface CreatorChannelFixture {
  platform: "Instagram" | "YouTube";
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

export interface CreatorFixture {
  id: string;
  name: string;
  platforms: string[];
  categories: string[];
  tier: "T0" | "T1" | "T2" | "T3";
  followers: number;
  contentCount: number;
  recentActivity: string;
  channels: CreatorChannelFixture[];
  aiReport: AiReportFixture;
  proposalStatus: ProposalStatus | "미제안";
  availableProposalChannels: ProposalChannel[];
  email?: string;
}

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
    platforms: ["Instagram", "YouTube"],
    categories: ["뷰티", "패션"],
    tier: "T1",
    followers: 128400,
    contentCount: 184,
    recentActivity: "2026-08-02",
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
    platforms: ["YouTube"],
    categories: ["리빙", "푸드"],
    tier: "T2",
    followers: 76200,
    contentCount: 96,
    recentActivity: "2026-07-31",
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
    platforms: ["Instagram"],
    categories: ["여행", "라이프"],
    tier: "T3",
    followers: 32700,
    contentCount: 142,
    recentActivity: "2026-07-29",
    channels: [
      {
        platform: "Instagram",
        handle: "@zia.trip",
        followers: 32700,
        views: 17900,
        reactions: 980,
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
    platforms: ["Instagram"],
    categories: ["푸드"],
    tier: "T0",
    followers: 486000,
    contentCount: 356,
    recentActivity: "2026-08-03",
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
