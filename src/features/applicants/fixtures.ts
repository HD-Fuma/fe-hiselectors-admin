import type { AiSummaryReport } from "../../components/content/AiSummaryPanel";

export type ReviewStatus = "검토 대기" | "승인" | "반려" | "자동 반려";
export type DeliveryChannel = "이메일" | "알림톡";
export type DeliveryStatus = "전송 대기" | "전송 완료" | "전송 실패";

export interface ApplicantMetric {
  platform: "Instagram" | "YouTube";
  channelName: string;
  followerCount: number;
  contentCount: number;
  recentActivity: string;
  averageViews: number;
  averageReactions: number;
}

export interface ApplicantDeliveryRecord {
  channel: DeliveryChannel;
  recipient: string;
  status: DeliveryStatus;
  sentAt: string;
}

export type ApplicantDeliveryRecords = readonly [
  primaryDelivery: ApplicantDeliveryRecord,
  ...fallbackDeliveries: ApplicantDeliveryRecord[],
];

export interface ApplicantFixture extends ApplicantMetric {
  id: string;
  name: string;
  appliedAt: string;
  email: string;
  phone: string;
  reviewStatus: ReviewStatus;
  autoRejected: boolean;
  aiReport: AiSummaryReport;
  failedCriteria: string[];
  internalReason: string;
  reviewNote: string;
  deliveries: ApplicantDeliveryRecords;
}

export interface ApplicantFeaturedContent {
  id: string;
  comments: number;
  likes: number;
  mediaType: "이미지" | "동영상";
  thumbnailUrl: string;
  title: string;
  url: string;
  views: number;
}

export interface ApplicantAnalysisReport {
  categories: string[];
  collaborationBrands: string[];
  contentFormats: Array<{ label: string; count: number }>;
  contentStyle: string;
  engagementRate: number;
  lastPostDate: string;
  maxGapDays: number;
  recent90ContentCount: number;
  riskFactors: string;
  summary: string;
  toneAndManner: string;
  updatedAt: string;
  uploadFrequency: number;
  keywords: Array<{ label: string; percentage: number }>;
  strengthsAndNotes: string;
  averageLikes: number;
  averageComments: number;
}

