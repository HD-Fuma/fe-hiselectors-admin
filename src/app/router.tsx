import { createBrowserRouter, createMemoryRouter, type RouteObject } from "react-router-dom";

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <main>FUMA</main>,
  },
];

export function createAppRouter(initialEntries?: string[]) {
  return initialEntries
    ? createMemoryRouter(routes, { initialEntries })
    : createBrowserRouter(routes);
}
