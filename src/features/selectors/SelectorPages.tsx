import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { Modal } from "../../components/ui/Modal";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import {
  createGeneration,
  getGenerations,
  getSelector,
  getSelectorFilterGenerations,
  getSelectorPenalties,
  getSelectors,
  SelectorDetailPanel,
  updateGeneration,
  updateGenerationStatus,
  type Generation,
  type GenerationStatus,
  type SelectorDetail,
  type SelectorFilterGeneration,
  type SelectorPenalty,
  type SelectorSnsCode,
  type SelectorSummary,
  type SpringPage,
} from "../../entities/selectors";
import { formatNumber, formatWon } from "../../lib/formatters";
import { paginate } from "../../lib/pagination";
import {
  SELECTORS,
} from "../../entities/selectors";

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
  { key: "startDate", header: "기수 시작일", width: 130, align: "center", render: (cohort) => cohort.startDate.slice(0, 10) },
  { key: "endDate", header: "기수 종료일", width: 130, align: "center", render: (cohort) => cohort.endDate.slice(0, 10) },
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

export function CohortManagementPage() {
  const [cohorts, setCohorts] = useState<Generation[]>([]);
  const [keyword, setKeyword] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedPeriodStart, setAppliedPeriodStart] = useState("");
  const [appliedPeriodEnd, setAppliedPeriodEnd] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<GenerationStatus | null>(null);
  const [page, setPage] = useState(1);
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
  } = paginate(filteredCohorts, page, COHORT_PAGE_SIZE);
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

  const openCreateModal = () => {
    overlayRevisionRef.current += 1;
    setNewCohort({ endDate: "", generationName: "", startDate: "" });
    setFormError("");
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
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
    if (!generationName || !newCohort.startDate || !newCohort.endDate) {
      setFormError("기수명과 기간을 모두 입력해 주세요.");
      return;
    }
    if (newCohort.startDate > newCohort.endDate) {
      setFormError("종료일은 시작일보다 빠를 수 없습니다.");
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
    if (!generationName || !editingCohort.startDate || !editingCohort.endDate) {
      setFormError("기수명과 기간을 모두 입력해 주세요.");
      return;
    }
    if (editingCohort.startDate > editingCohort.endDate) {
      setFormError("종료일은 시작일보다 빠를 수 없습니다.");
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
            <FilterField htmlFor="cohort-period-start" label="기수 기간">
              <div className="fuma-cohort-date-range">
                <TextInput
                  aria-label="기수 기간 시작일"
                  id="cohort-period-start"
                  max={periodEnd || undefined}
                  onChange={(event) => setPeriodStart(event.target.value)}
                  type="date"
                  value={periodStart}
                />
                <span aria-hidden="true">~</span>
                <TextInput
                  aria-label="기수 기간 종료일"
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
          actions={<Button disabled={isCohortLoading || isSaving} onClick={openCreateModal} variant="primary">기수 생성</Button>}
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
          page={currentPage}
          pageSize={COHORT_PAGE_SIZE}
          totalPages={totalPages}
        />
      </div>
      <Modal
        actions={<><Button disabled={isSaving} onClick={closeCreateModal}>취소</Button><Button disabled={isSaving} onClick={createCohort} variant="primary">생성</Button></>}
        onClose={closeCreateModal}
        open={isCreateOpen}
        title="새 기수 생성"
      >
        <div className="fuma-cohort-create-form">
          <FormRow label="기수명" required><TextInput aria-label="기수명" maxLength={30} onChange={(event) => setNewCohort((current) => ({ ...current, generationName: event.target.value }))} required value={newCohort.generationName} /></FormRow>
          <FormRow label="기수 시작일" required><TextInput aria-label="기수 시작일" max={newCohort.endDate || undefined} onChange={(event) => setNewCohort((current) => ({ ...current, startDate: event.target.value }))} required type="date" value={newCohort.startDate} /></FormRow>
          <FormRow label="기수 종료일" required><TextInput aria-label="기수 종료일" min={newCohort.startDate || undefined} onChange={(event) => setNewCohort((current) => ({ ...current, endDate: event.target.value }))} required type="date" value={newCohort.endDate} /></FormRow>
        </div>
        {formError ? <p role="alert">{formError}</p> : null}
      </Modal>
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
                  <FormRow label="기수 시작일" required><TextInput aria-label="기수 시작일" onChange={(event) => setEditingCohort((current) => current ? { ...current, startDate: event.target.value } : current)} type="date" value={editingCohort.startDate} /></FormRow>
                  <FormRow label="기수 종료일" required><TextInput aria-label="기수 종료일" onChange={(event) => setEditingCohort((current) => current ? { ...current, endDate: event.target.value } : current)} type="date" value={editingCohort.endDate} /></FormRow>
                </section>
              ) : (
                <dl className="fuma-cohort-detail__summary">
                  <div><dt>기수 ID</dt><dd>{detailCohort.id}</dd></div>
                  <div><dt>기수명</dt><dd>{detailCohort.generationName}</dd></div>
                  <div><dt>기수 기간</dt><dd>{detailCohort.startDate.slice(0, 10)} ~ {detailCohort.endDate.slice(0, 10)}</dd></div>
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
  { key: "nickname", header: "닉네임", width: 120, align: "center" },
  { key: "snsAccountId", header: "SNS 계정", width: 150, align: "center", render: (selector) => selector.snsAccountId || "-" },
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

export function SelectorOverviewPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [generationId, setGenerationId] = useState("");
  const [sns, setSns] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedGenerationId, setAppliedGenerationId] = useState("");
  const [appliedSns, setAppliedSns] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
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
      nickname: appliedKeyword || undefined,
      snsCode: (appliedSns || undefined) as SelectorSnsCode | undefined,
      page: page - 1,
      size: SELECTOR_PAGE_SIZE,
    }, controller.signal).then((result) => {
      setPageData(result);
      setListError("");
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setListError(reason instanceof Error ? reason.message : "셀렉터스 목록 조회에 실패했습니다.");
      }
    });
    return () => controller.abort();
  }, [appliedGenerationId, appliedKeyword, appliedSns, page, selectedStatus]);

  const applyFilters = () => {
    setAppliedKeyword(keyword.trim());
    setAppliedGenerationId(generationId);
    setAppliedSns(sns);
    setPage(1);
  };

  const resetFilters = () => {
    setKeyword("");
    setGenerationId("");
    setSns("");
    setAppliedKeyword("");
    setAppliedGenerationId("");
    setAppliedSns("");
    setSelectedStatus(null);
    setPage(1);
  };

  const appliedGeneration = generations.find((generation) => (
    String(generation.id) === appliedGenerationId
  ));
  const appliedPlatform = SELECTOR_SNS_OPTIONS.find((option) => option.value === appliedSns);

  return (
    <section className="fuma-page">
      <PageHeader title="셀렉터스 목록" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-selector-search">
          <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
            <FilterField htmlFor="selector-name" label="닉네임">
              <TextInput id="selector-name" name="selectorName" onChange={(event) => setKeyword(event.target.value)} placeholder="닉네임 검색" value={keyword} />
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
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={
            <>
              <span>{[appliedGeneration?.generationName, appliedPlatform?.label].filter(Boolean).join(" · ") || "전체"}</span>
              <span>총 {pageData?.totalElements ?? 0}건</span>
            </>
          }
          title={selectorListTitle}
        />
        <div
          aria-label={selectorListTitle}
          className="fuma-wide-table fuma-settlement-table fuma-selector-list-table"
          role="region"
        >
          {listError ? (
            <EmptyState description={listError} title="목록을 불러오지 못했습니다" />
          ) : (
            <DenseTable
              columns={SELECTOR_COLUMNS}
              emptyMessage={pageData ? "셀렉터스가 없습니다." : "셀렉터스를 불러오는 중입니다."}
              onRowClick={(selector) => navigate(`/selectors/${selector.id}`)}
              rowKey={(selector) => selector.id}
              rows={pageData?.content ?? []}
            />
          )}
        </div>
        <Pagination
          onPageChange={setPage}
          page={page}
          pageSize={SELECTOR_PAGE_SIZE}
          totalPages={Math.max(1, pageData?.totalPages ?? 1)}
        />
      </div>
    </section>
  );
}


