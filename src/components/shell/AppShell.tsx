import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { DEFAULT_ADMIN_ROUTE, findAdminRoute, type AdminRouteMeta } from "../../app/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { WorkTabs, type WorkTab } from "./WorkTabs";
import "../../styles/admin.css";

function pathnameOf(path: string) {
  return path.split(/[?#]/, 1)[0];
}

function searchOf(path: string) {
  const queryStart = path.indexOf("?");
  return queryStart < 0 ? "" : path.slice(queryStart + 1).split("#", 1)[0];
}

function panelParentPathFor(route: AdminRouteMeta, currentPath: string) {
  const searchParams = new URLSearchParams(searchOf(currentPath));

  if (searchParams.has("detail")) {
    searchParams.delete("detail");
    const remainingSearch = searchParams.toString();
    return remainingSearch ? `${pathnameOf(currentPath)}?${remainingSearch}` : pathnameOf(currentPath);
  }

  const queryParent = route.workTabParentQuery;
  if (queryParent && searchParams.get(queryParent.parameter) === queryParent.value) {
    return queryParent.path;
  }

  return route.workTabParentPath;
}

function isPanelTab(tab: WorkTab) {
  const route = findAdminRoute(pathnameOf(tab.to));
  if (!route) {
    return false;
  }

  return Boolean(panelParentPathFor(route, tab.to))
    || Boolean(route.workTabSingletonId && tab.id !== route.workTabSingletonId);
}

function workTabForRoute(
  route: AdminRouteMeta,
  currentPath: string,
  parentPath = panelParentPathFor(route, currentPath),
): WorkTab {
  if (!parentPath) {
    return {
      id: route.workTabSingletonId ?? pathnameOf(currentPath),
      label: route.workTabLabel,
      to: currentPath,
    };
  }

  const parentRoute = findAdminRoute(pathnameOf(parentPath)) ?? route;

  return {
    id: pathnameOf(parentPath),
    label: parentRoute.workTabLabel,
    to: parentPath,
  };
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeRoute = findAdminRoute(location.pathname) ?? DEFAULT_ADMIN_ROUTE;
  const currentPath = `${location.pathname}${location.search}`;
  const parentPath = panelParentPathFor(activeRoute, currentPath);
  const [tabs, setTabs] = useState<WorkTab[]>(() => [workTabForRoute(activeRoute, currentPath, parentPath)]);
  const parentTab = parentPath
    ? [...tabs].reverse().find((tab) => tab.id === pathnameOf(parentPath))
      ?? [...tabs].reverse().find((tab) => pathnameOf(tab.to) === pathnameOf(parentPath))
    : undefined;
  const activeTabId = parentTab?.id
    ?? (parentPath ? pathnameOf(parentPath) : activeRoute.workTabSingletonId ?? pathnameOf(currentPath));

  useEffect(() => {
    const nextTab = workTabForRoute(activeRoute, currentPath, parentPath);

    setTabs((current) => {
      const visibleTabs = current.filter((tab) => !isPanelTab(tab));
      const tabExists = visibleTabs.some((tab) => tab.id === nextTab.id);

      if (!tabExists) {
        return [...visibleTabs, nextTab];
      }

      return visibleTabs.map((tab) => tab.id === nextTab.id ? nextTab : tab);
    });
  }, [activeRoute, currentPath, parentPath]);

  const closeTab = (tabId: string) => {
    const remaining = tabs.filter((tab) => tab.id !== tabId);
    if (remaining.length === 0) return;

    setTabs(remaining);
    if (tabId === activeTabId) {
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
        <WorkTabs activeTabId={activeTabId} onClose={closeTab} tabs={tabs} />
        <main className="hsas-admin-shell__content" data-shell-part="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
