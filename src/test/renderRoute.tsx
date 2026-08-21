import { render } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import { createAppRouter } from "../app/router";

export function renderRoute(path: string, options: { authenticated?: boolean } = {}) {
  const { authenticated = path !== "/login" } = options;
  if (!authenticated) {
    localStorage.removeItem("selectors-auth");
  }
  if (authenticated) {
    const storedSession = localStorage.getItem("selectors-auth");
    const existingSession = storedSession
      ? JSON.parse(storedSession) as Record<string, unknown>
      : {};
    localStorage.setItem("selectors-auth", JSON.stringify({
      accessToken: "test.admin.jwt",
      issuedAt: Date.now(),
      loginId: "test-admin",
      name: "테스트 관리자",
      role: "ADMIN",
      tokenType: "Bearer",
      ...existingSession,
    }));
  }

  const router = createAppRouter([path]);

  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
}
