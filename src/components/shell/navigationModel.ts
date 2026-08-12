export type NavGroup =
  | "creators"
  | "selectors"
  | "applicants"
  | "campaigns"
  | "content"
  | "performance"
  | "settlements";

export interface AdminRouteMeta {
  path: string;
  group: NavGroup;
  menuLabel: string;
  title: string;
  screenCode: string;
  workTabLabel: string;
  workTabSingletonId?: string;
  workTabParentPath?: string;
  workTabParentQuery?: {
    parameter: string;
    value: string;
    path: string;
  };
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
