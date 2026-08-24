import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { WorkTabs, type WorkTab } from "./WorkTabs";
import type { AdminNavigation, AdminRouteMeta } from "./navigationModel";
import "../../styles/admin.css";

interface AppShellProps {
  activeRoute: AdminRouteMeta;
  activeTabId: string;
  children: ReactNode;
  currentPath: string;
  navigation: AdminNavigation;
  onCloseTab: (tabId: string) => void;
  tabs: readonly WorkTab[];
}

export function AppShell({
  activeRoute,
  activeTabId,
  children,
  currentPath,
  navigation,
  onCloseTab,
  tabs,
}: AppShellProps) {
  return (
    <div
      className="hsas-admin-shell"
      data-shell-part="root"
      data-testid="admin-shell"
      data-ui="admin-shell"
      data-visual-contract="admin-shell"
    >
      <AdminSidebar
        activeRoute={activeRoute}
        currentPath={currentPath}
        groups={navigation.groups}
        routes={navigation.routes}
      />
      <div className="hsas-admin-shell__workspace">
        <WorkTabs activeTabId={activeTabId} onClose={onCloseTab} tabs={tabs} />
        <main
          className="hsas-admin-shell__content"
          data-shell-part="content"
          id="admin-main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
