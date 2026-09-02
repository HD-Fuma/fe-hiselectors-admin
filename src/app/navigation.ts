import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type {
  AdminNavigation,
  AdminRouteMeta,
  NavGroupMeta,
} from "../components/shell/navigationModel";

interface AdminRouteManifestEntry extends AdminRouteMeta {
  Component: LazyExoticComponent<ComponentType>;
}

function lazyPage(loader: () => Promise<ComponentType>) {
  return lazy(async () => ({ default: await loader() }));
}

const DashboardPage = lazyPage(() =>
  import("../features/dashboard/DashboardPage").then((module) => module.DashboardPage),
);
const CreatorListPage = lazyPage(() =>
  import("../features/creators/CreatorPages").then((module) => module.CreatorListPage),
);
const CreatorTestPage = lazyPage(() =>
  import("../features/creators/CreatorPages").then((module) => module.CreatorTestPage),
);
const ProposalHistoryPage = lazyPage(() =>
  import("../features/creators/CreatorPages").then((module) => module.ProposalHistoryPage),
);
const SelectorOverviewPage = lazyPage(() =>
  import("../features/selectors/SelectorPages").then((module) => module.SelectorOverviewPage),
);
const SelectorDetailPage = lazyPage(() =>
  import("../features/selectors/SelectorPages").then((module) => module.SelectorDetailPage),
);
const CohortManagementPage = lazyPage(() =>
  import("../features/selectors/SelectorPages").then((module) => module.CohortManagementPage),
);
const ApplicantListPage = lazyPage(() =>
  import("../features/applicants/ApplicantPages").then((module) => module.ApplicantListPage),
);
const ApplicantTestPage = lazyPage(() =>
  import("../features/applicants/ApplicantPages").then((module) => module.ApplicantTestPage),
);
const ApplicantDetailPage = lazyPage(() =>
  import("../features/applicants/ApplicantPages").then((module) => module.ApplicantDetailPage),
);
const CampaignWorkspacePage = lazyPage(() =>
  import("../features/campaigns/CampaignPages").then((module) => module.CampaignWorkspacePage),
);
const ContentInspectionListPage = lazyPage(() =>
  import("../features/content/ContentPages").then((module) => module.ContentInspectionListPage),
);
const ContentInspectionDetailPage = lazyPage(() =>
  import("../features/content/ContentPages").then((module) => module.ContentInspectionDetailPage),
);
const SelectorPerformancePage = lazyPage(() =>
  import("../features/performance/PerformancePages").then(
    (module) => module.SelectorPerformancePage,
  ),
);
const ContentPerformancePage = lazyPage(() =>
  import("../features/performance/PerformancePages").then(
    (module) => module.ContentPerformancePage,
  ),
);
const SettlementManagementPage = lazyPage(() =>
  import("../features/settlements/SettlementPages").then(
    (module) => module.SettlementManagementPage,
  ),
);
const NotificationHistoryPage = lazyPage(() =>
  import("../features/notifications/NotificationPages").then(
    (module) => module.NotificationHistoryPage,
  ),
);
const KakaoRecipientStatusPage = lazyPage(() =>
  import("../features/notifications/KakaoRecipientPages").then(
    (module) => module.KakaoRecipientStatusPage,
  ),
);
const TaskRunHistoryPage = lazyPage(() =>
  import("../features/task-runs/TaskRunHistoryPage").then(
    (module) => module.TaskRunHistoryPage,
  ),
);

const NAV_GROUPS: readonly NavGroupMeta[] = [
  { id: "dashboard", label: "대시보드" },
  { id: "recruitment", label: "모집·선발" },
  { id: "operations", label: "운영" },
  { id: "performance", label: "성과·정산" },
  { id: "notifications", label: "시스템 관리" },
];