export function SelectorDetailPage() {
  const { selectorId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [detailState, setDetailState] = useState<{
    id: number;
    selector: SelectorDetail | null;
    error: string;
  } | null>(null);
  const fromQualifications = searchParams.get("from") === "qualifications";
  const qualificationReturnQuery = qualificationQuery(
    searchParams.get("generationId"),
    positiveInteger(searchParams.get("page")) ?? 1,
  ).toString();
  const listPath = fromQualifications
    ? `/selectors/qualifications${qualificationReturnQuery ? `?${qualificationReturnQuery}` : ""}`
    : "/selectors";
  const numericSelectorId = Number(selectorId);
  const invalidSelectorId = !Number.isSafeInteger(numericSelectorId) || numericSelectorId <= 0;
  const currentDetailState = detailState?.id === numericSelectorId ? detailState : null;

  useEffect(() => {
    const id = Number(selectorId);
    if (!Number.isSafeInteger(id) || id <= 0) return;

    const controller = new AbortController();
    getSelector(id, controller.signal)
      .then((selector) => setDetailState({ id, selector, error: "" }))
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setDetailState({
            id,
            selector: null,
            error: reason instanceof Error ? reason.message : "셀렉터스 상세 조회에 실패했습니다.",
          });
        }
      });
    return () => controller.abort();
  }, [selectorId]);

  return (
    <>
      {fromQualifications ? <QualificationManagementPage /> : <SelectorOverviewPage />}
      <SelectorDetailPanel
        onClose={() => navigate(listPath)}
        selectorDetail={currentDetailState?.selector}
        selectorDetailError={invalidSelectorId
          ? "요청한 셀렉터스 ID가 올바르지 않습니다."
          : currentDetailState?.error}
        selectorDetailLoading={!invalidSelectorId && !currentDetailState}
      />
    </>
  );
}

