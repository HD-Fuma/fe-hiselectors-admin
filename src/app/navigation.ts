import { matchPath } from "react-router-dom";

export type NavGroup =
  | "creators"
  | "selectors"
  | "applicants"
  | "campaigns"
  | "content"
  | "performance"
  | "settlements";

export interface AdminRouteMeta {
  path: string;
  group: NavGroup;
  menuLabel: string;
  title: string;
  screenCode: string;
  workTabLabel: string;
}

export interface NavGroupMeta {
  id: NavGroup;
  label: string;
}

export const NAV_GROUPS: readonly NavGroupMeta[] = [
  { id: "creators", label: "크리에이터" },
  { id: "selectors", label: "셀렉터스" },
  { id: "applicants", label: "지원자" },
  { id: "campaigns", label: "캠페인" },
  { id: "content", label: "콘텐츠" },
  { id: "performance", label: "성과" },
  { id: "settlements", label: "정산" },
];

export const ADMIN_ROUTES: readonly AdminRouteMeta[] = [
  {
    path: "/creators",
    group: "creators",
    menuLabel: "크리에이터 목록",
    title: "크리에이터 풀",
    screenCode: "CR101",
    workTabLabel: "크리에이터 풀",
  },
  {
    path: "/creators/:creatorId",
    group: "creators",
    menuLabel: "크리에이터 목록",
    title: "크리에이터 상세",
    screenCode: "CR102",
    workTabLabel: "크리에이터 상세",
  },
  {
    path: "/proposals",
    group: "creators",
    menuLabel: "제안 이력",
    title: "제안 이력 관리",
    screenCode: "CR201",
    workTabLabel: "제안 이력",
  },
  {
    path: "/proposals/new",
    group: "creators",
    menuLabel: "제안 이력",
    title: "크리에이터 제안 작성",
    screenCode: "CR202",
    workTabLabel: "제안 작성",
  },
  {
    path: "/cohorts",
    group: "selectors",
    menuLabel: "기수 관리",
    title: "셀렉터스 기수 관리",
    screenCode: "SL101",
    workTabLabel: "기수 관리",
  },
  {
    path: "/selectors",
    group: "selectors",
    menuLabel: "셀렉터스 현황",
    title: "기수별 셀렉터스 현황",
    screenCode: "SL201",
    workTabLabel: "셀렉터스 현황",
  },
  {
    path: "/selectors/qualifications",
    group: "selectors",
    menuLabel: "자격 관리",
    title: "셀렉터스 자격 관리",
    screenCode: "SL301",
    workTabLabel: "자격 관리",
  },
  {
    path: "/selectors/:selectorId",
    group: "selectors",
    menuLabel: "셀렉터스 현황",
    title: "셀렉터스 상세",
    screenCode: "SL202",
    workTabLabel: "셀렉터스 상세",
  },
  {
    path: "/applicants",
    group: "applicants",
    menuLabel: "지원자 목록",
    title: "지원자 심사",
    screenCode: "AP101",
    workTabLabel: "지원자 심사",
  },
  {
    path: "/applicants/:applicantId",
    group: "applicants",
    menuLabel: "지원자 목록",
    title: "지원자 상세 심사",
    screenCode: "AP102",
    workTabLabel: "지원자 상세",
  },
  {
    path: "/campaigns",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP101",
    workTabLabel: "캠페인 관리",
  },
  {
    path: "/campaigns/new",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 등록",
    screenCode: "CP102",
    workTabLabel: "캠페인 등록",
  },
  {
    path: "/campaigns/:campaignId/edit",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 수정",
    screenCode: "CP103",
    workTabLabel: "캠페인 수정",
  },
  {
    path: "/content/reviews",
    group: "content",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수",
    screenCode: "CT101",
    workTabLabel: "콘텐츠 검수",
  },
  {
    path: "/content/reviews/:contentId",
    group: "content",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수 상세",
    screenCode: "CT102",
    workTabLabel: "검수 상세",
  },
  {
    path: "/content/violations",
    group: "content",
    menuLabel: "위반 관리",
    title: "위반 콘텐츠 관리",
    screenCode: "CT201",
    workTabLabel: "위반 관리",
  },
  {
    path: "/performance",
    group: "performance",
    menuLabel: "성과 대시보드",
    title: "관리자 성과 대시보드",
    screenCode: "PF101",
    workTabLabel: "성과 대시보드",
  },
  {
    path: "/performance/creators",
    group: "performance",
    menuLabel: "크리에이터 분석",
    title: "크리에이터 영향력 분석",
    screenCode: "PF201",
    workTabLabel: "크리에이터 분석",
  },
  {
    path: "/performance/contents",
    group: "performance",
    menuLabel: "콘텐츠 분석",
    title: "콘텐츠 영향력 분석",
    screenCode: "PF202",
    workTabLabel: "콘텐츠 분석",
  },
  {
    path: "/settlements",
    group: "settlements",
    menuLabel: "정산 관리",
    title: "정산 지급 관리",
    screenCode: "ST101",
    workTabLabel: "정산 관리",
  },
];

export const DEFAULT_ADMIN_ROUTE = ADMIN_ROUTES.find(
  (route) => route.path === "/performance",
) ?? ADMIN_ROUTES[0];

export function findAdminRoute(pathname: string) {
  return ADMIN_ROUTES.find((route) => matchPath({ path: route.path, end: true }, pathname));
}

export function getGroupMenuItems(group: NavGroup) {
  const labels = new Set<string>();

  return ADMIN_ROUTES.filter((route) => {
    if (route.group !== group || labels.has(route.menuLabel)) {
      return false;
    }

    labels.add(route.menuLabel);
    return true;
  });
}
