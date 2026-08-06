export type ReviewType = "NEW" | "VIOLATION_CORRECTION" | "EDITED";
export type ReviewStatus = "검수 대기" | "수정 요청" | "승인" | "위반 확정";
export type ProcessingState = "미처리" | "안내 대기" | "처리 완료";

export type ContentAnnotationTarget =
  | {
      kind: "media";
      mediaIndex: number;
      box: { x: number; y: number; width: number; height: number };
    }
  | {
      kind: "text";
      quote: string;
      occurrence: number;
    }
  | {
      kind: "url";
      targetIndex: number;
    };

export interface ContentAnnotation {
  id: string;
  target: ContentAnnotationTarget;
  title: string;
  reason: string;
  location: string;
  guidance: string;
  source: "자동 감지" | "운영자";
  severity: "warning" | "critical";
  state: "active" | "resolved";
}

export interface ContentSnapshot {
  label: string;
  text: string;
  urls: string[];
  mediaCount: number;
  mediaKinds: string[];
  mediaUrls: string[];
  capturedAt: string;
  annotations?: ContentAnnotation[];
}

export type ReviewSignalTone = "pass" | "warning" | "critical";

export interface ContentReviewSignal {
  title: string;
  detail: string;
  source: string;
  evidence: string;
  tone: ReviewSignalTone;
}

export interface ContentReviewExtract {
  type: "OCR" | "STT";
  text: string;
  location: string;
}

export interface ContentReviewHistoryItem {
  at: string;
  label: string;
  actor: string;
}