export const APPLICANTS: readonly ApplicantFixture[] = [
  {
    id: "ap-001",
    name: "김민지",
    appliedAt: "2026-08-03 09:12",
    email: "minji@example.com",
    phone: "010-4821-7326",
    platform: "Instagram",
    channelName: "@minji.daily",
    followerCount: 58_420,
    contentCount: 126,
    recentActivity: "2026-08-02",
    averageViews: 21_840,
    averageReactions: 1_472,
    reviewStatus: "검토 대기",
    autoRejected: false,
    aiReport: {
      status: "ready",
      fitnessScore: 91,
      summary: "뷰티·패션 콘텐츠의 반응이 안정적이며 최근 활동이 꾸준한 지원자입니다.",
      evidence: [
        "최근 30일 평균 조회 수 21,840회",
        "평균 반응률 6.7%",
        "최근 60일 콘텐츠 14건",
      ],
    },
    failedCriteria: [],
    internalReason: "",
    reviewNote: "최근 게시물 품질과 브랜드 적합성을 확인했습니다.",
    deliveries: [
      {
        channel: "이메일",
        recipient: "minji@example.com",
        status: "전송 대기",
        sentAt: "-",
      },
      {
        channel: "알림톡",
        recipient: "010-4821-7326",
        status: "전송 대기",
        sentAt: "-",
      },
    ],
  },
  {
    id: "ap-002",
    name: "정하린",
    appliedAt: "2026-08-02 16:40",
    email: "harin.lab@example.com",
    phone: "010-2396-1184",
    platform: "YouTube",
    channelName: "하린의 생활연구소",
    followerCount: 83_100,
    contentCount: 94,
    recentActivity: "2026-07-31",
    averageViews: 34_500,
    averageReactions: 2_140,
    reviewStatus: "승인",
    autoRejected: false,
    aiReport: {
      status: "ready",
      fitnessScore: 88,
      summary: "생활·리빙 분야의 실용 콘텐츠가 꾸준하고 시청자 반응이 안정적인 지원자입니다.",
      evidence: [
        "최근 30일 평균 조회 수 34,500회",
        "평균 반응 수 2,140건",
        "최근 60일 콘텐츠 11건",
      ],
    },
    failedCriteria: [],
    internalReason: "",
    reviewNote: "콘텐츠 완성도와 활동 주기를 확인하고 승인했습니다.",
    deliveries: [
      {
        channel: "알림톡",
        recipient: "010-2396-1184",
        status: "전송 완료",
        sentAt: "2026-08-03 10:36",
      },
      {
        channel: "이메일",
        recipient: "harin.lab@example.com",
        status: "전송 완료",
        sentAt: "2026-08-03 10:38",
      },
    ],
  },
  {
    id: "ap-003",
    name: "윤소라",
    appliedAt: "2026-08-03 10:46",
    email: "sora_daily@example.com",
    phone: "010-9037-2461",
    platform: "Instagram",
    channelName: "@sora_daily",
    followerCount: 860,
    contentCount: 2,
    recentActivity: "2026-03-14",
    averageViews: 340,
    averageReactions: 18,
    reviewStatus: "자동 반려",
    autoRejected: true,
    aiReport: {
      status: "ready",
      fitnessScore: 34,
      summary: "최근 활동과 콘텐츠 수가 필수 정량 기준에 미치지 못한 지원자입니다.",
      evidence: [
        "팔로워·구독자 860명",
        "최근 90일 콘텐츠 2건",
        "최근 활동일 2026-03-14",
      ],
    },
    failedCriteria: [
      "최근 90일 공개 게시물 2건으로 최소 기준 3건 미만",
    ],
    internalReason: "최근 90일 공개 게시물 수가 최소 기준에 미달해 자동 반려되었습니다.",
    reviewNote: "자동 반려 기준과 수집 지표를 확인했습니다.",
    deliveries: [
      {
        channel: "알림톡",
        recipient: "010-9037-2461",
        status: "전송 실패",
        sentAt: "2026-08-03 11:07",
      },
      {
        channel: "이메일",
        recipient: "sora_daily@example.com",
        status: "전송 완료",
        sentAt: "2026-08-03 11:08",
      },
    ],
  },
  {
    id: "ap-004",
    name: "권예나",
    appliedAt: "2026-08-01 14:25",
    email: "yena.style@example.com",
    phone: "010-6754-3902",
    platform: "Instagram",
    channelName: "@yena.style",
    followerCount: 12_700,
    contentCount: 49,
    recentActivity: "2026-07-29",
    averageViews: 6_230,
    averageReactions: 418,
    reviewStatus: "반려",
    autoRejected: false,
    aiReport: {
      status: "ready",
      fitnessScore: 67,
      summary: "패션 콘텐츠 활동은 꾸준하지만 현재 캠페인 채널 적합도가 낮은 지원자입니다.",
      evidence: [
        "최근 30일 평균 조회 수 6,230회",
        "평균 반응 수 418건",
        "최근 60일 콘텐츠 8건",
      ],
    },
    failedCriteria: [],
    internalReason: "채널 적합도 검토 결과 이번 기수 운영 방향과 맞지 않습니다.",
    reviewNote: "최근 콘텐츠 주제와 모집 기수의 운영 방향을 비교했습니다.",
    deliveries: [
      {
        channel: "알림톡",
        recipient: "010-6754-3902",
        status: "전송 완료",
        sentAt: "2026-08-02 09:20",
      },
      {
        channel: "이메일",
        recipient: "yena.style@example.com",
        status: "전송 완료",
        sentAt: "2026-08-02 09:21",
      },
    ],
  },
];

export function findApplicantFixture(applicantId: string | undefined) {
  return APPLICANTS.find((applicant) => applicant.id === applicantId);
}