const QUALIFICATION_COLUMNS: DenseTableColumn<SelectorPenalty>[] = [
  { key: "selectorsId", header: "셀렉터스 ID", width: 110, align: "center" },
  { key: "selectorsCode", header: "셀렉터스 코드", width: 130, align: "center" },
  { key: "selectorsNickname", header: "닉네임", width: 130, align: "center" },
  {
    key: "totalPenaltyCount",
    header: "누적 패널티",
    width: 100,
    align: "center",
    render: (qualification) => `${qualification.totalPenaltyCount}회`,
  },
  {
    key: "activePenaltyCount",
    header: "활성 패널티",
    width: 100,
    align: "center",
    render: (qualification) => `${qualification.activePenaltyCount}회`,
  },
  {
    key: "blacklistTarget",
    header: "블랙리스트",
    width: 110,
    align: "center",
    render: (qualification) => (
      <StatusPill tone={qualification.blacklistTarget ? "rejected" : "neutral"}>
        {qualification.blacklistTarget ? "대상" : "비대상"}
      </StatusPill>
    ),
  },
];

const BLACKLIST_PAGE_SIZE = 20;

function positiveInteger(value: string | null) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function qualificationQuery(generationId: string | null, page: number, detail = false) {
  const params = new URLSearchParams();
  const validGenerationId = positiveInteger(generationId);
  if (detail) params.set("from", "qualifications");
  if (validGenerationId) params.set("generationId", String(validGenerationId));
  if (Number.isSafeInteger(page) && page > 1) params.set("page", String(page));
  return params;
}

