import { createBrowserRouter, createMemoryRouter, type RouteObject } from "react-router-dom";
import { AppShell } from "../components/shell/AppShell";
import { PlaceholderPage } from "../components/shell/PlaceholderPage";
import { LoginPage } from "../features/auth/LoginPage";
import {
  ApplicantDetailPage,
  ApplicantListPage,
} from "../features/applicants/ApplicantPages";
import {
  CreatorDetailPage,
  CreatorListPage,
  ProposalComposePage,
  ProposalHistoryPage,
} from "../features/creators/CreatorPages";
import {
  CohortManagementPage,
  QualificationManagementPage,
  SelectorOverviewPage,
} from "../features/selectors/SelectorPages";
import {
  CampaignCreatePage,
  CampaignEditPage,
  CampaignListPage,
} from "../features/campaigns/CampaignPages";
import {
  ContentReviewDetailPage,
  ContentReviewListPage,
  ContentViolationPage,
} from "../features/content/ContentPages";
import {
  ContentPerformancePage,
  CreatorPerformancePage,
  PerformanceDashboardPage,
} from "../features/performance/PerformancePages";
import {
  NoticeManagementPage,
  SettlementManagementPage,
} from "../features/operations/OperationsPages";
import { ADMIN_ROUTES, DEFAULT_ADMIN_ROUTE } from "./navigation";

function adminRouteElement(path: string, title: string, screenCode: string) {
  switch (path) {
    case "/creators":
      return <CreatorListPage />;
    case "/creators/:creatorId":
      return <CreatorDetailPage />;
    case "/proposals":
      return <ProposalHistoryPage />;
    case "/proposals/new":
      return <ProposalComposePage />;
    case "/cohorts":
      return <CohortManagementPage />;
    case "/selectors":
      return <SelectorOverviewPage />;
    case "/selectors/qualifications":
      return <QualificationManagementPage />;
    case "/applicants":
      return <ApplicantListPage />;
    case "/applicants/:applicantId":
      return <ApplicantDetailPage />;
    case "/campaigns":
      return <CampaignListPage />;
    case "/campaigns/new":
      return <CampaignCreatePage />;
    case "/campaigns/:campaignId/edit":
      return <CampaignEditPage />;
    case "/content/reviews":
      return <ContentReviewListPage />;
    case "/content/reviews/:contentId":
      return <ContentReviewDetailPage />;
    case "/content/violations":
      return <ContentViolationPage />;
    case "/performance":
      return <PerformanceDashboardPage />;
    case "/performance/creators":
      return <CreatorPerformancePage />;
    case "/performance/contents":
      return <ContentPerformancePage />;
    case "/settlements":
      return <SettlementManagementPage />;
    case "/system/notices":
      return <NoticeManagementPage />;
    default:
      return <PlaceholderPage title={title} screenCode={screenCode} />;
  }
}

const adminRouteObjects: RouteObject[] = ADMIN_ROUTES.map((route) => ({
  path: route.path.slice(1),
  element: adminRouteElement(route.path, route.title, route.screenCode),
}));

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: adminRouteElement(
          DEFAULT_ADMIN_ROUTE.path,
          DEFAULT_ADMIN_ROUTE.title,
          DEFAULT_ADMIN_ROUTE.screenCode,
        ),
      },
      ...adminRouteObjects,
    ],
  },
];

function normalizeBrowserBasename(baseUrl: string) {
  const path = baseUrl.replace(/^\/+|\/+$/g, "");
  return path ? `/${path}` : "/";
}

export function createAppRouter(
  initialEntries?: string[],
  browserBasename = normalizeBrowserBasename(import.meta.env.BASE_URL),
) {
  return initialEntries
    ? createMemoryRouter(routes, { initialEntries })
    : createBrowserRouter(routes, { basename: browserBasename });
}