export const ADMIN_ROUTE_MANIFEST = [
  {
    path: "/dashboard",
    Component: DashboardPage,
    group: "dashboard",
    menuLabel: "대시보드",
    menuOrder: 0,
    title: "대시보드",
    screenCode: "DB101",
    workTabLabel: "대시보드",
  },
  {
    path: "/creators",
    Component: CreatorListPage,
    group: "recruitment",
    menuLabel: "크리에이터 풀",
    menuOrder: 1,
    title: "크리에이터 풀",
    screenCode: "CR101",
    workTabLabel: "크리에이터 풀",
  },
  {
    path: "/creators/test",
    Component: CreatorTestPage,
    group: "recruitment",
    menuLabel: "크리에이터 풀",
    title: "테스트 크리에이터 풀 구축",
    screenCode: "CR102",
    workTabLabel: "테스트 크리에이터 풀 구축",
    workTabParentPath: "/creators",
  },
  {
    path: "/proposals",
    Component: ProposalHistoryPage,
    group: "recruitment",
    menuLabel: "제안 이력",
    menuOrder: 2,
    title: "제안 이력",
    screenCode: "CR201",
    workTabLabel: "제안 이력",
  },
  {
    path: "/selectors",
    Component: SelectorOverviewPage,
    group: "operations",
    menuLabel: "셀렉터스 목록",
    menuOrder: 0,
    title: "셀렉터스 목록",
    screenCode: "SL201",
    workTabLabel: "셀렉터스 목록",
  },
  {
    path: "/selectors/:selectorId",
    Component: SelectorDetailPage,
    group: "operations",
    menuLabel: "셀렉터스 목록",
    title: "셀렉터스 목록",
    screenCode: "SL202",
    workTabLabel: "셀렉터스 상세",
    workTabParentPath: "/selectors",
  },
  {
    path: "/cohorts",
    Component: CohortManagementPage,
    group: "recruitment",
    menuLabel: "기수 관리",
    menuOrder: 0,
    title: "기수 관리",
    screenCode: "SL101",
    workTabLabel: "기수 관리",
  },
  {
    path: "/applicants",
    Component: ApplicantListPage,
    group: "recruitment",
    menuLabel: "지원자 승인",
    menuOrder: 3,
    title: "지원자 승인",
    screenCode: "AP101",
    workTabLabel: "지원자 심사",
  },
  {
    path: "/applicants/test",
    Component: ApplicantTestPage,
    group: "recruitment",
    menuLabel: "지원자 승인",
    title: "테스트 지원자 등록",
    screenCode: "AP103",
    workTabLabel: "테스트 지원자 등록",
    workTabParentPath: "/applicants",
  },
  {
    path: "/applicants/:applicantId",
    Component: ApplicantDetailPage,
    group: "recruitment",
    menuLabel: "지원자 승인",
    title: "지원자 승인",
    screenCode: "AP102",
    workTabLabel: "지원자 상세",
    workTabParentPath: "/applicants",
  },
  {
    path: "/campaigns",
    Component: CampaignWorkspacePage,
    group: "operations",
    menuLabel: "캠페인 관리",
    menuOrder: 1,
    title: "캠페인 관리",
    screenCode: "CP101",
    workTabLabel: "캠페인 관리",
  },
  {
    path: "/campaigns/new",
    Component: CampaignWorkspacePage,
    group: "operations",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP102",
    workTabLabel: "캠페인 생성",
    workTabParentPath: "/campaigns",
  },
  {
    path: "/campaigns/:campaignId",
    Component: CampaignWorkspacePage,
    group: "operations",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP104",
    workTabLabel: "캠페인 상세",
    workTabParentPath: "/campaigns",
  },
  {
    path: "/campaigns/:campaignId/edit",
    Component: CampaignWorkspacePage,
    group: "operations",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP103",
    workTabLabel: "캠페인 수정",
    workTabParentPath: "/campaigns",
  },
  {
    path: "/content/inspections",
    Component: ContentInspectionListPage,
    group: "operations",
    menuLabel: "콘텐츠 검수",
    menuOrder: 2,
    title: "콘텐츠 검수",
    screenCode: "CT101",
    workTabLabel: "콘텐츠 검수",
  },
  {
    path: "/content/inspections/:contentId",
    Component: ContentInspectionDetailPage,
    group: "operations",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수",
    screenCode: "CT102",
    workTabLabel: "검수 상세",
    workTabSingletonId: "content-inspection-detail",
  },
  {
    path: "/performance/selectors",
    Component: SelectorPerformancePage,
    group: "performance",
    menuLabel: "셀렉터스 성과",
    menuOrder: 0,
    title: "셀렉터스 성과",
    screenCode: "PF201",
    workTabLabel: "셀렉터스 성과",
  },
  {
    path: "/performance/contents",
    Component: ContentPerformancePage,
    group: "performance",
    menuLabel: "콘텐츠 성과",
    menuOrder: 1,
    title: "콘텐츠 성과",
    screenCode: "PF202",
    workTabLabel: "콘텐츠 성과",
  },
  {
    path: "/settlements",
    Component: SettlementManagementPage,
    group: "performance",
    menuLabel: "정산 관리",
    menuOrder: 2,
    title: "정산 관리",
    screenCode: "ST101",
    workTabLabel: "정산 관리",
  },
  {
    path: "/notifications",
    Component: NotificationHistoryPage,
    group: "notifications",
    menuLabel: "발송 내역",
    menuOrder: 0,
    title: "알림 및 메시지",
    screenCode: "NT101",
    workTabLabel: "발송 내역",
  },
  {
    path: "/notifications/kakao-recipients",
    Component: KakaoRecipientStatusPage,
    group: "notifications",
    menuLabel: "발송 내역",
    title: "카카오 수신 현황",
    screenCode: "NT102",
    workTabLabel: "카카오 수신 현황",
  },
  {
    path: "/task-runs",
    Component: TaskRunHistoryPage,
    group: "notifications",
    menuLabel: "모니터링",
    menuOrder: 1,
    title: "모니터링",
    screenCode: "TR101",
    workTabLabel: "모니터링",
  },
] as const satisfies readonly AdminRouteManifestEntry[];

const ADMIN_ROUTES: readonly AdminRouteMeta[] = ADMIN_ROUTE_MANIFEST;
export const DEFAULT_ADMIN_ROUTE = ADMIN_ROUTE_MANIFEST[0];

export const ADMIN_NAVIGATION = {
  groups: NAV_GROUPS,
  routes: ADMIN_ROUTES,
  defaultRoute: DEFAULT_ADMIN_ROUTE,
} satisfies AdminNavigation;