export function QualificationManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGenerationId = positiveInteger(searchParams.get("generationId"));
  const initialPage = positiveInteger(searchParams.get("page")) ?? 1;
  const [generationId, setGenerationId] = useState(initialGenerationId ? String(initialGenerationId) : "");
  const [appliedGenerationId, setAppliedGenerationId] = useState(initialGenerationId ? String(initialGenerationId) : "");
  const [page, setPage] = useState(initialPage);
  const [requestVersion, setRequestVersion] = useState(0);
  const [pageData, setPageData] = useState<SpringPage<SelectorPenalty> | null>(null);
  const [listError, setListError] = useState("");
  const [generations, setGenerations] = useState<SelectorFilterGeneration[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    getSelectorFilterGenerations(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setGenerations(result);
      })
      .catch(() => { /* the list remains usable without generation options */ });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getSelectorPenalties({
      generationId: appliedGenerationId ? Number(appliedGenerationId) : undefined,
      page: page - 1,
      size: BLACKLIST_PAGE_SIZE,
    }, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setPageData(result);
      setListError("");
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setListError(reason instanceof Error ? reason.message : "블랙리스트 목록 조회에 실패했습니다.");
      }
    });
    return () => controller.abort();
  }, [appliedGenerationId, page, requestVersion]);

  const appliedGeneration = generations.find((generation) => (
    String(generation.id) === appliedGenerationId
  ));

  const applyFilters = () => {
    setPageData(null);
    setListError("");
    setAppliedGenerationId(generationId);
    setPage(1);
    setRequestVersion((current) => current + 1);
    setSearchParams(qualificationQuery(generationId, 1));
  };

  const resetFilters = () => {
    setPageData(null);
    setListError("");
    setGenerationId("");
    setAppliedGenerationId("");
    setPage(1);
    setRequestVersion((current) => current + 1);
    setSearchParams(qualificationQuery("", 1));
  };

  const changePage = (nextPage: number) => {
    setPageData(null);
    setListError("");
    setPage(nextPage);
    setSearchParams(qualificationQuery(appliedGenerationId, nextPage));
  };

  const openDetail = (selectorId: number) => {
    const query = qualificationQuery(appliedGenerationId, page, true);
    navigate(`/selectors/${selectorId}?${query.toString()}`);
  };

  return (
    <section className="fuma-page">
      <PageHeader title="블랙리스트 관리" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-settlement-search--month-only fuma-qualification-search">
          <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
            <FilterField htmlFor="qualification-cohort" label="기수">
              <Select
                id="qualification-cohort"
                name="generationId"
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
          className="fuma-simple-result-toolbar"
          description="블랙리스트는 향후 셀렉터스 지원 및 활동이 불가합니다."
          meta={
            <>
              <span>{appliedGeneration?.generationName || "전체"}</span>
              <span>총 {pageData?.totalElements ?? 0}건</span>
            </>
          }
          title="블랙리스트 목록"
        />
        <div aria-label="블랙리스트 목록" className="fuma-wide-table fuma-settlement-table" role="region">
          {listError ? (
            <div role="alert"><EmptyState description={listError} title="목록을 불러오지 못했습니다" /></div>
          ) : (
            <DenseTable
              columns={QUALIFICATION_COLUMNS}
              emptyMessage={pageData
                ? "블랙리스트 대상이 없습니다."
                : <span aria-live="polite" role="status">블랙리스트를 불러오는 중입니다.</span>}
              onRowClick={(qualification) => openDetail(qualification.selectorsId)}
              rowKey={(qualification) => qualification.selectorsId}
              rows={pageData?.content ?? []}
            />
          )}
        </div>
        <Pagination
          onPageChange={pageData && !listError ? changePage : undefined}
          page={pageData ? page : 1}
          pageSize={BLACKLIST_PAGE_SIZE}
          totalPages={Math.max(1, pageData?.totalPages ?? 1)}
        />
      </div>
    </section>
  );
}

interface ExcellentActivityFixture {
  cohort: string;
  id: string;
  name: string;
  totalSales: number;
  type: string;
}

const EXCELLENT_ACTIVITY_COHORTS = ["2기", "3기", "4기"] as const;
const EXCELLENT_ACTIVITY_RANKS = [1, 2, 3] as const;

const EXCELLENT_ACTIVITIES: readonly ExcellentActivityFixture[] = SELECTORS
  .filter((selector) => selector.status !== "박탈")
  .slice(0, 12)
  .map((selector, index) => {
    const cohort = EXCELLENT_ACTIVITY_COHORTS[Math.floor(index / 4)];
    const typeIndex = index % 4;
    const rank = EXCELLENT_ACTIVITY_RANKS[typeIndex - 1];

    return {
      cohort,
      id: selector.id,
      name: selector.name,
      totalSales: 21_000_000
        + Math.floor(index / 4) * 2_500_000
        + [1_500_000, 18_000_000, 12_000_000, 7_000_000][typeIndex],
      type: typeIndex === 0
        ? "누적 매출 1,000만원 이상 달성"
        : `${cohort} 활동 누적 ${rank}위`,
    };
  })
  .sort((left, right) => right.totalSales - left.totalSales);

