import { Suspense, type ComponentType, type LazyExoticComponent } from "react";
import {
  Navigate,
  createBrowserRouter,
  createMemoryRouter,
  type RouteObject,
} from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { AdminLayout } from "./layout";
import {
  ADMIN_NAVIGATION,
  ADMIN_ROUTE_MANIFEST,
  DEFAULT_ADMIN_ROUTE,
} from "./navigation";

const routeLoadingFallback = (
  <div aria-live="polite" role="status">
    화면을 불러오는 중입니다.
  </div>
);

function renderLazyPage(Component: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={routeLoadingFallback}>
      <Component />
    </Suspense>
  );
}

const adminRouteObjects: RouteObject[] = ADMIN_ROUTE_MANIFEST.map((route) => {
  const { Component } = route;

  return {
    path: route.path.slice(1),
    element: renderLazyPage(Component),
  };
});

const DefaultAdminPage = DEFAULT_ADMIN_ROUTE.Component;

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AdminLayout navigation={ADMIN_NAVIGATION} />,
    children: [
      {
        index: true,
        element: renderLazyPage(DefaultAdminPage),
      },
      {
        path: "home",
        element: <Navigate replace to="/creators" />,
      },
      {
        path: "performance",
        element: <Navigate replace to="/performance/selectors" />,
      },
      {
        path: "performance/creators",
        element: <Navigate replace to="/performance/selectors" />,
      },
      {
        path: "selectors/qualifications",
        element: <Navigate replace to="/selectors" />,
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
