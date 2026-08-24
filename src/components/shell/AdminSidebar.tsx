import {
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ClipboardList,
  LogOut,
  Moon,
  Settings,
  Sun,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, matchPath, useNavigate } from "react-router-dom";
import { applyTheme, getTheme, saveTheme } from "../../lib/theme";
import {
  clearAdministratorSession,
  getAdministratorSession,
} from "../../features/auth/api";
import type {
  AdminRouteMeta,
  NavGroup,
  NavGroupMeta,
} from "./navigationModel";
import "../../styles/sidebar-account.css";
import "../../styles/sidebar-brand.css";

const GROUP_ICONS: Record<NavGroup, LucideIcon> = {
  recruitment: UsersRound,
  operations: ClipboardList,
  performance: BarChart3,
  notifications: Bell,
};

const THEME_OPTIONS = [
  { value: "light", label: "라이트 모드", icon: Sun },
  { value: "dark", label: "다크 모드", icon: Moon },
] as const;

const THEME_SETTINGS_ID = "hsas-theme-settings";

interface AdminSidebarProps {
  activeRoute: AdminRouteMeta;
  currentPath: string;
  groups: readonly NavGroupMeta[];
  routes: readonly AdminRouteMeta[];
}

function getGroupMenuItems(routes: readonly AdminRouteMeta[], group: NavGroup) {
  const labels = new Set<string>();

  return routes
    .filter((route) => {
      if (route.group !== group || labels.has(route.menuLabel)) {
        return false;
      }

      labels.add(route.menuLabel);
      return true;
    })
    .sort((left, right) => (
      (left.menuOrder ?? Number.MAX_SAFE_INTEGER)
      - (right.menuOrder ?? Number.MAX_SAFE_INTEGER)
    ));
}

export function AdminSidebar({
  activeRoute,
  currentPath,
  groups,
  routes,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const session = getAdministratorSession();
  const administratorName = session?.name ?? session?.loginId ?? "관리자";
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<NavGroup>>(
    () => new Set(groups.map(({ id }) => id)),
  );

  useLayoutEffect(() => applyTheme(theme), [theme]);

  useEffect(() => {
    if (!isSettingsOpen) return undefined;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !settingsRef.current?.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSettingsOpen(false);
      settingsButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isSettingsOpen]);

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
        <span className="hsas-admin-sidebar__brand-logo-shell">
          <img
            className="hsas-admin-sidebar__brand-logo"
            src={`${import.meta.env.BASE_URL}brand/thehyundai-hi.svg`}
            alt="더현대Hi"
          />
        </span>
      </div>
      <nav
        className="hsas-admin-sidebar__navigation"
        aria-label="관리자 메뉴"
        data-selected-group={activeRoute.group}
      >
        {groups.map((group) => {
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
                {getGroupMenuItems(routes, group.id).map((item) => {
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
          {administratorName.slice(0, 1)}
        </span>
        <span className="hsas-admin-sidebar__account-copy">
          <strong>{administratorName}</strong>
          <span>관리자 계정</span>
        </span>
        <div className="hsas-admin-sidebar__account-actions">
          <div className="hsas-theme-settings-anchor" ref={settingsRef}>
            <button
              aria-controls={THEME_SETTINGS_ID}
              aria-expanded={isSettingsOpen}
              aria-label="환경설정"
              className="hsas-admin-sidebar__account-action"
              onClick={() => setSettingsOpen((current) => !current)}
              ref={settingsButtonRef}
              type="button"
            >
              <Settings aria-hidden="true" />
            </button>
            {isSettingsOpen && (
              <div
                aria-label="환경설정"
                className="hsas-theme-settings-popover"
                id={THEME_SETTINGS_ID}
                role="group"
              >
                <span className="hsas-theme-settings__label">화면 모드</span>
                <div
                  aria-label="화면 모드"
                  className="hsas-theme-settings__menu"
                  role="group"
                >
                  {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      aria-pressed={theme === value}
                      className="hsas-theme-settings__item"
                      key={value}
                      onClick={() => {
                        setTheme(value);
                        saveTheme(value);
                      }}
                      type="button"
                    >
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                      {theme === value && (
                        <Check
                          aria-hidden="true"
                          className="hsas-theme-settings__check"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="hsas-admin-sidebar__account-action"
            aria-label="로그아웃"
            onClick={() => {
              clearAdministratorSession();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
