import {
  BadgeCheck,
  BarChart3,
  ChevronDown,
  ClipboardList,
  FileSearch,
  LogOut,
  Megaphone,
  Settings,
  Settings2,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, matchPath } from "react-router-dom";
import {
  NAV_GROUPS,
  getGroupMenuItems,
  type AdminRouteMeta,
  type NavGroup,
} from "../../app/navigation";
import "../../styles/sidebar-account.css";

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
  const [expandedGroups, setExpandedGroups] = useState<Set<NavGroup>>(
    () => new Set(NAV_GROUPS.map(({ id }) => id)),
  );

  const toggleGroup = (groupId: NavGroup) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <aside className="hsas-admin-sidebar" data-shell-part="sidebar">
      <div className="hsas-admin-sidebar__brand">
        <span className="hsas-admin-sidebar__brand-mark" aria-hidden="true">
          S
        </span>
        <span className="hsas-admin-sidebar__brand-copy">
          <strong className="hsas-admin-sidebar__brand-name">SELECTORS</strong>
          <span className="hsas-admin-sidebar__brand-caption">
            CREATOR OPERATIONS
          </span>
        </span>
      </div>
      <nav
        className="hsas-admin-sidebar__navigation"
        aria-label="관리자 메뉴"
        data-selected-group={activeRoute.group}
      >
        {NAV_GROUPS.map((group) => {
          const Icon = GROUP_ICONS[group.id];
          const headingId = `hsas-admin-sidebar-group-${group.id}`;
          const listId = `${headingId}-items`;
          const isExpanded = expandedGroups.has(group.id);
          const isGroupSelected = group.id === activeRoute.group;

          return (
            <section
              key={group.id}
              className="hsas-admin-sidebar__group"
              aria-labelledby={headingId}
              data-selected-group={isGroupSelected ? "true" : undefined}
            >
              <h2 className="hsas-admin-sidebar__group-title">
                <button
                  type="button"
                  id={headingId}
                  className="hsas-admin-sidebar__group-toggle"
                  aria-controls={listId}
                  aria-expanded={isExpanded}
                  onClick={() => toggleGroup(group.id)}
                >
                  <Icon aria-hidden="true" />
                  <span>{group.label}</span>
                  <ChevronDown
                    className={
                      isExpanded
                        ? "hsas-admin-sidebar__chevron"
                        : "hsas-admin-sidebar__chevron hsas-admin-sidebar__chevron--collapsed"
                    }
                    aria-hidden="true"
                  />
                </button>
              </h2>
              <ul
                id={listId}
                className="hsas-admin-sidebar__list"
                hidden={!isExpanded}
              >
                {getGroupMenuItems(group.id).map((item) => {
                  const isSectionSelected =
                    item.group === activeRoute.group &&
                    item.menuLabel === activeRoute.menuLabel;
                  const isRouteExact =
                    matchPath({ path: item.path, end: true }, currentPath) != null;

                  return (
                    <li key={item.menuLabel}>
                      <Link
                        className={
                          isSectionSelected
                            ? "hsas-admin-sidebar__link hsas-admin-sidebar__link--active"
                            : "hsas-admin-sidebar__link"
                        }
                        to={item.path}
                        aria-current={
                          isSectionSelected && isRouteExact ? "page" : undefined
                        }
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
      <div className="hsas-admin-sidebar__account" data-shell-part="account">
        <span className="hsas-admin-sidebar__account-avatar" aria-hidden="true">
          관
        </span>
        <span className="hsas-admin-sidebar__account-copy">
          <strong>관리자</strong>
          <span>관리자 계정</span>
        </span>
        <span className="hsas-admin-sidebar__account-actions">
          <button
            type="button"
            className="hsas-admin-sidebar__account-action"
            aria-label="설정"
          >
            <Settings aria-hidden="true" />
          </button>
          <button
            type="button"
            className="hsas-admin-sidebar__account-action"
            aria-label="로그아웃"
          >
            <LogOut aria-hidden="true" />
          </button>
        </span>
      </div>
    </aside>
  );
}
