import { NAV_GROUPS, type AdminRouteMeta } from "../../app/navigation";

interface AdminTopbarProps {
  activeRoute: AdminRouteMeta;
}

export function AdminTopbar({ activeRoute }: AdminTopbarProps) {
  const group = NAV_GROUPS.find(({ id }) => id === activeRoute.group);

  return (
    <header className="hsas-admin-topbar" data-shell-part="topbar">
      <div className="hsas-admin-topbar__context">
        {group?.label} / {activeRoute.title}
      </div>
    </header>
  );
}