const APPLICANT_ANALYSIS: Record<string, ApplicantAnalysisReport> = {
  "ap-001": {
    updatedAt: "2026.08.05",
    uploadFrequency: 3.2,
    recent90ContentCount: 29,
    maxGapDays: 6,
    lastPostDate: "2026.08.02",
    averageLikes: 1_308,
    averageComments: 164,
    engagementRate: 2.5,
    contentFormats: [{ label: "릴스", count: 15 }, { label: "이미지 포함 피드", count: 10 }, { label: "동영상 포함 피드", count: 4 }],
    summary: "실사용 뷰티와 데일리 패션을 균형 있게 소개하는 정보 전달형 지원자",
    categories: ["뷰티", "패션"],
    keywords: [{ label: "톤메이크업", percentage: 38 }, { label: "데일리룩", percentage: 34 }, { label: "뷰티리뷰", percentage: 28 }],
    collaborationBrands: ["올리브영", "무신사", "A브랜드"],
    contentStyle: "리뷰 · 하울 · 튜토리얼",
    toneAndManner: "친근함 · 정보 전달형 · 트렌디",
    riskFactors: "최근 90일 수집 콘텐츠에서 특이 위험 요소 미확인",
    strengthsAndNotes: "강점: 실사용 비교형 콘텐츠 반응이 안정적 · 유의점: 광고 고지 문구 사전 확인 필요",
  },
  "ap-002": {
    updatedAt: "2026.08.05",
    uploadFrequency: 2.6,
    recent90ContentCount: 23,
    maxGapDays: 8,
    lastPostDate: "2026.07.31",
    averageLikes: 1_870,
    averageComments: 270,
    engagementRate: 2.6,
    contentFormats: [{ label: "숏폼", count: 17 }, { label: "롱폼", count: 6 }],
    summary: "생활 실험과 홈케어 정보를 꾸준히 전달하는 실용형 리빙 지원자",
    categories: ["리빙/라이프", "푸드"],
    keywords: [{ label: "홈케어", percentage: 42 }, { label: "살림팁", percentage: 31 }, { label: "집밥", percentage: 27 }],
    collaborationBrands: ["오늘의집", "락앤락"],
    contentStyle: "브이로그 · 사용법 · 비교 리뷰",
    toneAndManner: "차분함 · 친근함 · 정보 전달형",
    riskFactors: "최근 90일 수집 콘텐츠에서 특이 위험 요소 미확인",
    strengthsAndNotes: "강점: 검색 의도가 명확한 정보성 영상 · 유의점: 롱폼 업로드 주기 변동 확인 필요",
  },
  "ap-003": {
    updatedAt: "2026.08.05",
    uploadFrequency: 0.2,
    recent90ContentCount: 2,
    maxGapDays: 71,
    lastPostDate: "2026.03.14",
    averageLikes: 16,
    averageComments: 2,
    engagementRate: 2.1,
    contentFormats: [{ label: "이미지 포함 피드", count: 2 }],
    summary: "최근 활동과 공개 콘텐츠 수가 최소 심사 기준에 미치지 못한 지원자",
    categories: ["패션"],
    keywords: [{ label: "데일리", percentage: 60 }, { label: "카페", percentage: 40 }],
    collaborationBrands: [],
    contentStyle: "일상 기록",
    toneAndManner: "친근함",
    riskFactors: "활동 공백이 길어 캠페인 운영 리스크가 존재",
    strengthsAndNotes: "강점: 소규모 팔로워와의 친밀도 · 유의점: 최근 90일 공개 콘텐츠 기준 미달",
  },
  "ap-004": {
    updatedAt: "2026.08.05",
    uploadFrequency: 1.9,
    recent90ContentCount: 17,
    maxGapDays: 12,
    lastPostDate: "2026.07.29",
    averageLikes: 364,
    averageComments: 54,
    engagementRate: 3.3,
    contentFormats: [{ label: "릴스", count: 9 }, { label: "이미지 포함 피드", count: 8 }],
    summary: "패션 착장 중심의 콘텐츠를 운영하나 현 기수 방향과의 적합도는 낮은 지원자",
    categories: ["패션"],
    keywords: [{ label: "출근룩", percentage: 45 }, { label: "스타일링", percentage: 35 }, { label: "하울", percentage: 20 }],
    collaborationBrands: ["W컨셉"],
    contentStyle: "룩북 · 하울",
    toneAndManner: "트렌디 · 활발함",
    riskFactors: "특이 위험 요소 미확인",
    strengthsAndNotes: "강점: 짧은 형식의 착장 콘텐츠 완성도 · 유의점: 모집 카테고리와의 적합도 재검토 필요",
  },
};

