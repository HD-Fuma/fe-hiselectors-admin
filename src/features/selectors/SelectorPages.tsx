import { useEffect, useId, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { ViewModeToggle } from "../../components/ui/ViewModeToggle";
import {
  createGeneration,
  getGenerations,
  getSelector,
  getSelectorFilterGenerations,
  getSelectors,
  SelectorDetailPanel,
  updateGeneration,
  updateGenerationStatus,
  type Generation,
  type GenerationStatus,
  type SelectorDetail,
  type SelectorFilterGeneration,
  type SelectorSnsCode,
  type SelectorSummary,
  type SpringPage,
} from "../../entities/selectors";
import {
  getSettlementSelectorDetail,
  type SettlementSelectorDetail,
} from "../../entities/settlement";
import { SelectorPoolCanvas } from "./SelectorPoolCanvas";
import { formatNumber } from "../../lib/formatters";
import { paginate } from "../../lib/pagination";

const COHORT_STATUS_CATEGORIES = [
  { label: "활성", value: "ACTIVE" },
  { label: "비활성", value: "INACTIVE" },
] as const;
const SELECTOR_SNS_OPTIONS = [
  { label: "전체", value: "" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "YouTube", value: "YOUTUBE" },
];
const SELECTOR_STATUS_CATEGORIES = [
  { label: "활동중", value: "ACTIVE" },
  { label: "활동정지", value: "INACTIVE" },
  { label: "블랙리스트", value: "BLACKLIST" },
];
function cohortStatusTone(
  status: GenerationStatus,
): NonNullable<StatusPillProps["tone"]> {
  if (status === "ACTIVE") {
    return "approved";
  }
  return "neutral";
}

function cohortStatusLabel(status: GenerationStatus) {
  return status === "ACTIVE" ? "활성" : "비활성";
}

function selectorListStatusTone(
  roleId: string,
): NonNullable<StatusPillProps["tone"]> {
  if (roleId === "ACTIVE") return "approved";
  if (roleId === "BLACKLIST") return "rejected";
  return "neutral";
}

const COHORT_COLUMNS: DenseTableColumn<Generation>[] = [
  { key: "id", header: "기수 ID", width: 86, align: "center" },
  { key: "generationName", header: "기수명", width: 110, align: "center" },
  {
    id: "recruitmentPeriod",
    header: "모집 기간",
    width: 210,
    align: "center",
    render: (cohort) => `${cohort.startDate.slice(0, 10)} ~ ${cohort.endDate.slice(0, 10)}`,
  },
  {
    id: "activityPeriod",
    header: "활동 기간",
    width: 210,
    align: "center",
    render: (cohort) => `${cohort.activityStartDate.slice(0, 10)} ~ ${cohort.activityEndDate.slice(0, 10)}`,
  },
  {
    key: "status",
    header: "기수 상태",
    width: 100,
    align: "center",
    render: (cohort) => (
      <StatusPill tone={cohortStatusTone(cohort.status)}>{cohortStatusLabel(cohort.status)}</StatusPill>
    ),
  },
];

const COHORT_PAGE_SIZE = 20;

function sortGenerations(generations: Generation[]) {
  return [...generations].sort((left, right) => (
    right.startDate.localeCompare(left.startDate) || right.id - left.id
  ));
}

type GenerationFormValues = Pick<
  Generation,
  "activityEndDate" | "activityStartDate" | "endDate" | "generationName" | "startDate"
>;

function validateGeneration(values: GenerationFormValues) {
  if (!values.generationName.trim()
    || !values.startDate
    || !values.endDate
    || !values.activityStartDate
    || !values.activityEndDate) {
    return "기수명과 모집·활동 기간을 모두 입력해 주세요.";
  }
  if (values.startDate > values.endDate) {
    return "모집 종료일은 모집 시작일보다 빠를 수 없습니다.";
  }
  if (values.activityStartDate > values.activityEndDate) {
    return "활동 종료일은 활동 시작일보다 빠를 수 없습니다.";
  }
  return "";
}

export function CohortManagementPage() {
  const createFormId = useId();
  const [cohorts, setCohorts] = useState<Generation[]>([]);
  const [keyword, setKeyword] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedPeriodStart, setAppliedPeriodStart] = useState("");
  const [appliedPeriodEnd, setAppliedPeriodEnd] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<GenerationStatus | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(COHORT_PAGE_SIZE);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailCohort, setDetailCohort] = useState<Generation | null>(null);
  const [editingCohort, setEditingCohort] = useState<Generation | null>(null);
  const [isCohortLoading, setIsCohortLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const cohortRevisionRef = useRef(0);
  const overlayRevisionRef = useRef(0);
  const [newCohort, setNewCohort] = useState({
    activityEndDate: "",
    activityStartDate: "",
    endDate: "",
    generationName: "",
    startDate: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    const revision = cohortRevisionRef.current;
    getGenerations(controller.signal).then((result) => {
      if (controller.signal.aborted || cohortRevisionRef.current !== revision) return;
      setCohorts(sortGenerations(result));
      setListError("");
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted && cohortRevisionRef.current === revision) {
        setListError(reason instanceof Error ? reason.message : "기수 목록 조회에 실패했습니다.");
      }
    }).finally(() => {
      if (!controller.signal.aborted && cohortRevisionRef.current === revision) {
        setIsCohortLoading(false);
      }
    });
    return () => controller.abort();
  }, []);

  const filteredCohorts = cohorts.filter((cohort) => (
    (!appliedKeyword || cohort.generationName.toLowerCase().includes(appliedKeyword.toLowerCase()))
    && (!appliedPeriodStart || cohort.endDate.slice(0, 10) >= appliedPeriodStart)
    && (!appliedPeriodEnd || cohort.startDate.slice(0, 10) <= appliedPeriodEnd)
    && (!selectedStatus || cohort.status === selectedStatus)
  ));
  const {
    currentPage,
    pagedItems: pagedCohorts,
    totalPages,
  } = paginate(filteredCohorts, page, pageSize);
  const resetFilters = () => {
    setKeyword("");
    setPeriodStart("");
    setPeriodEnd("");
    setAppliedKeyword("");
    setAppliedPeriodStart("");
    setAppliedPeriodEnd("");
    setSelectedStatus(null);
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedKeyword(keyword);
    setAppliedPeriodStart(periodStart);
    setAppliedPeriodEnd(periodEnd);
    setPage(1);
  };

  const openCreatePanel = () => {
    overlayRevisionRef.current += 1;
    setNewCohort({
      activityEndDate: "",
      activityStartDate: "",
      endDate: "",
      generationName: "",
      startDate: "",
    });
    setFormError("");
    setIsCreateOpen(true);
  };

  const closeCreatePanel = () => {
    overlayRevisionRef.current += 1;
    setIsCreateOpen(false);
    setFormError("");
  };

  const closeCohortDetail = () => {
    overlayRevisionRef.current += 1;
    setEditingCohort(null);
    setDetailCohort(null);
    setFormError("");
  };

  const createCohort = async () => {
    const generationName = newCohort.generationName.trim();
    const validationError = validateGeneration(newCohort);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const overlayRevision = overlayRevisionRef.current;
    cohortRevisionRef.current += 1;
    setIsCohortLoading(false);
    setIsSaving(true);
    setFormError("");
    try {
      const created = await createGeneration({
        generationName,
        startDate: `${newCohort.startDate}T00:00:00`,
        endDate: `${newCohort.endDate}T23:59:59`,
        activityStartDate: `${newCohort.activityStartDate}T00:00:00`,
        activityEndDate: `${newCohort.activityEndDate}T23:59:59`,
      });
      setCohorts((current) => sortGenerations([...current, created]));
      if (overlayRevisionRef.current === overlayRevision) {
        resetFilters();
        setIsCreateOpen(false);
      }
    } catch (reason: unknown) {
      if (overlayRevisionRef.current === overlayRevision) {
        setFormError(reason instanceof Error ? reason.message : "기수 생성에 실패했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const saveCohort = async () => {
    if (!editingCohort) return;
    const generationName = editingCohort.generationName.trim();
    const validationError = validateGeneration(editingCohort);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const overlayRevision = overlayRevisionRef.current;
    cohortRevisionRef.current += 1;
    setIsSaving(true);
    setFormError("");
    try {
      const updated = await updateGeneration(editingCohort.id, {
        generationName,
        startDate: `${editingCohort.startDate.slice(0, 10)}T00:00:00`,
        endDate: `${editingCohort.endDate.slice(0, 10)}T23:59:59`,
        activityStartDate: `${editingCohort.activityStartDate.slice(0, 10)}T00:00:00`,
        activityEndDate: `${editingCohort.activityEndDate.slice(0, 10)}T23:59:59`,
      });
      setCohorts((current) => sortGenerations(current.map((cohort) => (
        cohort.id === updated.id ? updated : cohort
      ))));
      if (overlayRevisionRef.current === overlayRevision) {
        setDetailCohort(updated);
        setEditingCohort(null);
      }
    } catch (reason: unknown) {
      if (overlayRevisionRef.current === overlayRevision) {
        setFormError(reason instanceof Error ? reason.message : "기수 수정에 실패했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCohortStatus = async () => {
    if (!detailCohort) return;
    const overlayRevision = overlayRevisionRef.current;
    cohortRevisionRef.current += 1;
    setIsSaving(true);
    setFormError("");
    try {
      const updated = await updateGenerationStatus(
        detailCohort.id,
        detailCohort.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      );
      setCohorts((current) => sortGenerations(current.map((cohort) => (
        cohort.id === updated.id ? updated : cohort
      ))));
      if (overlayRevisionRef.current === overlayRevision) {
        setDetailCohort(updated);
      }
    } catch (reason: unknown) {
      if (overlayRevisionRef.current === overlayRevision) {
        setFormError(reason instanceof Error ? reason.message : "기수 상태 변경에 실패했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="fuma-page">
      <PageHeader title="셀렉터스 기수 관리" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-cohort-search">
          <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
            <FilterField htmlFor="cohort-name" label="기수명">
              <TextInput id="cohort-name" name="cohortName" onChange={(event) => setKeyword(event.target.value)} placeholder="기수명 검색" value={keyword} />
            </FilterField>
            <FilterField htmlFor="cohort-period-start" label="모집 기간">
              <div className="fuma-cohort-date-range">
                <TextInput
                  aria-label="모집 기간 시작일"
                  id="cohort-period-start"
                  max={periodEnd || undefined}
                  onChange={(event) => setPeriodStart(event.target.value)}
                  type="date"
                  value={periodStart}
                />
                <span aria-hidden="true">~</span>
                <TextInput
                  aria-label="모집 기간 종료일"
                  id="cohort-period-end"
                  min={periodStart || undefined}
                  onChange={(event) => setPeriodEnd(event.target.value)}
                  type="date"
                  value={periodEnd}
                />
              </div>
            </FilterField>
          </SearchPanel>
        </div>
        <ChoiceTabs
          actions={<Button disabled={isCohortLoading || isSaving} onClick={openCreatePanel} variant="primary">기수 생성</Button>}
          ariaLabel="기수 상태"
          className="fuma-list-action-toolbar"
          emptyOption={{
            label: "전체",
            onSelect: () => {
              setSelectedStatus(null);
              setPage(1);
            },
          }}
          onChange={(status) => {
            setSelectedStatus(status);
            setPage(1);
          }}
          options={COHORT_STATUS_CATEGORIES}
          value={selectedStatus}
        />
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={<span>총 {filteredCohorts.length}건</span>}
          title="기수 목록"
        />
        <div aria-label="기수 목록" className="fuma-wide-table" role="region">
          {listError ? (
            <div role="alert"><EmptyState description={listError} title="목록을 불러오지 못했습니다" /></div>
          ) : (
            <DenseTable
              columns={COHORT_COLUMNS}
              emptyMessage={isCohortLoading
                ? <span aria-live="polite" role="status">기수를 불러오는 중입니다.</span>
                : "조회된 기수가 없습니다."}
              onRowClick={(cohort) => {
                overlayRevisionRef.current += 1;
                setDetailCohort(cohort);
                setFormError("");
              }}
              rowKey={(cohort) => cohort.id}
              rows={pagedCohorts}
            />
          )}
        </div>
        <Pagination
          onPageChange={!isCohortLoading && !listError ? setPage : undefined}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
          page={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
        />
      </div>
      {isCreateOpen ? (
        <SidePanel
          actions={(
            <>
              <Button disabled={isSaving} onClick={closeCreatePanel}>취소</Button>
              <Button disabled={isSaving} form={createFormId} type="submit" variant="primary">
                {isSaving ? "생성 중..." : "생성"}
              </Button>
            </>
          )}
          onClose={closeCreatePanel}
          title="새 기수 생성"
        >
          <div className="fuma-detail-panel__content fuma-campaign-editor-panel">
            {formError ? <p role="alert">{formError}</p> : null}
            <form
              className="fuma-campaign-editor"
              id={createFormId}
              onSubmit={(event) => {
                event.preventDefault();
                void createCohort();
              }}
            >
              <header className="fuma-campaign-editor__intro">
                <div>
                  <strong>새 기수 정보</strong>
                  <span>기수명, 모집 기간과 활동 기간을 설정합니다.</span>
                </div>
              </header>
              <section className="fuma-campaign-form-section">
                <header><h3>기본 정보</h3></header>
                <div className="fuma-campaign-form">
                  <FormRow label="기수명" required><TextInput aria-label="기수명" maxLength={30} onChange={(event) => setNewCohort((current) => ({ ...current, generationName: event.target.value }))} required value={newCohort.generationName} /></FormRow>
                  <FormRow label="모집 시작일" required><TextInput aria-label="모집 시작일" max={newCohort.endDate || undefined} onChange={(event) => setNewCohort((current) => ({ ...current, startDate: event.target.value }))} required type="date" value={newCohort.startDate} /></FormRow>
                  <FormRow label="모집 종료일" required><TextInput aria-label="모집 종료일" min={newCohort.startDate || undefined} onChange={(event) => setNewCohort((current) => ({ ...current, endDate: event.target.value }))} required type="date" value={newCohort.endDate} /></FormRow>
                  <FormRow label="활동 시작일" required><TextInput aria-label="활동 시작일" max={newCohort.activityEndDate || undefined} onChange={(event) => setNewCohort((current) => ({ ...current, activityStartDate: event.target.value }))} required type="date" value={newCohort.activityStartDate} /></FormRow>
                  <FormRow label="활동 종료일" required><TextInput aria-label="활동 종료일" min={newCohort.activityStartDate || undefined} onChange={(event) => setNewCohort((current) => ({ ...current, activityEndDate: event.target.value }))} required type="date" value={newCohort.activityEndDate} /></FormRow>
                </div>
              </section>
            </form>
          </div>
        </SidePanel>
      ) : null}
      {detailCohort ? (
        <SidePanel
          actions={editingCohort ? (
            <>
              <Button disabled={isSaving} onClick={() => {
                overlayRevisionRef.current += 1;
                setEditingCohort(null);
                setFormError("");
              }}>취소</Button>
              <Button disabled={isSaving} onClick={saveCohort} variant="primary">저장</Button>
            </>
          ) : (
            <>
              <Button disabled={isSaving} onClick={toggleCohortStatus}>
                {detailCohort.status === "ACTIVE" ? "비활성화" : "활성화"}
              </Button>
              <Button disabled={isSaving} onClick={() => {
                overlayRevisionRef.current += 1;
                setEditingCohort({
                  ...detailCohort,
                  startDate: detailCohort.startDate.slice(0, 10),
                  endDate: detailCohort.endDate.slice(0, 10),
                  activityStartDate: detailCohort.activityStartDate.slice(0, 10),
                  activityEndDate: detailCohort.activityEndDate.slice(0, 10),
                });
                setFormError("");
              }} variant="primary">
                수정
              </Button>
            </>
          )}
          onClose={closeCohortDetail}
          title={editingCohort ? `${detailCohort.generationName} 수정` : `${detailCohort.generationName} 상세`}
        >
          <div className="fuma-detail-panel__content fuma-cohort-detail-panel">
            <div className="fuma-cohort-detail">
              {editingCohort ? (
                <section aria-label="기수 정보 수정" className="fuma-cohort-detail__edit">
                  <FormRow label="기수 ID"><TextInput aria-label="기수 ID" readOnly value={editingCohort.id} /></FormRow>
                  <FormRow label="기수명" required><TextInput aria-label="기수명" maxLength={30} onChange={(event) => setEditingCohort((current) => current ? { ...current, generationName: event.target.value } : current)} required value={editingCohort.generationName} /></FormRow>
                  <FormRow label="모집 시작일" required><TextInput aria-label="모집 시작일" max={editingCohort.endDate || undefined} onChange={(event) => setEditingCohort((current) => current ? { ...current, startDate: event.target.value } : current)} type="date" value={editingCohort.startDate} /></FormRow>
                  <FormRow label="모집 종료일" required><TextInput aria-label="모집 종료일" min={editingCohort.startDate || undefined} onChange={(event) => setEditingCohort((current) => current ? { ...current, endDate: event.target.value } : current)} type="date" value={editingCohort.endDate} /></FormRow>
                  <FormRow label="활동 시작일" required><TextInput aria-label="활동 시작일" max={editingCohort.activityEndDate || undefined} onChange={(event) => setEditingCohort((current) => current ? { ...current, activityStartDate: event.target.value } : current)} type="date" value={editingCohort.activityStartDate} /></FormRow>
                  <FormRow label="활동 종료일" required><TextInput aria-label="활동 종료일" min={editingCohort.activityStartDate || undefined} onChange={(event) => setEditingCohort((current) => current ? { ...current, activityEndDate: event.target.value } : current)} type="date" value={editingCohort.activityEndDate} /></FormRow>
                </section>
              ) : (
                <dl className="fuma-cohort-detail__summary">
                  <div><dt>기수 ID</dt><dd>{detailCohort.id}</dd></div>
                  <div><dt>기수명</dt><dd>{detailCohort.generationName}</dd></div>
                  <div><dt>모집 기간</dt><dd>{detailCohort.startDate.slice(0, 10)} ~ {detailCohort.endDate.slice(0, 10)}</dd></div>
                  <div><dt>활동 기간</dt><dd>{detailCohort.activityStartDate.slice(0, 10)} ~ {detailCohort.activityEndDate.slice(0, 10)}</dd></div>
                  <div><dt>기수 상태</dt><dd><StatusPill tone={cohortStatusTone(detailCohort.status)}>{cohortStatusLabel(detailCohort.status)}</StatusPill></dd></div>
                </dl>
              )}
              {formError ? <p role="alert">{formError}</p> : null}
            </div>
          </div>
        </SidePanel>
      ) : null}
    </section>
  );
}

function selectorPlatform(snsCode: SelectorSnsCode | null) {
  if (snsCode === "INSTAGRAM") return "Instagram";
  if (snsCode === "YOUTUBE") return "YouTube";
  return null;
}

const SELECTOR_COLUMNS: DenseTableColumn<SelectorSummary>[] = [
  { key: "id", header: "셀렉터스 ID", width: 110, align: "center" },
  { key: "selectorsCode", header: "셀렉터스 코드", width: 120, align: "center" },
  {
    key: "snsAccountId",
    header: "SNS 계정",
    width: 150,
    align: "center",
    render: (selector) => selector.snsDisplayName || selector.snsAccountId || "-",
  },
  {
    key: "snsCode",
    header: "플랫폼",
    width: 110,
    align: "center",
    render: (selector) => {
      const platform = selectorPlatform(selector.snsCode);
      return platform ? (
        <span className="fuma-platform-label">
          <PlatformIcon platform={platform} />
          <span aria-hidden="true">{platform}</span>
        </span>
      ) : "-";
    },
  },
  { key: "followerCount", header: "팔로워", width: 90, align: "right", render: (selector) => selector.followerCount == null ? "-" : formatNumber(selector.followerCount) },
  {
    key: "roleName",
    header: "활동 상태",
    width: 88,
    align: "center",
    render: (selector) => <StatusPill tone={selectorListStatusTone(selector.roleId)}>{selector.roleName || selector.roleId}</StatusPill>,
  },
  { key: "createdAt", header: "등록일", width: 104, align: "center", render: (selector) => selector.createdAt?.slice(0, 10) || "-" },
];

const SELECTOR_PAGE_SIZE = 20;
const POOL_PAGE_SIZE = 200;
// 버블/도크에 마우스를 올릴 때 상세를 미리 받아 둔다(모달이 즉시 뜨도록).
const selectorDetailCache = new Map<number, Promise<SelectorDetail>>();

function prefetchSelectorDetail(id: number) {
  const cached = selectorDetailCache.get(id);
  if (cached) return cached;
  const pending = getSelector(id);
  selectorDetailCache.set(id, pending);
  pending.catch(() => selectorDetailCache.delete(id));
  return pending;
}
type SelectorViewMode = "pool" | "table";

export function SelectorOverviewPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<SelectorViewMode>("pool");
  // 버블에서 고른 셀렉터스는 화면 이동 없이 가운데 모달로 보여준다.
  const [poolDetail, setPoolDetail] = useState<{
    id: number;
    detail: SelectorDetail | null;
    error: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [generationId, setGenerationId] = useState("");
  const [sns, setSns] = useState("");
  const [appliedName, setAppliedName] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedGenerationId, setAppliedGenerationId] = useState("");
  const [appliedSns, setAppliedSns] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(SELECTOR_PAGE_SIZE);
  const [pageData, setPageData] = useState<SpringPage<SelectorSummary> | null>(null);
  const [listError, setListError] = useState("");
  const [generations, setGenerations] = useState<SelectorFilterGeneration[]>([]);
  const selectorListTitle = selectedStatus === "ACTIVE"
    ? "활동 중인 셀렉터스 목록"
    : selectedStatus === "INACTIVE"
      ? "활동 정지 셀렉터스 목록"
      : selectedStatus === "BLACKLIST"
        ? "블랙리스트 목록"
        : "셀렉터스 목록";
  // 버블 뷰는 상태 필터가 없는 전체 목록에서만 사용한다.
  const activeView: SelectorViewMode = selectedStatus ? "table" : viewMode;

  useEffect(() => {
    const controller = new AbortController();
    getSelectorFilterGenerations(controller.signal)
      .then(setGenerations)
      .catch(() => { /* the list remains usable without generation options */ });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getSelectors({
      roleId: selectedStatus || undefined,
      generationId: appliedGenerationId ? Number(appliedGenerationId) : undefined,
      nickname: appliedName || appliedKeyword || undefined,
      snsCode: (appliedSns || undefined) as SelectorSnsCode | undefined,
      page: page - 1,
      size: activeView === "pool" ? POOL_PAGE_SIZE : pageSize,
    }, controller.signal).then((result) => {
      setPageData(result);
      setListError("");
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setListError(reason instanceof Error ? reason.message : "셀렉터스 목록 조회에 실패했습니다.");
      }
    });
    return () => controller.abort();
  }, [activeView, appliedGenerationId, appliedKeyword, appliedName, appliedSns, page, pageSize, selectedStatus]);

  const openPoolDetail = (id: number) => {
    setPoolDetail({ id, detail: null, error: "" });
    prefetchSelectorDetail(id).then((detail) => {
      setPoolDetail((current) => current?.id === id ? { ...current, detail } : current);
    }).catch((reason: unknown) => {
      const message = reason instanceof Error ? reason.message : "셀렉터스 상세 조회에 실패했습니다.";
      setPoolDetail((current) => current?.id === id ? { ...current, error: message } : current);
    });
  };

  const applyFilters = () => {
    setAppliedName(name.trim());
    setAppliedKeyword(keyword.trim());
    setAppliedGenerationId(generationId);
    setAppliedSns(sns);
    setPage(1);
  };

  const resetFilters = () => {
    setName("");
    setKeyword("");
    setGenerationId("");
    setSns("");
    setAppliedName("");
    setAppliedKeyword("");
    setAppliedGenerationId("");
    setAppliedSns("");
    setSelectedStatus(null);
    setPage(1);
  };

  return (
    <section className="fuma-page">
      <PageHeader title="셀렉터스 목록" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-selector-search">
          <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
            <FilterField htmlFor="selector-name" label="셀렉터스명">
              <TextInput id="selector-name" name="selectorName" onChange={(event) => setName(event.target.value)} placeholder="셀렉터스명 검색" value={name} />
            </FilterField>
            <FilterField htmlFor="selector-account" label="SNS 계정">
              <TextInput id="selector-account" name="selectorAccount" onChange={(event) => setKeyword(event.target.value)} placeholder="SNS 계정 검색" value={keyword} />
            </FilterField>
            <FilterField htmlFor="selector-sns" label="SNS">
              <Select
                id="selector-sns"
                name="sns"
                onChange={(event) => setSns(event.target.value)}
                options={SELECTOR_SNS_OPTIONS}
                value={sns}
              />
            </FilterField>
            <FilterField htmlFor="selector-cohort" label="기수">
              <Select
                id="selector-cohort"
                name="cohort"
                onChange={(event) => setGenerationId(event.target.value)}
                options={[
                  { label: "전체", value: "" },
                  ...generations.map((generation) => ({
                    label: generation.generationName,
                    value: String(generation.id),
                  })),
                ]}
                value={generationId}
              />
            </FilterField>
          </SearchPanel>
        </div>
        <ResultToolbar
          actions={(
            <ViewModeToggle
              gridLabel="버블"
              listLabel="목록"
              onChange={(mode) => {
                const nextView = mode === "grid" ? "pool" : "table";
                setViewMode(nextView);
                if (nextView === "pool") setSelectedStatus(null);
                setPage(1);
              }}
              value={activeView === "pool" ? "grid" : "list"}
            />
          )}
          className="fuma-simple-result-toolbar"
          title={selectedStatus ? selectorListTitle : null}
        />
        {activeView === "table" ? (
          <ChoiceTabs
            ariaLabel="활동 상태"
            className="fuma-selector-status-filter"
            emptyOption={{
              label: "전체",
              onSelect: () => {
                setSelectedStatus(null);
                setPage(1);
              },
            }}
            onChange={(status) => {
              setSelectedStatus(status);
              setPage(1);
            }}
            options={SELECTOR_STATUS_CATEGORIES}
            value={selectedStatus}
          />
        ) : null}
        {listError ? (
          <EmptyState description={listError} title="목록을 불러오지 못했습니다" />
        ) : activeView === "pool" ? (
          <SelectorPoolCanvas
            onPrefetch={(selector) => { void prefetchSelectorDetail(selector.id); }}
            onSelect={(selector) => openPoolDetail(selector.id)}
            selectors={pageData?.content ?? []}
          />
        ) : (
          <div
            aria-label={selectorListTitle}
            className="fuma-wide-table fuma-settlement-table fuma-selector-list-table"
            role="region"
          >
            <DenseTable
              columns={SELECTOR_COLUMNS}
              emptyMessage={pageData ? "셀렉터스가 없습니다." : "셀렉터스를 불러오는 중입니다."}
              onRowClick={(selector) => navigate(`/selectors/${selector.id}`)}
              rowKey={(selector) => selector.id}
              rows={pageData?.content ?? []}
            />
          </div>
        )}
        {activeView === "table" ? (
          <Pagination
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
            page={page}
            pageSize={pageSize}
            totalPages={Math.max(1, pageData?.totalPages ?? 1)}
          />
        ) : null}
      </div>
      {poolDetail ? (
        <SelectorDetailPanel
          hideSettlement
          onClose={() => setPoolDetail(null)}
          presentation="modal"
          selectorDetail={poolDetail.detail}
          selectorDetailError={poolDetail.error}
          selectorDetailLoading={!poolDetail.detail && !poolDetail.error}
        />
      ) : null}
    </section>
  );
}


export function SelectorDetailPage() {
  const { selectorId } = useParams();
  const navigate = useNavigate();
  const [detailState, setDetailState] = useState<{
    id: number;
    selector: SelectorDetail | null;
    error: string;
    settlementDetail: SettlementSelectorDetail | null;
    settlementDetailError: boolean;
  } | null>(null);
  const numericSelectorId = Number(selectorId);
  const invalidSelectorId = !Number.isSafeInteger(numericSelectorId) || numericSelectorId <= 0;
  const currentDetailState = detailState?.id === numericSelectorId ? detailState : null;

  useEffect(() => {
    const id = Number(selectorId);
    if (!Number.isSafeInteger(id) || id <= 0) return;

    const controller = new AbortController();
    Promise.allSettled([
      getSelector(id, controller.signal),
      getSettlementSelectorDetail(id, controller.signal),
    ]).then(([selectorResult, settlementResult]) => {
      if (controller.signal.aborted) return;
      if (selectorResult.status === "rejected") {
        const reason = selectorResult.reason as unknown;
        setDetailState({
          id,
          selector: null,
          error: reason instanceof Error ? reason.message : "셀렉터스 상세 조회에 실패했습니다.",
          settlementDetail: null,
          settlementDetailError: settlementResult.status === "rejected",
        });
        return;
      }
      setDetailState({
        id,
        selector: selectorResult.value,
        error: "",
        settlementDetail: settlementResult.status === "fulfilled" ? settlementResult.value : null,
        settlementDetailError: settlementResult.status === "rejected",
      });
    });
    return () => controller.abort();
  }, [selectorId]);

  return (
    <>
      <SelectorOverviewPage />
      <SelectorDetailPanel
        onClose={() => navigate("/selectors")}
        selectorDetail={currentDetailState?.selector}
        selectorDetailError={invalidSelectorId
          ? "요청한 셀렉터스 ID가 올바르지 않습니다."
          : currentDetailState?.error}
        selectorDetailLoading={!invalidSelectorId && !currentDetailState}
        settlementDetail={currentDetailState?.settlementDetail ?? null}
        settlementDetailError={currentDetailState?.settlementDetailError ?? false}
        settlementDetailLoading={!invalidSelectorId && !currentDetailState}
      />
    </>
  );
}
