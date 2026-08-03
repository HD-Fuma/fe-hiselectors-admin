export type RequirementPrimaryRole =
  | { role: "main"; name?: never }
  | { role: "heading"; name: string };

export interface AdminRequirementCoverageCase {
  route: string;
  rows: readonly number[];
  expectedTexts: readonly string[];
  expectedActions: readonly string[];
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
    expectedTexts: [
      "키워드",
      "카테고리",
      "티어",
      "플랫폼",
      "이름",
      "팔로워·구독자",
      "콘텐츠 수",
      "최근 활동일",
    ],
    expectedActions: ["조회", "초기화"],
    primaryRole: { role: "heading", name: "크리에이터 풀" },
  },
  {
    route: "/creators/cr-001",
    rows: [5, 6, 7, 8],
    expectedTexts: [
      "기본 정보",
      "AI 적합도",
      "근거 지표",
      "Instagram DM",
      "Meta 정책상 자동 선접촉이 불가합니다. 관리자 확인 후 수동 발송이 필요합니다.",
      "이메일",
    ],
    expectedActions: ["Instagram DM 제안 발송", "이메일 제안 발송"],
    primaryRole: { role: "heading", name: "크리에이터 상세" },
  },
  {
    route: "/proposals",
    rows: [9, 10],
    expectedTexts: ["대상", "채널", "발송 방식", "발송 시각", "상태"],
    expectedActions: ["조회", "초기화"],
    primaryRole: { role: "heading", name: "제안 이력 관리" },
  },
  {
    route: "/cohorts",
    rows: [11],
    expectedTexts: ["기수명", "모집 기간", "활동 기간", "모집 상태", "참여자 수"],
    expectedActions: ["기수 생성"],
    primaryRole: { role: "heading", name: "셀렉터스 기수 관리" },
  },
  {
    route: "/selectors",
    rows: [12],
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
    primaryRole: { role: "heading", name: "기수별 셀렉터스 현황" },
  },
  {
    route: "/selectors/qualifications",
    rows: [13, 14],
    expectedTexts: [
      "현재 자격",
      "누적 패널티",
      "박탈 사유",
      "차기 기수 제한",
      "변경 자격",
      "변경 사유",
    ],
    expectedActions: ["자격 변경"],
    primaryRole: { role: "heading", name: "셀렉터스 자격 관리" },
  },
  {
    route: "/applicants",
    rows: [15],
    expectedTexts: [
      "지원자 ID",
      "SNS 채널",
      "팔로워·구독자",
      "콘텐츠 수",
      "최근 활동일",
      "심사 상태",
    ],
    expectedActions: ["조회", "초기화"],
    primaryRole: { role: "heading", name: "지원자 심사" },
  },
  {
    route: "/applicants/ap-001",
    rows: [16, 17, 18, 20],
    expectedTexts: [
      "평균 조회 수",
      "평균 반응 수",
      "AI 적합도",
      "근거 지표",
      "심사 결과 전송",
      "전송 대기",
    ],
    expectedActions: ["승인", "반려", "심사 결과 전송"],
    primaryRole: { role: "heading", name: "지원자 상세 심사" },
  },
  {
    route: "/applicants/ap-003?fixture=auto-rejected",
    rows: [19],
    expectedTexts: ["자동 반려", "정량 기준 미충족", "내부 반려 사유"],
    expectedActions: ["승인", "반려"],
    primaryRole: { role: "heading", name: "지원자 상세 심사" },
  },
  {
    route: "/campaigns",
    rows: [23],
    expectedTexts: ["상태", "삭제 가능 여부", "삭제 불가 사유"],
    expectedActions: ["2026 가을 골프웨어 셀렉션 삭제"],
    primaryRole: { role: "heading", name: "캠페인 관리" },
  },
  {
    route: "/campaigns/new",
    rows: [21, 22],
    expectedTexts: ["캠페인명", "기간", "상품 선택"],
    expectedActions: ["상품 선택", "등록"],
    primaryRole: { role: "heading", name: "캠페인 등록" },
  },
  {
    route: "/campaigns/cp-001/edit",
    rows: [21, 22],
    expectedTexts: ["캠페인명", "기간", "상품 선택"],
    expectedActions: ["상품 선택", "저장"],
    primaryRole: { role: "heading", name: "캠페인 수정" },
  },
  {
    route: "/content/reviews",
    rows: [24, 25, 26],
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
    primaryRole: { role: "heading", name: "콘텐츠 검수" },
  },
  {
    route: "/content/reviews/ct-001",
    rows: [24],
    expectedTexts: [
      "검수 유형",
      "작성자",
      "기수",
      "플랫폼",
      "이전 콘텐츠",
      "현재 콘텐츠",
      "이전 스냅샷이 없습니다.",
      "<p>가을 라운딩을 위한 세인트앤드류스 패딩 팬츠를 소개합니다. 가볍고 편안한 스트레치 소재를 확인해 보세요. #현대홈쇼핑 #셀렉터스 #광고</p>",
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
    rows: [25],
    expectedTexts: [
      "위반 수정본",
      "이전 콘텐츠",
      "현재 콘텐츠",
      "<p>세인트앤드류스 신상 패딩, 지금 가장 저렴하게 구매하세요.</p>",
      "<p>유료광고를 포함한 세인트앤드류스 패딩 팬츠 후기입니다. 상품 정보는 공식 링크에서 확인해 주세요. #현대홈쇼핑 #광고</p>",
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
    rows: [26],
    expectedTexts: [
      "일반 수정본",
      "이전 콘텐츠",
      "현재 콘텐츠",
      "<p>가을 라운딩 코디로 고른 세인트앤드류스 패딩 팬츠입니다. #현대홈쇼핑 #셀렉터스 #광고</p>",
      "<p>선선한 아침 라운딩에 입어 본 세인트앤드류스 스트레치 패딩 팬츠입니다. 착용감과 사이즈 팁을 확인해 보세요. #현대홈쇼핑 #셀렉터스 #광고</p>",
      "https://www.hmall.com/event/golf",
      "3개",
      "4개",
      "AI 상태",
      "처리 상태",
    ],
    expectedActions: ["변경 승인", "수정 요청", "위반 판정"],
    primaryRole: { role: "heading", name: "콘텐츠 검수 상세" },
  },
  {
    route: "/content/violations",
    rows: [27, 28, 29],
    expectedTexts: [
      "기수",
      "위반 유형",
      "처리 상태",
      "안내 문구",
      "안내 상태",
      "누적 패널티",
    ],
    expectedActions: ["김서연 위반사항 안내", "김서연 패널티 부여"],
    primaryRole: { role: "heading", name: "위반 콘텐츠 관리" },
  },
  {
    route: "/performance",
    rows: [30],
    expectedTexts: ["캠페인명", "셀렉터스", "클릭 수", "구매 전환 수", "전환율"],
    expectedActions: ["조회", "초기화"],
    primaryRole: { role: "heading", name: "관리자 성과 대시보드" },
  },
  {
    route: "/performance/creators",
    rows: [31],
    expectedTexts: ["구매 전환 수", "조회 수", "좋아요", "댓글"],
    expectedActions: ["조회", "초기화"],
    primaryRole: { role: "heading", name: "크리에이터 영향력 분석" },
  },
  {
    route: "/performance/contents",
    rows: [32],
    expectedTexts: ["구매 전환 수", "조회 수", "좋아요", "댓글"],
    expectedActions: ["조회", "초기화"],
    primaryRole: { role: "heading", name: "콘텐츠 영향력 분석" },
  },
  {
    route: "/settlements",
    rows: [33, 34, 35],
    expectedTexts: [
      "귀속월",
      "셀렉터스",
      "예상액",
      "확정액",
      "수정 가능 여부",
      "확정 상태",
      "지급 상태",
    ],
    expectedActions: ["김서연 지급액 수정", "김서연 지급 확정"],
    primaryRole: { role: "heading", name: "정산 지급 관리" },
  },
  {
    route: "/system/notices",
    rows: [36],
    expectedTexts: ["제목", "대상", "게시 기간", "게시 상태", "작성자", "수정일"],
    expectedActions: [
      "신규 작성",
      "8월 셀렉터스 활동 안내 수정",
      "8월 셀렉터스 활동 안내 삭제",
    ],
    primaryRole: { role: "heading", name: "공지사항 관리" },
  },
] as const satisfies readonly AdminRequirementCoverageCase[];

function canonicalRequirementRoute(route: string) {
  const [pathname, rawSearch = ""] = route.split("?", 2);
  const search = new URLSearchParams(rawSearch);
  search.sort();
  const query = search.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function findRequirementCoverage(pathname: string, search = "") {
  const route = canonicalRequirementRoute(`${pathname}${search}`);
  const exactMatch = ADMIN_REQUIREMENT_COVERAGE.find(
    (item) => canonicalRequirementRoute(item.route) === route,
  );

  if (exactMatch) return exactMatch;

  return ADMIN_REQUIREMENT_COVERAGE.find(
    (item) => !item.route.includes("?") && item.route === pathname,
  );
}
