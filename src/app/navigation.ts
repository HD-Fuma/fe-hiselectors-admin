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

const CreatorListPage = lazyPage(() =>
  import("../features/creators/CreatorPages").then((module) => module.CreatorListPage),
);
const ProposalHistoryPage = lazyPage(() =>
  import("../features/creators/CreatorPages").then((module) => module.ProposalHistoryPage),
);
const ProposalComposePage = lazyPage(() =>
  import("../features/creators/CreatorPages").then((module) => module.ProposalComposePage),
);
const SelectorOverviewPage = lazyPage(() =>
  import("../features/selectors/SelectorPages").then((module) => module.SelectorOverviewPage),
);
const QualificationManagementPage = lazyPage(() =>
  import("../features/selectors/SelectorPages").then(
    (module) => module.QualificationManagementPage,
  ),
);
const ExcellentSelectorListPage = lazyPage(() =>
  import("../features/selectors/SelectorPages").then(
    (module) => module.ExcellentSelectorListPage,
  ),
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
const ProductPerformancePage = lazyPage(() =>
  import("../features/performance/PerformancePages").then(
    (module) => module.ProductPerformancePage,
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

const NAV_GROUPS: readonly NavGroupMeta[] = [
  { id: "creators", label: "크리에이터" },
  { id: "applicants", label: "지원자" },
  { id: "selectors", label: "셀렉터스" },
  { id: "campaigns", label: "캠페인" },
  { id: "content", label: "콘텐츠" },
  { id: "performance", label: "성과" },
  { id: "settlements", label: "정산" },
  { id: "notifications", label: "알림 및 메시지" },
];

export const ADMIN_ROUTE_MANIFEST = [
  {
    path: "/creators",
    Component: CreatorListPage,
    group: "creators",
    menuLabel: "크리에이터 풀",
    title: "크리에이터 풀",
    screenCode: "CR101",
    workTabLabel: "크리에이터 풀",
  },
  {
    path: "/proposals",
    Component: ProposalHistoryPage,
    group: "creators",
    menuLabel: "제안 이력",
    title: "제안 이력",
    screenCode: "CR201",
    workTabLabel: "제안 이력",
  },
  {
    path: "/proposals/new",
    Component: ProposalComposePage,
    group: "creators",
    menuLabel: "크리에이터 풀",
    title: "셀렉터스 제안",
    screenCode: "CR202",
    workTabLabel: "제안 작성",
  },
  {
    path: "/selectors",
    Component: SelectorOverviewPage,
    group: "selectors",
    menuLabel: "셀렉터스 목록",
    title: "셀렉터스 목록",
    screenCode: "SL201",
    workTabLabel: "셀렉터스 목록",
  },
  {
    path: "/selectors/qualifications",
    Component: QualificationManagementPage,
    group: "selectors",
    menuLabel: "블랙리스트 관리",
    title: "블랙리스트 관리",
    screenCode: "SL301",
    workTabLabel: "블랙리스트 관리",
  },
  {
    path: "/selectors/excellent",
    Component: ExcellentSelectorListPage,
    group: "selectors",
    menuLabel: "우수 활동자",
    title: "우수 활동자",
    screenCode: "SL302",
    workTabLabel: "우수 활동자",
  },
  {
    path: "/selectors/:selectorId",
    Component: SelectorDetailPage,
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
    path: "/cohorts",
    Component: CohortManagementPage,
    group: "selectors",
    menuLabel: "기수 관리",
    title: "기수 관리",
    screenCode: "SL101",
    workTabLabel: "기수 관리",
  },
  {
    path: "/applicants",
    Component: ApplicantListPage,
    group: "applicants",
    menuLabel: "지원자 승인",
    title: "지원자 승인",
    screenCode: "AP101",
    workTabLabel: "지원자 심사",
  },
  {
    path: "/applicants/test",
    Component: ApplicantTestPage,
    group: "applicants",
    menuLabel: "지원자 승인",
    title: "테스트 지원자 등록",
    screenCode: "AP103",
    workTabLabel: "테스트 지원자 등록",
    workTabParentPath: "/applicants",
  },
  {
    path: "/applicants/:applicantId",
    Component: ApplicantDetailPage,
    group: "applicants",
    menuLabel: "지원자 승인",
    title: "지원자 승인",
    screenCode: "AP102",
    workTabLabel: "지원자 상세",
    workTabParentPath: "/applicants",
  },
  {
    path: "/campaigns",
    Component: CampaignWorkspacePage,
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP101",
    workTabLabel: "캠페인 관리",
  },
  {
    path: "/campaigns/new",
    Component: CampaignWorkspacePage,
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP102",
    workTabLabel: "캠페인 생성",
    workTabParentPath: "/campaigns",
  },
  {
    path: "/campaigns/:campaignId",
    Component: CampaignWorkspacePage,
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP104",
    workTabLabel: "캠페인 상세",
    workTabParentPath: "/campaigns",
  },
  {
    path: "/campaigns/:campaignId/edit",
    Component: CampaignWorkspacePage,
    group: "campaigns",
    menuLabel: "캠페인 관리",
    title: "캠페인 관리",
    screenCode: "CP103",
    workTabLabel: "캠페인 수정",
    workTabParentPath: "/campaigns",
  },
  {
    path: "/content/inspections",
    Component: ContentInspectionListPage,
    group: "content",
    menuLabel: "콘텐츠 검수",
    title: "콘텐츠 검수",
    screenCode: "CT101",
    workTabLabel: "콘텐츠 검수",
  },
  {
    path: "/content/inspections/:contentId",
    Component: ContentInspectionDetailPage,
    group: "content",
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
    title: "셀렉터스 성과",
    screenCode: "PF201",
    workTabLabel: "셀렉터스 성과",
  },
  {
    path: "/performance/contents",
    Component: ContentPerformancePage,
    group: "performance",
    menuLabel: "콘텐츠 성과",
    title: "콘텐츠 성과",
    screenCode: "PF202",
    workTabLabel: "콘텐츠 성과",
  },
  {
    path: "/performance/products",
    Component: ProductPerformancePage,
    group: "performance",
    menuLabel: "캠페인 성과",
    title: "캠페인 성과",
    screenCode: "PF203",
    workTabLabel: "캠페인 성과",
  },
  {
    path: "/settlements",
    Component: SettlementManagementPage,
    group: "settlements",
    menuLabel: "정산 관리",
    title: "정산 관리",
    screenCode: "ST101",
    workTabLabel: "정산 관리",
  },
  {
    path: "/notifications",
    Component: NotificationHistoryPage,
    group: "notifications",
    menuLabel: "발송 내역",
    title: "알림 및 메시지",
    screenCode: "NT101",
    workTabLabel: "발송 내역",
  },
  {
    path: "/notifications/kakao-recipients",
    Component: KakaoRecipientStatusPage,
    group: "notifications",
    menuLabel: "카카오 수신 현황",
    title: "카카오 수신 현황",
    screenCode: "NT102",
    workTabLabel: "카카오 수신 현황",
  },
] as const satisfies readonly AdminRouteManifestEntry[];

const ADMIN_ROUTES: readonly AdminRouteMeta[] = ADMIN_ROUTE_MANIFEST;
export const DEFAULT_ADMIN_ROUTE = ADMIN_ROUTE_MANIFEST[0];

export const ADMIN_NAVIGATION = {
  groups: NAV_GROUPS,
  routes: ADMIN_ROUTES,
  defaultRoute: DEFAULT_ADMIN_ROUTE,
} satisfies AdminNavigation;
