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
  ProposalHistoryPage,
} from "../features/creators/CreatorPages";
import {
  CohortManagementPage,
  QualificationManagementPage,
  SelectorOverviewPage,
} from "../features/selectors/SelectorPages";
import { ADMIN_ROUTES, DEFAULT_ADMIN_ROUTE } from "./navigation";

function adminRouteElement(path: string, title: string, screenCode: string) {
  switch (path) {
    case "/creators":
      return <CreatorListPage />;
    case "/creators/:creatorId":
      return <CreatorDetailPage />;
    case "/proposals":
      return <ProposalHistoryPage />;
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

export function createAppRouter(initialEntries?: string[]) {
  return initialEntries
    ? createMemoryRouter(routes, { initialEntries })
    : createBrowserRouter(routes);
}
