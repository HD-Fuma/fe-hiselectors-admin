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
  proposalStatus: ProposalStatus | "미제안" | "발송 전";
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
  receiver: string;
  recipientEmail: string;
  administratorId: string;
  administratorName: string;
  channel: ProposalChannel;
  sentAt: string;
  status: ProposalStatus;
  message: string;
}

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

const BASE_CREATORS: CreatorFixture[] = [
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
    proposalStatus: "발송 전",
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

const DEMO_CREATOR_NAMES = [
  "김하린", "윤서준", "박다은", "최민호", "이수아", "정현우", "한유진", "오지민",
  "서도현", "문채원", "류시온", "장예린", "신태윤", "권나연", "배준호", "임소율",
];
const ADDITIONAL_CREATOR_NAMES = [
  "강민서", "조유나", "송지후", "백예은", "노준영", "홍서아", "남태현", "심가은", "유재민", "고은채",
  "안시우", "전하윤", "양도겸", "손아린", "주원석", "황예지", "차민재", "공서윤", "변우진", "여다인",
  "진성호", "구채린", "나연우", "마지수", "표건우", "엄하린", "도윤재", "방세아", "사준혁", "피유림",
  "곽민규", "김예나", "박시현", "이도아", "최우성", "정다현", "한지안", "오승민", "서유리", "문재하",
  "류소민", "장도하", "신예림", "권준서", "배아영", "임현서", "윤가람", "김태리", "박선우", "이채영",
];
const DEMO_CREATOR_CATEGORIES: CreatorCategory[] = [
  "패션", "유아동/패밀리", "컬처/서비스", "스포츠/레저", "반려생활", "아울렛", "뷰티", "리빙/라이프",
  "여행", "푸드", "패션", "유아동/패밀리", "컬처/서비스", "스포츠/레저", "반려생활", "아울렛",
];
const ALL_DEMO_CREATOR_NAMES = [...DEMO_CREATOR_NAMES, ...ADDITIONAL_CREATOR_NAMES];

export const CREATORS: CreatorFixture[] = [
  ...BASE_CREATORS,
  ...ALL_DEMO_CREATOR_NAMES.map((name, index) => {
    const source = BASE_CREATORS[index % BASE_CREATORS.length];
    const sequence = index + 5;
    const handle = `@creator_${String(sequence).padStart(3, "0")}`;
    const category = DEMO_CREATOR_CATEGORIES[index]
      ?? CREATOR_CATEGORIES[(index - DEMO_CREATOR_CATEGORIES.length) % CREATOR_CATEGORIES.length];

    return {
      ...source,
      id: `cr-${String(sequence).padStart(3, "0")}`,
      name,
      profile: {
        ...source.profile,
        handle,
        profileUrl: source.profile.platform === "Instagram"
          ? `https://www.instagram.com/${handle.slice(1)}`
          : `https://www.youtube.com/${handle.slice(1)}`,
        followers: source.profile.followers + sequence * 1_340,
        averageViews: source.profile.averageViews + sequence * 840,
        averageReactions: source.profile.averageReactions + sequence * 67,
      },
      category,
      keywords: [`#${category}`, "#크리에이터", "#셀렉터스"],
      contentCount: source.contentCount + sequence * 7,
      recentActivity: `2026-08-${String((sequence % 9) + 1).padStart(2, "0")}`,
      featuredContents: source.featuredContents.map((content, contentIndex) => ({
        ...content,
        id: `cr-${String(sequence).padStart(3, "0")}-content-${contentIndex + 1}`,
      })),
      email: `creator${String(sequence).padStart(3, "0")}@example.com`,
    };
  }),
];

const PROPOSAL_ADMINISTRATORS = [
  ["admin-001", "김민지"],
  ["admin-002", "이현우"],
  ["admin-003", "박수진"],
  ["admin-004", "최준혁"],
] as const;

const ADDITIONAL_PROPOSALS: ProposalFixture[] = Array.from({ length: 100 }, (_, index) => {
  const sequence = index + 5;
  const creator = CREATORS[index % CREATORS.length];
  const [administratorId, administratorName] = PROPOSAL_ADMINISTRATORS[index % PROPOSAL_ADMINISTRATORS.length];
  const status: ProposalStatus = index % 3 === 0
    ? "발송 대기"
    : index % 3 === 1
      ? "발송 완료"
      : "발송 실패";
  const month = index < 72 ? "08" : index < 92 ? "07" : "06";
  const day = String((index % 28) + 1).padStart(2, "0");
  const hour = String(9 + (index % 9)).padStart(2, "0");
  const minute = String((index * 7) % 60).padStart(2, "0");

  return {
    id: `pr-${String(sequence).padStart(3, "0")}`,
    targetId: creator.id,
    targetName: creator.name,
    receiver: creator.profile.handle,
    recipientEmail: creator.email,
    administratorId,
    administratorName,
    channel: "이메일",
    sentAt: `2026-${month}-${day} ${hour}:${minute}`,
    status,
    message: `안녕하세요, ${creator.name} 님. ${creator.category} 콘텐츠를 인상 깊게 보았습니다. 더현대Hi 셀렉터스와 함께할 활동을 제안드립니다.`,
  };
});

export const PROPOSALS: ProposalFixture[] = [
  {
    id: "pr-001",
    targetId: "cr-001",
    targetName: "김서연",
    receiver: "@seo.yeon",
    recipientEmail: "seoyeon@example.com",
    administratorId: "admin-001",
    administratorName: "김민지",
    channel: "이메일",
    sentAt: "2026-08-03 10:24",
    status: "발송 완료",
    message: "안녕하세요, 김서연 님. 셀렉토리스와 함께할 크리에이터 파트너를 찾고 있습니다. 뷰티 콘텐츠와 브랜드의 방향성이 잘 맞아 협업을 제안드립니다.",
  },
  {
    id: "pr-002",
    targetId: "cr-002",
    targetName: "박도윤",
    receiver: "도윤의 집밥",
    recipientEmail: "doyoon@example.com",
    administratorId: "admin-001",
    administratorName: "김민지",
    channel: "이메일",
    sentAt: "2026-08-02 14:10",
    status: "발송 완료",
    message: "안녕하세요, 도윤의 집밥 님. 따뜻하고 실용적인 콘텐츠를 인상 깊게 보고 연락드립니다. 셀렉토리스 크리에이터 파트너십 참여를 제안드리고 싶습니다.",
  },
  {
    id: "pr-003",
    targetId: "cr-003",
    targetName: "이지아",
    receiver: "@zia.trip",
    recipientEmail: "zia@example.com",
    administratorId: "admin-002",
    administratorName: "이현우",
    channel: "이메일",
    sentAt: "2026-08-01 09:05",
    status: "발송 실패",
    message: "안녕하세요, 이지아 님. 여행 콘텐츠의 감각적인 시선이 셀렉토리스 브랜드와 잘 어울린다고 생각했습니다. 크리에이터 파트너십을 제안드립니다.",
  },
  {
    id: "pr-004",
    targetId: "cr-004",
    targetName: "오하늘",
    receiver: "@today_haneul",
    recipientEmail: "haneul@example.com",
    administratorId: "admin-002",
    administratorName: "이현우",
    channel: "이메일",
    sentAt: "2026-08-03 16:00",
    status: "발송 대기",
    message: "안녕하세요, 오하늘 님. 일상에 자연스럽게 녹아드는 콘텐츠를 보고 셀렉토리스와의 협업 가능성을 이야기 나누고 싶어 연락드립니다.",
  },
  ...ADDITIONAL_PROPOSALS,
];