const EXCELLENT_ACTIVITY_COHORT_OPTIONS = [
  { label: "전체", value: "" },
  ...EXCELLENT_ACTIVITY_COHORTS.map((cohort) => ({ label: cohort, value: cohort })),
];

const EXCELLENT_SELECTOR_COLUMNS: DenseTableColumn<ExcellentActivityFixture>[] = [
  { key: "id", header: "셀렉터스 ID", width: 130, align: "center" },
  { key: "name", header: "이름", width: 110, align: "center" },
  { key: "cohort", header: "기수", width: 100, align: "center" },
  { key: "type", header: "종류", width: 250, align: "center" },
  {
    key: "totalSales",
    header: "총 매출액",
    width: 160,
    align: "right",
    render: (activity) => formatWon(activity.totalSales),
  },
];

const EXCELLENT_SELECTOR_PAGE_SIZE = 20;

export function ExcellentSelectorListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const [cohort, setCohort] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedCohort, setAppliedCohort] = useState("");
  const [page, setPage] = useState(1);
  const excellentSelectors = EXCELLENT_ACTIVITIES
    .filter((selector) => (
      (!appliedKeyword || [selector.name, selector.id].some((value) => (
        value.toLowerCase().includes(appliedKeyword.toLowerCase())
      )))
      && (!appliedCohort || selector.cohort === appliedCohort)
    ));
  const {
    currentPage,
    pagedItems: pagedSelectors,
    totalPages,
  } = paginate(excellentSelectors, page, EXCELLENT_SELECTOR_PAGE_SIZE);
  const detailSelector = SELECTORS.find((selector) => selector.id === searchParams.get("detail"));

  const applyFilters = () => {
    setAppliedKeyword(keyword);
    setAppliedCohort(cohort);
    setPage(1);
  };

  const openDetail = (selectorId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("detail", selectorId);
    setSearchParams(nextParams);
  };

  const closeDetail = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("detail");
    setSearchParams(nextParams);
  };

  const resetFilters = () => {
    setKeyword("");
    setCohort("");
    setAppliedKeyword("");
    setAppliedCohort("");
    setPage(1);
  };

  return (
    <section className="fuma-page">
      <PageHeader title="우수 활동자" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-qualification-search">
          <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
            <FilterField htmlFor="excellent-selector-name" label="이름 / ID">
              <TextInput
                id="excellent-selector-name"
                name="selectorName"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="이름 / ID 검색"
                value={keyword}
              />
            </FilterField>
            <FilterField htmlFor="excellent-selector-cohort" label="기수">
              <Select
                id="excellent-selector-cohort"
                name="cohort"
                onChange={(event) => setCohort(event.target.value)}
                options={EXCELLENT_ACTIVITY_COHORT_OPTIONS}
                value={cohort}
              />
            </FilterField>
          </SearchPanel>
        </div>
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          description="매출 및 활동 성과가 우수한 셀렉터스입니다."
          meta={
            <>
              <span>{appliedCohort || "전체"}</span>
              <span>총 {excellentSelectors.length}건</span>
            </>
          }
          title="우수 활동자 목록"
        />
        <div aria-label="우수 활동자 목록" className="fuma-wide-table fuma-settlement-table" role="region">
          <DenseTable
            columns={EXCELLENT_SELECTOR_COLUMNS}
            onRowClick={(selector) => openDetail(selector.id)}
            rowKey={(selector) => selector.id}
            rows={pagedSelectors}
          />
        </div>
        <Pagination
          onPageChange={setPage}
          page={currentPage}
          pageSize={EXCELLENT_SELECTOR_PAGE_SIZE}
          totalPages={totalPages}
        />
      </div>
      {detailSelector ? <SelectorDetailPanel onClose={closeDetail} selector={detailSelector} /> : null}
    </section>
  );
}
