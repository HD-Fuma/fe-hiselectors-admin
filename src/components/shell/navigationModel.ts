export type NavGroup =
  | "recruitment"
  | "operations"
  | "performance"
  | "notifications";

export interface AdminRouteMeta {
  path: string;
  group: NavGroup;
  menuLabel: string;
  menuOrder?: number;
  title: string;
  screenCode: string;
  workTabLabel: string;
  workTabSingletonId?: string;
  workTabParentPath?: string;
}

export interface NavGroupMeta {
  id: NavGroup;
  label: string;
}

export interface AdminNavigation {
  groups: readonly NavGroupMeta[];
  routes: readonly AdminRouteMeta[];
  defaultRoute: AdminRouteMeta;
}
