import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ADMIN_SESSION_INVALIDATED_EVENT } from "../../lib/adminAuthentication";
import type { LoginLocationState } from "./LoginPage";
import { getAdministratorSession } from "./api";

export function RequireAdministrator({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [, setSessionVersion] = useState(0);

  useEffect(() => {
    const invalidateSession = () => setSessionVersion((version) => version + 1);
    window.addEventListener(ADMIN_SESSION_INVALIDATED_EVENT, invalidateSession);
    return () => window.removeEventListener(ADMIN_SESSION_INVALIDATED_EVENT, invalidateSession);
  }, []);

  if (!getAdministratorSession()) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace state={{ from } satisfies LoginLocationState} to="/login" />;
  }

  return children;
}
