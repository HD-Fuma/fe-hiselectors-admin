import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { DEFAULT_ADMIN_ROUTE, findAdminRoute } from "../../app/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { WorkTabs, type WorkTab } from "./WorkTabs";
import "../../styles/admin.css";

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeRoute = findAdminRoute(location.pathname) ?? DEFAULT_ADMIN_ROUTE;
  const currentPath = `${location.pathname}${location.search}`;
  const [tabs, setTabs] = useState<WorkTab[]>(() => [
    { id: currentPath, label: activeRoute.workTabLabel, to: currentPath },
  ]);

  useEffect(() => {
    setTabs((current) =>
      current.some((tab) => tab.id === currentPath)
        ? current
        : [...current, { id: currentPath, label: activeRoute.workTabLabel, to: currentPath }],
    );
  }, [activeRoute.workTabLabel, currentPath]);

  const closeTab = (tabId: string) => {
    const remaining = tabs.filter((tab) => tab.id !== tabId);
    if (remaining.length === 0) return;

    setTabs(remaining);
    if (tabId === currentPath) {
      navigate(remaining.at(-1)?.to ?? DEFAULT_ADMIN_ROUTE.path);
    }
  };

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
        <WorkTabs activeTabId={currentPath} onClose={closeTab} tabs={tabs} />
        <main className="hsas-admin-shell__content" data-shell-part="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
