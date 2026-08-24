import { useEffect, useState } from "react";
import {
  Outlet,
  matchPath,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppShell } from "../components/shell/AppShell";
import type {
  AdminNavigation,
  AdminRouteMeta,
} from "../components/shell/navigationModel";
import type { WorkTab } from "../components/shell/WorkTabs";

interface AdminLayoutProps {
  navigation: AdminNavigation;
}

function pathnameOf(path: string) {
  return path.split(/[?#]/, 1)[0];
}

function searchOf(path: string) {
  const queryStart = path.indexOf("?");
  return queryStart < 0 ? "" : path.slice(queryStart + 1).split("#", 1)[0];
}

function findAdminRoute(routes: readonly AdminRouteMeta[], pathname: string) {
  return routes.find(
    (route) => matchPath({ path: route.path, end: true }, pathname) != null,
  );
}

function panelParentPathFor(route: AdminRouteMeta, currentPath: string) {
  const searchParams = new URLSearchParams(searchOf(currentPath));

  if (searchParams.has("detail")) {
    searchParams.delete("detail");
    const remainingSearch = searchParams.toString();
    return remainingSearch
      ? `${pathnameOf(currentPath)}?${remainingSearch}`
      : pathnameOf(currentPath);
  }

  return route.workTabParentPath;
}

function isPanelTab(
  routes: readonly AdminRouteMeta[],
  tab: WorkTab,
) {
  const route = findAdminRoute(routes, pathnameOf(tab.to));
  if (!route) {
    return false;
  }

  return Boolean(panelParentPathFor(route, tab.to))
    || Boolean(
      route.workTabSingletonId && tab.id !== route.workTabSingletonId,
    );
}

function workTabForRoute(
  routes: readonly AdminRouteMeta[],
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

  const parentRoute = findAdminRoute(routes, pathnameOf(parentPath)) ?? route;

  return {
    id: pathnameOf(parentPath),
    label: parentRoute.workTabLabel,
    to: parentPath,
  };
}

export function AdminLayout({ navigation }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeRoute = findAdminRoute(navigation.routes, location.pathname)
    ?? navigation.defaultRoute;
  const currentPath = `${location.pathname}${location.search}`;
  const parentPath = panelParentPathFor(activeRoute, currentPath);
  const [tabs, setTabs] = useState<WorkTab[]>(() => [
    workTabForRoute(navigation.routes, activeRoute, currentPath, parentPath),
  ]);
  const parentTab = parentPath
    ? [...tabs].reverse().find((tab) => tab.id === pathnameOf(parentPath))
      ?? [...tabs]
        .reverse()
        .find((tab) => pathnameOf(tab.to) === pathnameOf(parentPath))
    : undefined;
  const activeTabId = parentTab?.id
    ?? (
      parentPath
        ? pathnameOf(parentPath)
        : activeRoute.workTabSingletonId ?? pathnameOf(currentPath)
    );

  useEffect(() => {
    const nextTab = workTabForRoute(
      navigation.routes,
      activeRoute,
      currentPath,
      parentPath,
    );

    // Route changes are external router state that extend the visible tab history.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTabs((current) => {
      const visibleTabs = current.filter(
        (tab) => !isPanelTab(navigation.routes, tab),
      );
      const tabExists = visibleTabs.some((tab) => tab.id === nextTab.id);

      if (!tabExists) {
        return [...visibleTabs, nextTab];
      }

      return visibleTabs.map((tab) => (
        tab.id === nextTab.id ? nextTab : tab
      ));
    });
  }, [activeRoute, currentPath, navigation.routes, parentPath]);

  const closeTab = (tabId: string) => {
    const remaining = tabs.filter((tab) => tab.id !== tabId);
    if (remaining.length === 0) return;

    setTabs(remaining);
    if (tabId === activeTabId) {
      navigate(remaining.at(-1)?.to ?? navigation.defaultRoute.path);
    }
  };

  return (
    <AppShell
      activeRoute={activeRoute}
      activeTabId={activeTabId}
      currentPath={location.pathname}
      navigation={navigation}
      onCloseTab={closeTab}
      tabs={tabs}
    >
      <Outlet context={activeRoute} />
    </AppShell>
  );
}
