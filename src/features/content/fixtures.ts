export type ReviewType = "NEW" | "VIOLATION_CORRECTION" | "EDITED";
export type ReviewStatus = "검수 대기" | "수정 요청" | "승인" | "위반 확정";
export type ProcessingState = "미처리" | "안내 대기" | "처리 완료";

export interface ContentSnapshot {
  label: string;
  text: string;
  urls: string[];
  mediaCount: number;
  mediaKinds: string[];
  capturedAt: string;
}

export interface ContentReviewFixture {
  id: string;
  author: string;
  cohort: string;
  sourcePlatform: string;
  submittedAt: string;
  reviewType: ReviewType;
  previousSnapshot: ContentSnapshot | null;
  currentSnapshot: ContentSnapshot;
  aiStatus: "ready" | "pending";
  aiSummary: string;
  detectedIssues: string[];
  violationType: string | null;
  reviewStatus: ReviewStatus;
  processingState: ProcessingState;
  availableActions: string[];
  changeItems: string[];
}

export interface ViolationFixture {
  id: string;
  cohort: string;
  selectorName: string;
  contentId: string;
  violationType: string;
  noticeText: string;
  noticeStatus: "미발송" | "발송 대기" | "발송 완료" | "발송 실패";
  processingState: "미처리" | "처리 중" | "처리 완료";
  accumulatedPenalties: number;
}

export const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  NEW: "신규 콘텐츠",
  VIOLATION_CORRECTION: "위반 수정본",
  EDITED: "일반 수정본",
};

