import type { NonEmptyReadonlyArray } from "./requirementRows";

export { findRequirementCoverage } from "./requirementRows";

export type RequirementPrimaryRole =
  | { role: "main"; name?: never }
  | { role: "heading"; name: string };

export type RequirementControlRole = "checkbox" | "combobox" | "textbox";

export interface RequirementControlExpectation {
  name: string;
  role?: RequirementControlRole;
}

export interface RequirementTableExpectation {
  region: string;
  columns: NonEmptyReadonlyArray<string>;
}

export interface AdminRequirementCoverageCase {
  route: string;
  rows: NonEmptyReadonlyArray<number>;
  expectedTexts: NonEmptyReadonlyArray<string>;
  expectedActions: NonEmptyReadonlyArray<string>;
  expectedControls?: NonEmptyReadonlyArray<RequirementControlExpectation>;
  expectedTables?: NonEmptyReadonlyArray<RequirementTableExpectation>;
  primaryRole: RequirementPrimaryRole;
}

export const ADMIN_REQUIREMENT_COVERAGE = [
  {
    route: "/login",
    rows: [2],
    expectedTexts: ["ID를 입력하세요.", "비밀번호를 입력하세요.", "아이디 저장"],
    expectedActions: ["로그인"],
    primaryRole: { role: "main" },
  },
  {
    route: "/creators",
    rows: [3, 4],
    expectedTexts: ["김서연", "#데일리룩", "팔로워", "ER"],
    expectedActions: ["조회", "초기화"],
    expectedControls: [
      { role: "textbox", name: "키워드" },
      { role: "textbox", name: "최소 팔로워·구독자" },
      { role: "textbox", name: "최대 팔로워·구독자" },
      { role: "combobox", name: "플랫폼" },
    ],
    primaryRole: { role: "heading", name: "크리에이터 풀" },
  },
  {
    route: "/creators/cr-001",
    rows: [5, 6, 7],
    expectedTexts: [
      "기본 정보",
      "크리에이터 분석",
      "정량 분석",
      "ER (Engagement Rate)",
      "크리에이터 풀 TopN 선정",
      "Instagram DM",
      "Meta 정책상 자동 선접촉이 불가합니다. 관리자 확인 후 수동 발송이 필요합니다.",
      "이메일",
    ],
    expectedActions: ["Instagram DM 제안 발송", "이메일 제안 발송"],
    primaryRole: { role: "heading", name: "크리에이터 상세" },
  },
  {
    route: "/proposals",
    rows: [8],
    expectedTexts: ["대상", "채널", "발송 방식", "발송 시각", "상태"],
    expectedActions: ["조회", "초기화"],
    expectedControls: [
      { role: "combobox", name: "채널" },
      { role: "combobox", name: "상태" },
    ],
    expectedTables: [
      {
        region: "제안 이력 목록",
        columns: ["대상", "채널", "발송 방식", "발송 시각", "상태"],
      },
    ],
    primaryRole: { role: "heading", name: "제안 이력 관리" },
  },
  {
    route: "/cohorts",
    rows: [14],
    expectedTexts: ["기수명", "모집 기간", "활동 기간", "모집 상태", "참여자 수"],
    expectedActions: ["기수 생성"],
    primaryRole: { role: "heading", name: "셀렉터스 기수 관리" },
  },
  {
    route: "/selectors",
    rows: [15],
    expectedTexts: [
      "SNS",
      "활동 상태",
      "콘텐츠 수",
      "위반 횟수",
      "클릭",
      "전환",
      "최근 활동일",
    ],
    expectedActions: ["조회", "초기화"],
    expectedControls: [
      { role: "textbox", name: "셀렉터스명" },
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "활동 상태" },
    ],
    expectedTables: [
      {
        region: "셀렉터스 목록",
        columns: ["SNS", "활동 상태", "콘텐츠 수", "위반 횟수", "클릭", "전환"],
      },
    ],
    primaryRole: { role: "heading", name: "기수별 셀렉터스 현황" },
  },
  {
    route: "/selectors/qualifications",
    rows: [17],
    expectedTexts: [
      "현재 자격",
      "누적 패널티",
      "박탈 사유",
      "차기 기수 제한",
      "변경 자격",
      "변경 사유",
    ],
    expectedActions: ["자격 변경"],
    primaryRole: { role: "heading", name: "블랙리스트 관리" },
  },
  {
    route: "/selectors/sl-001",
    rows: [16],
    expectedTexts: ["셀렉터스 정보", "SNS 채널", "콘텐츠 수", "최근 활동일", "구매 전환 수"],
    expectedActions: ["새로고침"],
    primaryRole: { role: "heading", name: "셀렉터스 상세" },
  },
  {
    route: "/applicants",
    rows: [9],
    expectedTexts: [
      "지원자 ID",
      "SNS 채널",
      "팔로워·구독자",
      "콘텐츠 수",
      "최근 활동일",
      "심사 상태",
    ],
    expectedActions: ["조회", "초기화"],
    expectedControls: [
      { role: "textbox", name: "검색어" },
      { role: "combobox", name: "SNS 채널" },
      { role: "combobox", name: "심사 상태" },
      { role: "combobox", name: "자동 반려" },
      { role: "combobox", name: "결과 전송" },
    ],
    expectedTables: [
      {
        region: "지원자 승인",
        columns: [
          "지원자 ID",
          "SNS 채널",
          "팔로워·구독자",
          "콘텐츠 수",
          "최근 활동일",
          "심사 상태",
        ],
      },
    ],
    primaryRole: { role: "heading", name: "지원자 심사" },
  },
  {
    route: "/applicants/ap-001",
    rows: [10, 11, 12, 13],
    expectedTexts: [
      "평균 조회 수",
      "평균 반응 수",
      "대표 콘텐츠",
      "지원자 분석 리포트",
      "ER (Engagement Rate)",
      "협업 브랜드",
      "심사 결과 전송",
      "전송 대기",
    ],
    expectedActions: ["승인", "반려", "심사 결과 전송"],
    primaryRole: { role: "heading", name: "지원자 상세 심사" },
  },
  {
    route: "/applicants/ap-003?fixture=auto-rejected",
    rows: [12],
    expectedTexts: ["자동 반려", "정량 기준 미충족", "내부 반려 사유"],
    expectedActions: ["승인", "반려"],
    primaryRole: { role: "heading", name: "지원자 상세 심사" },
  },
  {
    route: "/campaigns",
    rows: [18, 19, 20],
    expectedTexts: ["상태", "삭제 가능 여부", "삭제 불가 사유"],
    expectedActions: ["2026 가을 골프웨어 셀렉션 삭제"],
    primaryRole: { role: "heading", name: "캠페인 관리" },
  },
  {
    route: "/campaigns/new",
    rows: [18],
    expectedTexts: ["캠페인명", "기간", "상품 선택"],
    expectedActions: ["상품 선택", "등록"],
    primaryRole: { role: "heading", name: "캠페인 등록" },
  },
  {
    route: "/campaigns/cp-001/edit",
    rows: [19],
    expectedTexts: ["캠페인명", "기간", "상품 선택"],
    expectedActions: ["상품 선택", "저장"],
    primaryRole: { role: "heading", name: "캠페인 수정" },
  },
  {
    route: "/content/reviews",
    rows: [21, 22],
    expectedTexts: [
      "검수 유형",
      "작성자",
      "기수",
      "플랫폼",
      "AI 상태",
      "검수 상태",
      "처리 상태",
    ],
    expectedActions: ["선택 콘텐츠 검수"],
    expectedControls: [
      { role: "textbox", name: "콘텐츠/작성자" },
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "검수 유형" },
      { role: "combobox", name: "플랫폼" },
      { role: "combobox", name: "검수 상태" },
      { role: "combobox", name: "위반 필터" },
      { role: "combobox", name: "처리 상태" },
    ],
    expectedTables: [
      {
        region: "콘텐츠 검수 대기열",
        columns: [
          "검수 유형",
          "작성자",
          "기수",
          "플랫폼",
          "AI 상태",
          "검수 상태",
          "처리 상태",
        ],
      },
    ],
    primaryRole: { role: "heading", name: "콘텐츠 검수" },
  },
  {
    route: "/content/reviews/ct-001",
    rows: [21],
    expectedTexts: [
      "검수 유형",
      "작성자",
      "기수",
      "플랫폼",
      "현재 콘텐츠",
      "가을 라운딩을 위한 세인트앤드류스 패딩 팬츠를 소개합니다. 가볍고 편안한 스트레치 소재를 확인해 보세요. #현대홈쇼핑 #셀렉터스 #광고",
      "https://www.hmall.com/p/2200098405",
      "4개",
      "AI 상태",
      "처리 상태",
    ],
    expectedActions: ["검수 완료", "수정 요청", "위반 판정"],
    primaryRole: { role: "heading", name: "콘텐츠 검수 상세" },
  },
  {
    route: "/content/reviews/ct-002?fixture=violation-correction",
    rows: [22],
    expectedTexts: [
      "위반 수정본",
      "이전 콘텐츠",
      "현재 콘텐츠",
      "세인트앤드류스 신상 패딩, 지금 가장 저렴하게 구매하세요.",
      "유료광고를 포함한 세인트앤드류스 패딩 팬츠 후기입니다. 상품 정보는 공식 링크에서 확인해 주세요. #현대홈쇼핑 #광고",
      "https://short.example/golf",
      "https://www.hmall.com/p/2200098405?ref=old",
      "5개",
      "4개",
      "AI 상태",
      "처리 상태",
    ],
    expectedActions: ["위반 해제", "재수정 요청", "위반 유지"],
    primaryRole: { role: "heading", name: "콘텐츠 검수 상세" },
  },
  {
    route: "/content/reviews/ct-003?fixture=edited",
    rows: [22],
    expectedTexts: [
      "일반 수정본",
      "이전 콘텐츠",
      "현재 콘텐츠",
      "가을 라운딩 코디로 고른 세인트앤드류스 패딩 팬츠입니다. #현대홈쇼핑 #셀렉터스 #광고",
      "선선한 아침 라운딩에 입어 본 세인트앤드류스 스트레치 패딩 팬츠입니다. 착용감과 사이즈 팁을 확인해 보세요. #현대홈쇼핑 #셀렉터스 #광고",
      "https://www.hmall.com/event/golf",
      "AI 상태",
      "처리 상태",
    ],
    expectedActions: ["변경 승인", "수정 요청", "위반 판정"],
    primaryRole: { role: "heading", name: "콘텐츠 검수 상세" },
  },
  {
    route: "/performance",
    rows: [25],
    expectedTexts: ["캠페인명", "셀렉터스", "클릭 수", "구매 전환 수", "전환율"],
    expectedActions: ["조회", "초기화"],
    expectedControls: [
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "캠페인" },
      { name: "집계 시작일" },
      { name: "집계 종료일" },
    ],
    expectedTables: [
      {
        region: "캠페인별 성과",
        columns: ["캠페인명", "클릭 수", "구매 전환 수", "전환율"],
      },
      {
        region: "셀렉터스별 성과",
        columns: ["셀렉터스", "클릭 수", "구매 전환 수", "전환율"],
      },
    ],
    primaryRole: { role: "heading", name: "관리자 성과 대시보드" },
  },
  {
    route: "/performance/creators",
    rows: [26],
    expectedTexts: ["구매 전환 수", "조회 수", "좋아요", "댓글"],
    expectedActions: ["조회", "초기화"],
    expectedControls: [
      { role: "textbox", name: "크리에이터명" },
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "캠페인" },
    ],
    expectedTables: [
      {
        region: "크리에이터 영향력",
        columns: ["구매 전환 수", "조회 수", "좋아요", "댓글"],
      },
    ],
    primaryRole: { role: "heading", name: "크리에이터 영향력 분석" },
  },
  {
    route: "/performance/contents",
    rows: [27],
    expectedTexts: ["구매 전환 수", "조회 수", "좋아요", "댓글"],
    expectedActions: ["조회", "초기화"],
    expectedControls: [
      { role: "textbox", name: "콘텐츠/작성자" },
      { role: "combobox", name: "기수" },
      { role: "combobox", name: "캠페인" },
    ],
    expectedTables: [
      {
        region: "콘텐츠 영향력",
        columns: ["구매 전환 수", "조회 수", "좋아요", "댓글"],
      },
    ],
    primaryRole: { role: "heading", name: "콘텐츠 영향력 분석" },
  },
  {
    route: "/settlements",
    rows: [28],
    expectedTexts: [
      "귀속월",
      "셀렉터스",
      "예상액",
      "확정액",
      "확정 상태",
      "지급 상태",
    ],
    expectedActions: ["조회", "초기화"],
    expectedControls: [
      { name: "귀속월" },
      { role: "textbox", name: "셀렉터스" },
      { role: "combobox", name: "확정 상태" },
      { role: "combobox", name: "지급 상태" },
    ],
    expectedTables: [
      {
        region: "정산 지급 목록",
        columns: [
          "귀속월",
          "셀렉터스",
          "예상액",
          "확정액",
          "확정 상태",
          "지급 상태",
        ],
      },
    ],
    primaryRole: { role: "heading", name: "정산 지급 관리" },
  },
] as const satisfies readonly AdminRequirementCoverageCase[];
