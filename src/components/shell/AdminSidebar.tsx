import {
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LogOut,
  Moon,
  RotateCcw,
  Settings,
  Sun,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, matchPath, useNavigate } from "react-router-dom";
import { applyTheme, getTheme, saveTheme } from "../../lib/theme";
import { resetContentInspections } from "../../entities/content";
import {
  clearAdministratorSession,
  getAdministratorSession,
} from "../../features/auth/api";
import type {
  AdminRouteMeta,
  NavGroup,
  NavGroupMeta,
} from "./navigationModel";
import { BubbleDialog } from "../ui/BubbleDialog";
import { Button } from "../ui/Controls";
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
  const [isThemeMenuOpen, setThemeMenuOpen] = useState(false);
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
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

  const resetInspectionState = async () => {
    setResetting(true);
    setResetFeedback(null);
    try {
      const result = await resetContentInspections();
      setResetDialogOpen(false);
      setResetFeedback(
        `콘텐츠 ${result.resetVersionCount}건, 위반 판정 ${result.resetViolationCount}건을 초기화했습니다.`,
      );
    } catch (error) {
      setResetFeedback(
        error instanceof Error ? error.message : "검수 상태 초기화에 실패했습니다.",
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <aside className="hsas-admin-sidebar" data-shell-part="sidebar">
      <div className="hsas-admin-sidebar__brand">
        <Link className="hsas-admin-sidebar__brand-logo-shell" to="/">
          <img
            className="hsas-admin-sidebar__brand-logo"
            src={`${import.meta.env.BASE_URL}brand/thehyundai-hi.svg`}
            alt="더현대Hi"
          />
        </Link>
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
              onClick={() => {
                setSettingsOpen((current) => !current);
                setThemeMenuOpen(false);
              }}
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
                <span className="hsas-theme-settings__label">환경설정</span>
                <div
                  aria-label="환경설정 메뉴"
                  className="hsas-theme-settings__menu"
                  role="group"
                >
                  <button
                    aria-expanded={isThemeMenuOpen}
                    className="hsas-theme-settings__item"
                    onClick={() => setThemeMenuOpen((current) => !current)}
                    type="button"
                  >
                    <Sun aria-hidden="true" />
                    <span>화면 모드</span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                  {import.meta.env.DEV ? (
                    <button
                      className="hsas-theme-settings__item hsas-theme-settings__item--danger"
                      onClick={() => {
                        setResetFeedback(null);
                        setResetDialogOpen(true);
                      }}
                      type="button"
                    >
                      <RotateCcw aria-hidden="true" />
                      <span>검수 상태 초기화</span>
                    </button>
                  ) : null}
                </div>
                {isThemeMenuOpen ? (
                  <div
                    aria-label="화면 모드"
                    className="hsas-theme-settings__submenu"
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
                        {theme === value ? (
                          <Check
                            aria-hidden="true"
                            className="hsas-theme-settings__check"
                          />
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
                {resetFeedback ? (
                  <p className="hsas-theme-settings__feedback" role="status">
                    {resetFeedback}
                  </p>
                ) : null}
              </div>
            )}
            {import.meta.env.DEV ? (
              <BubbleDialog
                actions={(
                  <>
                    <Button disabled={isResetting} onClick={() => setResetDialogOpen(false)}>
                      취소
                    </Button>
                    <Button
                      disabled={isResetting}
                      onClick={() => void resetInspectionState()}
                      variant="danger"
                    >
                      {isResetting ? "초기화 중" : "초기화"}
                    </Button>
                  </>
                )}
                description="현재 활동 기수의 최종 승인·반려와 위반 판정을 초기화합니다. 패널티, 블랙리스트, 감사 이력은 유지됩니다."
                open={isResetDialogOpen}
                title="검수 상태를 초기화할까요?"
              />
            ) : null}
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
