import {
  BadgeCheck,
  BarChart3,
  ClipboardList,
  FileSearch,
  Megaphone,
  Settings2,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  NAV_GROUPS,
  getGroupMenuItems,
  type AdminRouteMeta,
  type NavGroup,
} from "../../app/navigation";

const GROUP_ICONS: Record<NavGroup, LucideIcon> = {
  creators: UsersRound,
  selectors: BadgeCheck,
  applicants: ClipboardList,
  campaigns: Megaphone,
  content: FileSearch,
  performance: BarChart3,
  settlements: WalletCards,
  system: Settings2,
};

interface AdminSidebarProps {
  activeRoute: AdminRouteMeta;
  currentPath: string;
}

export function AdminSidebar({ activeRoute, currentPath }: AdminSidebarProps) {
  return (
    <aside className="hsas-admin-sidebar" data-shell-part="sidebar">
      <div className="hsas-admin-sidebar__brand">
        <strong className="hsas-admin-sidebar__brand-name">FUMA</strong>
        <span className="hsas-admin-sidebar__brand-caption">ADMIN CONSOLE</span>
      </div>
      <nav
        className="hsas-admin-sidebar__navigation"
        aria-label="관리자 메뉴"
        data-selected-group={activeRoute.group}
      >
        {NAV_GROUPS.map((group) => {
          const Icon = GROUP_ICONS[group.id];
          const headingId = `hsas-admin-sidebar-group-${group.id}`;

          return (
            <section
              key={group.id}
              className="hsas-admin-sidebar__group"
              aria-labelledby={headingId}
            >
              <h2 id={headingId} className="hsas-admin-sidebar__group-title">
                <Icon aria-hidden="true" />
                {group.label}
              </h2>
              <ul className="hsas-admin-sidebar__list">
                {getGroupMenuItems(group.id).map((item) => {
                  const isSectionSelected =
                    item.group === activeRoute.group &&
                    item.menuLabel === activeRoute.menuLabel;
                  const isRouteExact = item.path === currentPath;

                  return (
                    <li key={item.menuLabel}>
                      <Link
                        className={
                          isSectionSelected
                            ? "hsas-admin-sidebar__link hsas-admin-sidebar__link--active"
                            : "hsas-admin-sidebar__link"
                        }
                        to={item.path}
                        aria-current={isSectionSelected ? "page" : undefined}
                        data-section-selected={
                          isSectionSelected ? "true" : undefined
                        }
                        data-route-exact={isRouteExact ? "true" : undefined}
                      >
                        {item.menuLabel}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
