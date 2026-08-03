import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { DEFAULT_ADMIN_ROUTE, findAdminRoute } from "../../app/navigation";
import { IconRail } from "./IconRail";
import { MegaMenu } from "./MegaMenu";
import { MyMenu } from "./MyMenu";
import { WorkTabs } from "./WorkTabs";
import "../../styles/admin.css";

export function AppShell() {
  const location = useLocation();
  const [isMegaMenuRequested, setIsMegaMenuRequested] = useState(false);
  const activeRoute = findAdminRoute(location.pathname) ?? DEFAULT_ADMIN_ROUTE;
  const fixture = new URLSearchParams(location.search).get("fixture");
  const isMegaMenuOpen = fixture === "mega-menu" || isMegaMenuRequested;

  return (
    <div
      className="hsas-admin-shell"
      data-shell-part="root"
      data-testid="admin-shell"
      data-ui="admin-shell"
    >
      <IconRail onOpenMegaMenu={() => setIsMegaMenuRequested(true)} />
      <MyMenu activeRoute={activeRoute} />
      <div className="hsas-admin-shell__workspace">
        <header className="hsas-admin-shell__topbar" data-shell-part="topbar">
          <strong>FUMA 관리자 시스템</strong>
        </header>
        <WorkTabs activeRoute={activeRoute} currentPath={location.pathname} />
        <main className="hsas-admin-shell__content" data-shell-part="content">
          <Outlet />
        </main>
      </div>
      {isMegaMenuOpen ? (
        <MegaMenu activeGroup={activeRoute.group} onClose={() => setIsMegaMenuRequested(false)} />
      ) : null}
    </div>
  );
}
