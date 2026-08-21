import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { LoginLocationState } from "./LoginPage";
import { getAdministratorSession } from "./api";

export function RequireAdministrator({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!getAdministratorSession()) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace state={{ from } satisfies LoginLocationState} to="/login" />;
  }

  return children;
}
