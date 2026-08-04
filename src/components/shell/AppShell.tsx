import { Outlet, useLocation } from "react-router-dom";
import { DEFAULT_ADMIN_ROUTE, findAdminRoute } from "../../app/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { WorkTabs } from "./WorkTabs";
import "../../styles/admin.css";

export function AppShell() {
  const location = useLocation();
  const activeRoute = findAdminRoute(location.pathname) ?? DEFAULT_ADMIN_ROUTE;

  return (
    <div
      className="hsas-admin-shell"
      data-shell-part="root"
      data-testid="admin-shell"
      data-ui="admin-shell"
      data-visual-contract="admin-shell"
    >
      <AdminSidebar activeRoute={activeRoute} currentPath={location.pathname} />
      <div className="hsas-admin-shell__workspace">
        <AdminTopbar activeRoute={activeRoute} />
        <WorkTabs
          activeRoute={activeRoute}
          currentPath={`${location.pathname}${location.search}`}
        />
        <main className="hsas-admin-shell__content" data-shell-part="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