const APPLICANT_CONTENT: Record<string, ApplicantFeaturedContent[]> = {
  "ap-001": [
    { id: "ap-001-1", title: "여름 톤 메이크업 루틴", mediaType: "동영상", thumbnailUrl: "/creator-media/cr-001-02.jpg", url: "https://www.instagram.com/p/ap001-01/", views: 38_420, likes: 2_460, comments: 184 },
    { id: "ap-001-2", title: "출근 전 5분 데일리룩", mediaType: "이미지", thumbnailUrl: "/creator-media/cr-001-03.jpg", url: "https://www.instagram.com/p/ap001-02/", views: 27_830, likes: 1_940, comments: 126 },
    { id: "ap-001-3", title: "파우치 속 뷰티 아이템", mediaType: "이미지", thumbnailUrl: "/creator-media/cr-001-01.jpg", url: "https://www.instagram.com/p/ap001-03/", views: 24_610, likes: 1_720, comments: 98 },
  ],
  "ap-002": [
    { id: "ap-002-1", title: "살림 동선 정리 브이로그", mediaType: "동영상", thumbnailUrl: "/creator-media/cr-002-01.jpg", url: "https://www.youtube.com/watch?v=ap002-01", views: 132_400, likes: 4_820, comments: 392 },
    { id: "ap-002-2", title: "주말 집밥 루틴", mediaType: "동영상", thumbnailUrl: "/creator-media/cr-002-02.jpg", url: "https://www.youtube.com/watch?v=ap002-02", views: 98_300, likes: 3_610, comments: 281 },
    { id: "ap-002-3", title: "홈카페 도구 리뷰", mediaType: "동영상", thumbnailUrl: "/creator-media/cr-002-03.jpg", url: "https://www.youtube.com/watch?v=ap002-03", views: 81_700, likes: 2_940, comments: 226 },
  ],
  "ap-003": [
    { id: "ap-003-1", title: "봄 데일리 착장", mediaType: "이미지", thumbnailUrl: "/creator-media/cr-003-01.jpg", url: "https://www.instagram.com/p/ap003-01/", views: 410, likes: 21, comments: 3 },
    { id: "ap-003-2", title: "주말 카페 기록", mediaType: "이미지", thumbnailUrl: "/creator-media/cr-003-02.jpg", url: "https://www.instagram.com/p/ap003-02/", views: 270, likes: 12, comments: 1 },
  ],
  "ap-004": [
    { id: "ap-004-1", title: "초여름 출근룩", mediaType: "동영상", thumbnailUrl: "/creator-media/cr-004-01.jpg", url: "https://www.instagram.com/p/ap004-01/", views: 18_420, likes: 740, comments: 62 },
    { id: "ap-004-2", title: "주간 스타일링 하울", mediaType: "이미지", thumbnailUrl: "/creator-media/cr-004-02.jpg", url: "https://www.instagram.com/p/ap004-02/", views: 14_360, likes: 590, comments: 48 },
    { id: "ap-004-3", title: "액세서리 매치 팁", mediaType: "이미지", thumbnailUrl: "/creator-media/cr-004-03.jpg", url: "https://www.instagram.com/p/ap004-03/", views: 11_980, likes: 510, comments: 42 },
  ],
};

export function applicantAnalysisFor(applicant: ApplicantFixture) {
  return APPLICANT_ANALYSIS[applicant.id];
}

export function applicantFeaturedContentFor(applicant: ApplicantFixture) {
  return APPLICANT_CONTENT[applicant.id] ?? [];
}

export function applicantProfileUrl(applicant: ApplicantFixture) {
  return applicant.platform === "Instagram"
    ? `https://www.instagram.com/${applicant.channelName.replace(/^@/, "")}/`
    : `https://www.youtube.com/@${encodeURIComponent(applicant.channelName)}`;
}

export function applicantProfileImageUrl(applicant: ApplicantFixture) {
  const creatorId = applicant.id.replace("ap-", "cr-");
  return `/creator-media/${creatorId}-profile.jpg`;
}
