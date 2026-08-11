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
  workTabSingletonId?: string;
  workTabParentPath?: string;
  workTabParentQuery?: {
    parameter: string;
    value: string;
    path: string;
  };
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
    menuLabel: "크리에이터 풀",
    title: "크리에이터 풀",
    screenCode: "CR101",
    workTabLabel: "크리에이터 풀",
  },
  {
    path: "/creators/:creatorId",
    group: "creators",
    menuLabel: "크리에이터 풀",
    title: "크리에이터 풀",
    screenCode: "CR102",
    workTabLabel: "크리에이터 상세",
    workTabParentPath: "/creators",
  },
  {
    path: "/proposals",
    group: "creators",
    menuLabel: "제안 이력",
    title: "제안 이력",
    screenCode: "CR201",
    workTabLabel: "제안 이력",
  },
  {
    path: "/proposals/new",
    group: "creators",
    menuLabel: "크리에이터 풀",
    title: "크리에이터 풀",
    screenCode: "CR202",
    workTabLabel: "제안 작성",
  },
  {
    path: "/cohorts",
    group: "selectors",
    menuLabel: "기수 관리",
    title: "기수 관리",
    screenCode: "SL101",
    workTabLabel: "기수 관리",
  },
  {
    path: "/selectors",
    group: "selectors",
    menuLabel: "셀렉터스 목록",
    title: "셀렉터스 목록",
    screenCode: "SL201",
    workTabLabel: "셀렉터스 목록",
  },
  {
    path: "/selectors/qualifications",
    group: "selectors",
    menuLabel: "블랙리스트 관리",
    title: "블랙리스트 관리",
    screenCode: "SL301",
    workTabLabel: "블랙리스트 관리",
  },
  {
    path: "/selectors/:selectorId",
    group: "selectors",
    menuLabel: "셀렉터스 목록",
    title: "셀렉터스 목록",
    screenCode: "SL202",
    workTabLabel: "셀렉터스 상세",
    workTabParentPath: "/selectors",
    workTabParentQuery: {
      parameter: "from",
      value: "qualifications",
      path: "/selectors/qualifications",
    },
  },
  {
    path: "/applicants",
    group: "applicants",
    menuLabel: "지원자 승인",
    title: "지원자 승인",
    screenCode: "AP101",
    workTabLabel: "지원자 심사",
  },
  {
    path: "/applicants/:applicantId",
    group: "applicants",
    menuLabel: "지원자 승인",
    title: "지원자 승인",
    screenCode: "AP102",
    workTabLabel: "지원자 상세",
    workTabParentPath: "/applicants",
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
    title: "캠페인 관리",
    screenCode: "CP102",
    workTabLabel: "캠페인 생성",
    workTabParentPath: "/campaigns",
  },
  {
    path: "/campaigns/:campaignId",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP104",
    workTabLabel: "캠페인 상세",
    workTabParentPath: "/campaigns",
  },
  {
    path: "/campaigns/:campaignId/edit",
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP103",
    workTabLabel: "캠페인 수정",
    workTabParentPath: "/campaigns",
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
    title: "콘텐츠 검수",
    screenCode: "CT102",
    workTabLabel: "검수 상세",
    workTabSingletonId: "content-review-detail",
  },
  {
    path: "/performance/selectors",
    group: "performance",
    menuLabel: "셀렉터스 성과",
    title: "셀렉터스 성과",
    screenCode: "PF201",
    workTabLabel: "셀렉터스 성과",
  },
  {
    path: "/performance/contents",
    group: "performance",
    menuLabel: "콘텐츠 성과",
    title: "콘텐츠 성과",
    screenCode: "PF202",
    workTabLabel: "콘텐츠 성과",
  },
  {
    path: "/performance/products",
    group: "performance",
    menuLabel: "캠페인 성과",
    title: "캠페인 성과",
    screenCode: "PF203",
    workTabLabel: "캠페인 성과",
  },
  {
    path: "/settlements",
    group: "settlements",
    menuLabel: "정산 관리",
    title: "정산 관리",
    screenCode: "ST101",
    workTabLabel: "정산 관리",
  },
];

export const DEFAULT_ADMIN_ROUTE = ADMIN_ROUTES.find(
  (route) => route.path === "/creators",
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
