import { createBrowserRouter, createMemoryRouter, type RouteObject } from "react-router-dom";
import { AppShell } from "../components/shell/AppShell";
import { PlaceholderPage } from "../components/shell/PlaceholderPage";
import { ADMIN_ROUTES, DEFAULT_ADMIN_ROUTE } from "./navigation";

const adminRouteObjects: RouteObject[] = ADMIN_ROUTES.map((route) => ({
  path: route.path.slice(1),
  element: <PlaceholderPage title={route.title} screenCode={route.screenCode} />,
}));

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <main>FUMA</main>,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <PlaceholderPage
            title={DEFAULT_ADMIN_ROUTE.title}
            screenCode={DEFAULT_ADMIN_ROUTE.screenCode}
          />
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
