import { render } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import { createAppRouter } from "../app/router";

export function renderRoute(path: string) {
  const router = createAppRouter([path]);

  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
}
