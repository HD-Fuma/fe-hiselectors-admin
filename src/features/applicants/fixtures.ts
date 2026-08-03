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
      "팔로워·구독자 1,000명 미만",
      "최근 90일 콘텐츠 3건 미만",
      "최근 90일 활동 없음",
    ],
    internalReason: "필수 정량 기준 3개 항목 미충족으로 자동 반려되었습니다.",
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
