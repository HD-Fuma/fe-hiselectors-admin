import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LogOut,
  LayoutDashboard,
  Moon,
  RotateCcw,
  Settings,
  Sun,
  UserRoundX,
  UsersRound,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, matchPath, useNavigate } from "react-router-dom";
import { CREATOR_POOL_RESET_EVENT } from "../../lib/creatorPoolEvents";
import {
  getCreatorDiscoveryCurrentMonthOnly,
  saveCreatorDiscoveryCurrentMonthOnly,
} from "../../lib/creatorDiscoveryPeriod";
import { getFastMode, saveFastMode } from "../../lib/fastMode";
import {
  getAutoRejectionEnabled,
  saveAutoRejectionEnabled,
  subscribeAutoRejection,
} from "../../lib/autoRejection";
import { applyTheme, getTheme, saveTheme } from "../../lib/theme";
import { resetContentInspections } from "../../entities/content";
import { resetCreatorPool } from "../../entities/creator";
import { resetSelectorTestAccount } from "../../entities/selectors";
import type { SelectorSnsCode } from "../../entities/selectors";
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
import { Button, Select, Switch, TextInput } from "../ui/Controls";
import { FormRow } from "../ui/FormRow";
import { Modal } from "../ui/Modal";
import "../../styles/sidebar-account.css";
import "../../styles/sidebar-brand.css";