export interface ContentReviewReport {
  generatedAt: string;
  signals: ContentReviewSignal[];
  extracts: ContentReviewExtract[];
  history: ContentReviewHistoryItem[];
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
  report: ContentReviewReport;
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
      mediaUrls: [
        "/creator-media/kr-cr-001-01.jpg",
        "/creator-media/kr-cr-001-02.jpg",
        "/creator-media/kr-cr-001-03.jpg",
      ],
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
    report: {
      generatedAt: "2026-08-03 10:44",
      signals: [
        {
          title: "광고 표시",
          detail: "본문에서 필수 광고 표기를 확인했습니다.",
          source: "본문",
          evidence: "#광고",
          tone: "pass",
        },
        {
          title: "상품·링크 일치",
          detail: "소개 상품과 공식 Hmall 상품 링크가 일치합니다.",
          source: "본문 · URL",
          evidence: "세인트앤드류스 패딩 팬츠 · hmall.com",
          tone: "pass",
        },
        {
          title: "안전성",
          detail: "욕설, 폭력성, 음란 표현이 감지되지 않았습니다.",
          source: "본문 · 이미지 분석",
          evidence: "감지 항목 없음",
          tone: "pass",
        },
        {
          title: "음성 검사",
          detail: "이미지 게시물로 음성 트랙이 없어 STT 검사 대상이 아닙니다.",
          source: "미디어 메타데이터",
          evidence: "이미지 4개 · 음성 트랙 없음",
          tone: "pass",
        },
      ],
      extracts: [
        {
          type: "OCR",
          text: "이미지에서 추출된 문구 없음",
          location: "이미지 1~4 · 전체",
        },
      ],
      history: [
        { at: "2026-08-03 10:40", label: "원본 수집", actor: "수집 시스템" },
        { at: "2026-08-03 10:42", label: "검수 접수", actor: "김서연" },
        { at: "2026-08-03 10:44", label: "자동 검수 완료", actor: "검수 시스템" },
      ],
    },
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
      mediaUrls: [
        "/creator-media/kr-cr-002-01.jpg",
        "/creator-media/kr-cr-002-02.jpg",
        "/creator-media/kr-cr-002-03.jpg",
      ],
      annotations: [
        {
          id: "ct-002-media-ocr",
          target: {
            kind: "media",
            mediaIndex: 0,
            box: { x: 38, y: 58, width: 30, height: 24 },
          },
          title: "캠페인 상품 불일치",
          reason: "패딩 팬츠 콘텐츠와 관련 없는 음식 이미지가 포함되어 있습니다.",
          location: "이미지 1 중앙 하단",
          guidance: "캠페인 상품 착용 이미지로 교체해 주세요.",
          source: "자동 감지",
          severity: "critical",
          state: "active",
        },
        {
          id: "ct-002-caption-claim",
          target: {
            kind: "text",
            quote: "지금 가장 저렴하게",
            occurrence: 1,
          },
          title: "본문 과장 표현",
          reason: "비교 근거 없이 최저가를 단정하는 표현이 포함되어 있습니다.",
          location: "게시물 본문",
          guidance: "‘혜택을 확인해 보세요’처럼 검증 가능한 표현으로 수정해 주세요.",
          source: "자동 감지",
          severity: "critical",
          state: "active",
        },
        {
          id: "ct-002-short-url",
          target: {
            kind: "url",
            targetIndex: 0,
          },
          title: "비공식 단축 URL",
          reason: "연결 목적지를 바로 확인할 수 없는 단축 URL이 포함되어 있습니다.",
          location: "연결 URL 1",
          guidance: "Hmall 공식 상품 URL로 교체해 주세요.",
          source: "자동 감지",
          severity: "warning",
          state: "active",
        },
      ],
    },
    currentSnapshot: {
      label: "위반 후 수정본",
      capturedAt: "2026-08-03 09:40",
      text: "유료광고를 포함한 세인트앤드류스 패딩 팬츠 후기입니다. 상품 정보는 공식 링크에서 확인해 주세요. #현대홈쇼핑 #광고",
      urls: ["https://www.hmall.com/p/2200098405"],
      mediaCount: 4,
      mediaKinds: ["이미지", "이미지", "이미지", "이미지"],
      mediaUrls: [
        "/creator-media/kr-cr-001-01.jpg",
        "/creator-media/kr-cr-001-02.jpg",
        "/creator-media/kr-cr-001-03.jpg",
      ],
      annotations: [
        {
          id: "ct-002-ad-disclosure-resolved",
          target: {
            kind: "text",
            quote: "유료광고를 포함한",
            occurrence: 1,
          },
          title: "광고 표시 보완",
          reason: "직전 판정본에서 누락되었던 광고 표시가 현재 본문에 추가되었습니다.",
          location: "게시물 본문 첫 문장",
          guidance: "현재 광고 표시 문구를 유지해 주세요.",
          source: "자동 감지",
          severity: "warning",
          state: "resolved",
        },
      ],
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
    report: {
      generatedAt: "2026-08-03 09:47",
      signals: [
        {
          title: "광고 표시 보완",
          detail: "직전 판정본에는 광고 표기가 없었고 수정본에는 표기가 추가되었습니다.",
          source: "본문 비교",
          evidence: "표기 없음 → ‘유료광고를 포함한’",
          tone: "pass",
        },
        {
          title: "공식 링크로 교체",
          detail: "비공식 단축 URL이 삭제되고 공식 상품 링크만 남았습니다.",
          source: "URL 비교",
          evidence: "short.example/golf 삭제",
          tone: "pass",
        },
        {
          title: "과장 표현 삭제",
          detail: "최저가를 단정한 문구가 수정본에서 삭제되었습니다.",
          source: "본문 · STT 비교",
          evidence: "‘지금 가장 저렴하게’ 삭제",
          tone: "pass",
        },
        {
          title: "수정본 안전성",
          detail: "수정본에서 욕설, 폭력성, 음란 표현이 감지되지 않았습니다.",
          source: "본문 · 이미지 분석",
          evidence: "감지 항목 없음",
          tone: "pass",
        },
      ],
      extracts: [
        {
          type: "OCR",
          text: "지금 가장 저렴하게",
          location: "직전 판정본 · 이미지 1 중앙",
        },
        {
          type: "OCR",
          text: "유료광고 포함",
          location: "수정본 · 이미지 1 좌측 상단",
        },
        {
          type: "STT",
          text: "오늘 소개할 패딩 팬츠는 세인트앤드류스 신상입니다. 착용감과 사이즈를 차례로 보여드릴게요.",
          location: "직전 판정본 · 00:08–00:17",
        },
        {
          type: "STT",
          text: "상품 정보와 구매 링크는 영상 설명란에서 확인해 주세요.",
          location: "직전 판정본 · 00:42–00:50",
        },
      ],
      history: [
        { at: "2026-08-01 14:30", label: "원본 수집", actor: "수집 시스템" },
        { at: "2026-08-01 14:32", label: "위반 자동 감지", actor: "검수 시스템" },
        { at: "2026-08-01 15:10", label: "위반 확정", actor: "콘텐츠 운영자" },
        { at: "2026-08-03 09:45", label: "수정본 접수", actor: "박도윤" },
        { at: "2026-08-03 09:47", label: "재검수 완료", actor: "검수 시스템" },
      ],
    },
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
      mediaUrls: [
        "/creator-media/kr-cr-003-01.jpg",
        "/creator-media/kr-cr-003-02.jpg",
      ],
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
      mediaUrls: [
        "/creator-media/kr-cr-003-01.jpg",
        "/creator-media/kr-cr-003-02.jpg",
        "/creator-media/kr-cr-003-03.jpg",
      ],
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
    report: {
      generatedAt: "2026-08-03 16:27",
      signals: [
        {
          title: "변경 감지",
          detail: "본문, URL, 이미지 변경을 감지했으며 정책 위반은 없습니다.",
          source: "이전·현재 버전 비교",
          evidence: "본문 수정 · URL 1개 추가 · 이미지 1개 추가",
          tone: "pass",
        },
        {
          title: "광고 표시 유지",
          detail: "수정 후에도 필수 광고 및 캠페인 해시태그가 유지되었습니다.",
          source: "본문 비교",
          evidence: "#현대홈쇼핑 #셀렉터스 #광고",
          tone: "pass",
        },
        {
          title: "링크 안전성",
          detail: "추가된 이벤트 URL을 포함해 모든 링크가 공식 Hmall 도메인입니다.",
          source: "URL 검사",
          evidence: "hmall.com/p · hmall.com/event/golf",
          tone: "pass",
        },
        {
          title: "안전성",
          detail: "욕설, 폭력성, 음란 표현이 감지되지 않았습니다.",
          source: "본문 · 이미지 분석",
          evidence: "감지 항목 없음",
          tone: "pass",
        },
      ],
      extracts: [
        {
          type: "OCR",
          text: "ST.ANDREWS · Stretch padded pants",
          location: "이미지 1 · 하단",
        },
        {
          type: "OCR",
          text: "사이즈 팁은 본문에서 확인",
          location: "이미지 4 · 우측 하단",
        },
      ],
      history: [
        { at: "2026-08-02 12:18", label: "직전 버전 승인", actor: "콘텐츠 운영자" },
        { at: "2026-08-03 16:22", label: "수정 감지", actor: "수집 시스템" },
        { at: "2026-08-03 16:25", label: "재검수 접수", actor: "검수 시스템" },
        { at: "2026-08-03 16:27", label: "자동 검수 완료", actor: "검수 시스템" },
      ],
    },
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