export const CONTENT_REVIEWS: readonly ContentReviewFixture[] = [
  {
    id: "ct-001",
    author: "김서연",
    cohort: "3기",
    sourcePlatform: "Instagram",
    submittedAt: "2026-08-03 10:42",
    reviewType: "NEW",
    previousSnapshot: null,
    currentSnapshot: {
      label: "최초 수집 원본",
      capturedAt: "2026-08-03 10:40",
      text: "가을 라운딩을 위한 세인트앤드류스 패딩 팬츠를 소개합니다. 가볍고 편안한 스트레치 소재를 확인해 보세요. #현대홈쇼핑 #셀렉터스 #광고",
      urls: ["https://www.hmall.com/p/2200098405"],
      mediaCount: 4,
      mediaKinds: ["이미지", "이미지", "이미지", "이미지"],
    },
    aiStatus: "ready",
    aiSummary:
      "상품명과 공식 링크, 광고 표기가 포함되어 있으며 현재 감지된 위반 항목은 없습니다.",
    detectedIssues: ["감지된 위반 없음"],
    violationType: null,
    reviewStatus: "검수 대기",
    processingState: "미처리",
    availableActions: ["검수 완료", "수정 요청", "위반 판정"],
    changeItems: ["이전 비교 대상 없음", "URL 1개", "미디어 4개"],
  },
  {
    id: "ct-002",
    author: "박도윤",
    cohort: "3기",
    sourcePlatform: "YouTube",
    submittedAt: "2026-08-03 09:45",
    reviewType: "VIOLATION_CORRECTION",
    previousSnapshot: {
      label: "직전 위반 판정본",
      capturedAt: "2026-08-01 14:30",
      text: "세인트앤드류스 신상 패딩, 지금 가장 저렴하게 구매하세요.",
      urls: [
        "https://short.example/golf",
        "https://www.hmall.com/p/2200098405?ref=old",
      ],
      mediaCount: 5,
      mediaKinds: ["이미지", "이미지", "이미지", "이미지", "동영상"],
    },
    currentSnapshot: {
      label: "위반 후 수정본",
      capturedAt: "2026-08-03 09:40",
      text: "유료광고를 포함한 세인트앤드류스 패딩 팬츠 후기입니다. 상품 정보는 공식 링크에서 확인해 주세요. #현대홈쇼핑 #광고",
      urls: ["https://www.hmall.com/p/2200098405"],
      mediaCount: 4,
      mediaKinds: ["이미지", "이미지", "이미지", "이미지"],
    },
    aiStatus: "ready",
    aiSummary:
      "광고 표기와 공식 상품 링크가 보완되었고 과장 표현이 삭제되었습니다. 미디어는 5개에서 4개로 변경되었습니다.",
    detectedIssues: ["필수 광고 표기 누락", "비공식 단축 URL"],
    violationType: "필수 광고 표기 누락",
    reviewStatus: "검수 대기",
    processingState: "처리 완료",
    availableActions: ["위반 해제", "재수정 요청", "위반 유지"],
    changeItems: ["본문 변경됨", "URL 2 → 1", "미디어 5 → 4"],
  },
  {
    id: "ct-003",
    author: "김서연",
    cohort: "3기",
    sourcePlatform: "Instagram",
    submittedAt: "2026-08-03 16:25",
    reviewType: "EDITED",
    previousSnapshot: {
      label: "직전 승인본",
      capturedAt: "2026-08-02 12:10",
      text: "가을 라운딩 코디로 고른 세인트앤드류스 패딩 팬츠입니다. #현대홈쇼핑 #셀렉터스 #광고",
      urls: ["https://www.hmall.com/p/2200098405"],
      mediaCount: 3,
      mediaKinds: ["이미지", "이미지", "이미지"],
    },
    currentSnapshot: {
      label: "수정 감지본",
      capturedAt: "2026-08-03 16:22",
      text: "선선한 아침 라운딩에 입어 본 세인트앤드류스 스트레치 패딩 팬츠입니다. 착용감과 사이즈 팁을 확인해 보세요. #현대홈쇼핑 #셀렉터스 #광고",
      urls: [
        "https://www.hmall.com/p/2200098405",
        "https://www.hmall.com/event/golf",
      ],
      mediaCount: 4,
      mediaKinds: ["이미지", "이미지", "이미지", "이미지"],
    },
    aiStatus: "ready",
    aiSummary:
      "본문과 링크, 이미지 수 변경을 감지했습니다. 필수 광고 표기와 공식 상품 링크는 유지되었습니다.",
    detectedIssues: ["이벤트 URL 1개 추가", "이미지 1개 추가", "감지된 위반 없음"],
    violationType: null,
    reviewStatus: "검수 대기",
    processingState: "미처리",
    availableActions: ["변경 승인", "수정 요청", "위반 판정"],
    changeItems: ["본문 변경됨", "URL 1 → 2", "미디어 3 → 4"],
  },
];

export const VIOLATIONS: readonly ViolationFixture[] = [
  {
    id: "vr-001",
    cohort: "3기",
    selectorName: "김서연",
    contentId: "ct-005",
    violationType: "상품 링크 누락",
    noticeText: "공식 상품 링크를 추가한 뒤 수정본을 제출해 주세요.",
    noticeStatus: "미발송",
    processingState: "미처리",
    accumulatedPenalties: 0,
  },
  {
    id: "vr-002",
    cohort: "3기",
    selectorName: "박도윤",
    contentId: "ct-002",
    violationType: "필수 광고 표기 누락",
    noticeText: "광고 표기를 본문 첫 줄에 추가하고 공식 상품 링크로 수정해 주세요.",
    noticeStatus: "발송 대기",
    processingState: "처리 중",
    accumulatedPenalties: 2,
  },
  {
    id: "vr-003",
    cohort: "2기",
    selectorName: "이지아",
    contentId: "ct-004",
    violationType: "허위·과장 표현",
    noticeText: "최저가를 단정하는 표현을 삭제한 수정본을 제출해 주세요.",
    noticeStatus: "발송 완료",
    processingState: "처리 완료",
    accumulatedPenalties: 3,
  },
];

export function findContentReviewFixture(contentId: string | undefined) {
  return CONTENT_REVIEWS.find((content) => content.id === contentId);
}