const GROUP_ICONS: Record<NavGroup, LucideIcon> = {
  dashboard: LayoutDashboard,
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
const CREATOR_POOL_RESET_CONFIRMATION = "초기화";

const TEST_RESET_SNS_OPTIONS: readonly { value: SelectorSnsCode; label: string }[] = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "YOUTUBE", label: "YouTube" },
];
const TEST_RESET_DEFAULT_ACCOUNT_IDS: Record<SelectorSnsCode, string> = {
  INSTAGRAM: "@hi_selectors",
  YOUTUBE: "UCD2RQE52TloxzZxZ2fyq8HQ",
};

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
  const [isCreatorResetDialogOpen, setCreatorResetDialogOpen] = useState(false);
  const [isCreatorResetting, setCreatorResetting] = useState(false);
  const [creatorResetConfirmation, setCreatorResetConfirmation] = useState("");
  const [creatorResetError, setCreatorResetError] = useState("");
  const [isTestResetDialogOpen, setTestResetDialogOpen] = useState(false);
  const [isTestResetting, setTestResetting] = useState(false);
  const [testResetSnsCode, setTestResetSnsCode] = useState<SelectorSnsCode>("YOUTUBE");
  const [testResetAccountId, setTestResetAccountId] = useState(
    TEST_RESET_DEFAULT_ACCOUNT_IDS.YOUTUBE,
  );
  const [testResetError, setTestResetError] = useState("");
  const [theme, setTheme] = useState(getTheme);
  const [fastMode, setFastMode] = useState(getFastMode);
  const [creatorDiscoveryCurrentMonthOnly, setCreatorDiscoveryCurrentMonthOnly] = useState(
    getCreatorDiscoveryCurrentMonthOnly,
  );
  const autoRejectionEnabled = useSyncExternalStore(
    subscribeAutoRejection,
    getAutoRejectionEnabled,
    () => true,
  );
  const [isFastModeConfirmOpen, setFastModeConfirmOpen] = useState(false);
  const creatorResetDescriptionId = useId();
  const testResetDescriptionId = useId();
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<NavGroup>>(
    () => new Set(groups.map(({ id }) => id)),
  );

  useLayoutEffect(() => applyTheme(theme), [theme]);

  useEffect(() => {
    if (!isSettingsOpen) return undefined;

    // 모달이 떠 있는 동안은 팝오버를 살려 둔다. 모달을 닫으면 다시 여기로 돌아온다.
    const isModalOpen = isCreatorResetDialogOpen
      || isTestResetDialogOpen
      || isFastModeConfirmOpen;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (isModalOpen) return;
      if (event.target instanceof Node && !settingsRef.current?.contains(event.target)) {
        setSettingsOpen(false);
        setThemeMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (isModalOpen) return;
      if (event.key !== "Escape") return;
      setSettingsOpen(false);
      setThemeMenuOpen(false);
      settingsButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isCreatorResetDialogOpen, isFastModeConfirmOpen, isSettingsOpen, isTestResetDialogOpen]);

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

  const changeFastMode = (enabled: boolean) => {
    if (enabled) {
      setFastModeConfirmOpen(true);
      return;
    }
    setFastMode(false);
    saveFastMode(false);
  };

  const confirmFastMode = () => {
    setFastMode(true);
    saveFastMode(true);
    setFastModeConfirmOpen(false);
  };

  const closeCreatorReset = () => {
    setCreatorResetDialogOpen(false);
    setCreatorResetConfirmation("");
    setCreatorResetError("");
  };

  const closeTestReset = () => {
    setTestResetDialogOpen(false);
    setTestResetSnsCode("YOUTUBE");
    setTestResetAccountId(TEST_RESET_DEFAULT_ACCOUNT_IDS.YOUTUBE);
    setTestResetError("");
  };

  const openTestReset = () => {
    setResetFeedback(null);
    setTestResetSnsCode("YOUTUBE");
    setTestResetAccountId(TEST_RESET_DEFAULT_ACCOUNT_IDS.YOUTUBE);
    setTestResetError("");
    setTestResetDialogOpen(true);
    setThemeMenuOpen(false);
  };

  const resetTestAccount = async () => {
    setTestResetting(true);
    setTestResetError("");
    try {
      const result = await resetSelectorTestAccount({
        snsCode: testResetSnsCode,
        accountId: testResetAccountId,
      });
      closeTestReset();
      setResetFeedback(
        `${result.accountId} 계정을 리셋했습니다. 셀렉터스 ${result.selectorsIds.length}건,`
        + ` 지원 ${result.applicationIds.length}건 포함 ${result.deletedRowCount}행을 삭제했습니다.`,
      );
    } catch (error) {
      setTestResetError(
        error instanceof Error ? error.message : "셀렉터스 데이터 삭제에 실패했습니다.",
      );
    } finally {
      setTestResetting(false);
    }
  };

  const resetPool = async () => {
    setCreatorResetting(true);
    setCreatorResetError("");
    try {
      const result = await resetCreatorPool();
      closeCreatorReset();
      setResetFeedback(`크리에이터 풀 ${result.softDeletedCount}건을 초기화했습니다.`);
      window.dispatchEvent(new Event(CREATOR_POOL_RESET_EVENT));
    } catch (error) {
      setCreatorResetError(
        error instanceof Error ? error.message : "크리에이터 풀 초기화에 실패했습니다.",
      );
    } finally {
      setCreatorResetting(false);
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
          const menuItems = getGroupMenuItems(routes, group.id);
          const directItem = group.id === "dashboard" ? menuItems[0] : undefined;
          const isGroupSelected = group.id === activeRoute.group;

          if (directItem) {
            const isRouteExact = matchPath({ path: directItem.path, end: true }, currentPath) != null;

            return (
              <section
                key={group.id}
                className="hsas-admin-sidebar__group"
                data-selected-group={isGroupSelected ? "true" : undefined}
              >
                <Link
                  aria-current={isGroupSelected && isRouteExact ? "page" : undefined}
                  className={
                    isGroupSelected
                      ? "hsas-admin-sidebar__group-toggle hsas-admin-sidebar__direct-link hsas-admin-sidebar__link--active"
                      : "hsas-admin-sidebar__group-toggle hsas-admin-sidebar__direct-link"
                  }
                  data-section-selected={isGroupSelected ? "true" : undefined}
                  data-route-exact={isRouteExact ? "true" : undefined}
                  to={directItem.path}
                >
                  <Icon aria-hidden="true" />
                  <span>{directItem.menuLabel}</span>
                </Link>
              </section>
            );
          }

          const headingId = `hsas-admin-sidebar-group-${group.id}`;
          const listId = `${headingId}-items`;
          const isExpanded = expandedGroups.has(group.id);

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
                {menuItems.map((item) => {
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
          <div
            className="hsas-theme-settings-anchor"
            ref={settingsRef}
          >
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
                  <div
                    className="hsas-theme-settings__submenu-anchor"
                    onMouseEnter={() => setThemeMenuOpen(true)}
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
                  </div>
                  <Switch
                    checked={fastMode}
                    className="hsas-theme-settings__fast-mode"
                    label={(
                      <>
                        <Zap aria-hidden="true" className="hsas-theme-settings__fast-mode-icon" />
                        <span>FAST 모드</span>
                      </>
                    )}
                    onChange={(event) => changeFastMode(event.currentTarget.checked)}
                    title="수동 콘텐츠 배치에서 DB에 등록된 테스트 계정만 확인합니다."
                  />
                  <Switch
                    checked={autoRejectionEnabled}
                    className="hsas-theme-settings__fast-mode"
                    label={(
                      <>
                        <UserRoundX aria-hidden="true" className="hsas-theme-settings__fast-mode-icon" />
                        <span>지원자 자동 반려</span>
                      </>
                    )}
                    onChange={(event) => saveAutoRejectionEnabled(event.currentTarget.checked)}
                    title="팔로워·구독자 500명 이하 또는 최근 90일 콘텐츠 3건 이하인 지원자를 자동 반려로 분류합니다."
                  />
                  <Switch
                    checked={creatorDiscoveryCurrentMonthOnly}
                    className="hsas-theme-settings__fast-mode"
                    label={(
                      <>
                        <CalendarDays aria-hidden="true" className="hsas-theme-settings__fast-mode-icon" />
                        <span>이번 달 영상만 발굴</span>
                      </>
                    )}
                    onChange={(event) => {
                      const enabled = event.currentTarget.checked;
                      setCreatorDiscoveryCurrentMonthOnly(enabled);
                      saveCreatorDiscoveryCurrentMonthOnly(enabled);
                    }}
                    title="키워드별 인기 영상을 이번 달 업로드로 제한합니다."
                  />
                  <button
                    className="hsas-theme-settings__item hsas-theme-settings__item--danger"
                    onClick={() => {
                      setResetFeedback(null);
                      setCreatorResetDialogOpen(true);
                      setThemeMenuOpen(false);
                    }}
                    type="button"
                  >
                    <RotateCcw aria-hidden="true" />
                    <span>크리에이터 풀 초기화</span>
                  </button>
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
                  <button
                    className="hsas-theme-settings__item hsas-theme-settings__item--danger"
                    onClick={() => {
                      openTestReset();
                    }}
                    type="button"
                  >
                    <UserRoundX aria-hidden="true" />
                    <span>테스트용 셀렉터스 삭제</span>
                  </button>
                </div>
                {resetFeedback ? (
                  <p className="hsas-theme-settings__feedback" role="status">
                    {resetFeedback}
                  </p>
                ) : null}
              </div>
            )}
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
              description={(
                <>
                  현재 활동 기수의 최종 승인·반려와 위반 판정을 초기화합니다.
                  <br />
                  패널티, 블랙리스트, 감사 이력은 유지됩니다.
                </>
              )}
              open={isResetDialogOpen}
              title="검수 상태를 초기화할까요?"
            />
            <BubbleDialog
              actions={(
                <>
                  <Button onClick={() => setFastModeConfirmOpen(false)}>취소</Button>
                  <Button onClick={confirmFastMode} variant="primary">FAST 모드 켜기</Button>
                </>
              )}
              description="FAST 모드에서는 수동 콘텐츠 배치가 DB에 등록된 테스트 계정만 대상으로 실행됩니다."
              onClose={() => setFastModeConfirmOpen(false)}
              open={isFastModeConfirmOpen}
              title="FAST 모드를 켤까요?"
            />
            <Modal
              actions={(
                <>
                  <Button disabled={isCreatorResetting} onClick={closeCreatorReset}>취소</Button>
                  <Button
                    disabled={isCreatorResetting
                      || creatorResetConfirmation !== CREATOR_POOL_RESET_CONFIRMATION}
                    onClick={() => void resetPool()}
                    variant="danger"
                  >
                    {isCreatorResetting ? "초기화 중..." : "초기화"}
                  </Button>
                </>
              )}
              ariaDescribedBy={creatorResetDescriptionId}
              onClose={isCreatorResetting ? undefined : closeCreatorReset}
              open={isCreatorResetDialogOpen}
              role="alertdialog"
              title="크리에이터 풀 초기화"
            >
              <div id={creatorResetDescriptionId}>
                <p>현재 YouTube·Instagram 크리에이터가 목록과 후보에서 모두 숨겨집니다.</p>
                <p>제안·리포트 이력은 보존되며, 다음 풀 구축에서 조건을 통과한 계정만 복원됩니다.</p>
              </div>
              <FormRow
                label={`계속하려면 “${CREATOR_POOL_RESET_CONFIRMATION}”를 입력하세요.`}
                required
              >
                <TextInput
                  aria-label="초기화 확인 문구"
                  autoComplete="off"
                  disabled={isCreatorResetting}
                  onChange={(event) => setCreatorResetConfirmation(event.target.value)}
                  value={creatorResetConfirmation}
                />
              </FormRow>
              {creatorResetError ? <p role="alert">{creatorResetError}</p> : null}
            </Modal>
            <Modal
              actions={(
                <>
                  <Button disabled={isTestResetting} onClick={closeTestReset}>취소</Button>
                  <Button
                    disabled={isTestResetting
                      || !testResetAccountId.trim()}
                    onClick={() => void resetTestAccount()}
                    variant="danger"
                  >
                    {isTestResetting ? "삭제 중..." : "영구 삭제"}
                  </Button>
                </>
              )}
              ariaDescribedBy={testResetDescriptionId}
              onClose={isTestResetting ? undefined : closeTestReset}
              open={isTestResetDialogOpen}
              role="alertdialog"
              title="셀렉터스 데이터 영구 삭제"
            >
              <div id={testResetDescriptionId}>
                <p>
                  입력한 SNS 계정의 셀렉터스와 지원서, 그리고 연결된 콘텐츠·검수·패널티·정산·구매
                  기록을 모두 물리 삭제합니다.
                </p>
                <p>로그인 계정은 유지되며 같은 HiID로 지원부터 다시 진행할 수 있습니다.</p>
              </div>
              <FormRow label="플랫폼" required>
                <Select
                  aria-label="삭제 대상 플랫폼"
                  disabled={isTestResetting}
                  onChange={(event) => {
                    const snsCode = event.target.value as SelectorSnsCode;
                    setTestResetSnsCode(snsCode);
                    setTestResetAccountId(TEST_RESET_DEFAULT_ACCOUNT_IDS[snsCode]);
                    setTestResetError("");
                  }}
                  options={TEST_RESET_SNS_OPTIONS}
                  value={testResetSnsCode}
                />
              </FormRow>
              <FormRow label="계정 ID" required>
                <TextInput
                  aria-label="삭제 대상 계정 ID"
                  autoComplete="off"
                  disabled={isTestResetting}
                  onChange={(event) => {
                    setTestResetAccountId(event.target.value);
                    setTestResetError("");
                  }}
                  placeholder={TEST_RESET_DEFAULT_ACCOUNT_IDS[testResetSnsCode]}
                  value={testResetAccountId}
                />
              </FormRow>
              {testResetError ? <p role="alert">{testResetError}</p> : null}
            </Modal>
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
