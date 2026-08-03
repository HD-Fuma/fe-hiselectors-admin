import { useState } from "react";
import { RouterProvider } from "react-router-dom";
import { createAppRouter } from "./router";

interface AppProps {
  initialEntries?: string[];
}

export function App({ initialEntries }: AppProps) {
  const [router] = useState(() => createAppRouter(initialEntries));

  return (
    <div data-app-ready="true">
      <RouterProvider router={router} />
    </div>
  );
}
