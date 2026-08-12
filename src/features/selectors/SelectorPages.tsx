import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { FilterField } from "../../components/ui/FilterField";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { Modal } from "../../components/ui/Modal";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SettlementTable, type SettlementTableRow } from "../../components/ui/SettlementTable";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { formatNumber, formatWon } from "../../lib/formatters";
import { paginate } from "../../lib/pagination";
import {
  COHORTS,
  QUALIFICATIONS,
  SELECTORS,
  type CohortFixture,
  type QualificationFixture,
  type SelectorFixture,
} from "./fixtures";
import { getSelectorDetailData } from "./selectorDetailData";

const COHORT_STATUS_CATEGORIES: CohortFixture["status"][] = ["활성", "비활성"];
const SELECTOR_COHORT_OPTIONS = [
  { label: "전체", value: "" },
  ...COHORTS.map((cohort) => ({ label: cohort.name, value: cohort.name })),
];
const SELECTOR_SNS_OPTIONS = ["전체", "Instagram", "YouTube"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const QUALIFICATION_COHORT_OPTIONS = [
  { label: "전체", value: "" },
  ...Array.from(new Set(QUALIFICATIONS.map((qualification) => qualification.cohort))).map((cohort) => ({
    label: cohort,
    value: cohort,
  })),
];
type SelectorListStatus = "활동중" | "활동정지" | "블랙리스트";

const SELECTOR_STATUS_CATEGORIES: SelectorListStatus[] = [
  "활동중",
  "활동정지",
  "블랙리스트",
];
function selectorStatusTone(
  status: SelectorFixture["status"],
): NonNullable<StatusPillProps["tone"]> {
  if (status === "활동 중") {
    return "approved";
  }
  if (status === "경고") {
    return "pending";
  }
  if (status === "박탈") {
    return "rejected";
  }
  return "neutral";
}

function cohortStatusTone(
  status: CohortFixture["status"],
): NonNullable<StatusPillProps["tone"]> {
  if (status === "활성") {
    return "approved";
  }
  return "neutral";
}

function selectorListStatus(selector: SelectorFixture): SelectorListStatus {
  if (selector.status === "활동 중") return "활동중";
  if (selector.status === "박탈") return "블랙리스트";
  return "활동정지";
}

function selectorListStatusTone(
  status: SelectorListStatus,
): NonNullable<StatusPillProps["tone"]> {
  if (status === "활동중") return "approved";
  if (status === "블랙리스트") return "rejected";
  return "neutral";
}

function calculateCohortStatus(
  startDate: string,
  endDate: string,
): CohortFixture["status"] {
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return startDate <= today && today <= endDate ? "활성" : "비활성";
}

const COHORT_COLUMNS: DenseTableColumn<CohortFixture>[] = [
  { key: "generationId", header: "기수 ID", width: 86, align: "center" },
  { key: "name", header: "기수명", width: 110, align: "center" },
  { key: "startDate", header: "기수 시작일", width: 130, align: "center" },
  { key: "endDate", header: "기수 종료일", width: 130, align: "center" },
  {
    key: "status",
    header: "기수 상태",
    width: 100,
    align: "center",
    render: (cohort) => (
      <StatusPill tone={cohortStatusTone(cohort.status)}>{cohort.status}</StatusPill>
    ),
  },
  {
    key: "participantCount",
    header: "참여자 수",
    width: 90,
    align: "center",
    render: (cohort) => formatNumber(cohort.participantCount),
  },
];

const COHORT_PAGE_SIZE = 20;

const COHORT_SELECTOR_COLUMNS: DenseTableColumn<SelectorFixture>[] = [
  { key: "id", header: "셀렉터스 ID", width: 110 },
  { key: "name", header: "이름", width: 110 },
  { key: "sns", header: "SNS 채널", width: 220 },
];

export function CohortManagementPage() {
  const [cohorts, setCohorts] = useState<CohortFixture[]>(() => [...COHORTS]);
  const [keyword, setKeyword] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedPeriodStart, setAppliedPeriodStart] = useState("");
  const [appliedPeriodEnd, setAppliedPeriodEnd] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<CohortFixture["status"] | null>(null);
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailCohort, setDetailCohort] = useState<CohortFixture | null>(null);
  const [editingCohort, setEditingCohort] = useState<CohortFixture | null>(null);
  const [newCohort, setNewCohort] = useState({
    generationId: 61,
    activityEnd: "2027-03-31",
    activityStart: "2027-01-01",
    name: "테스트기수61",
  });
  const filteredCohorts = cohorts.filter((cohort) => (
    (!appliedKeyword || cohort.name.toLowerCase().includes(appliedKeyword.toLowerCase()))
    && (!appliedPeriodStart || cohort.endDate >= appliedPeriodStart)
    && (!appliedPeriodEnd || cohort.startDate <= appliedPeriodEnd)
    && (!selectedStatus || cohort.status === selectedStatus)
  ));
  const {
    currentPage,
    pagedItems: pagedCohorts,
    totalPages,
  } = paginate(filteredCohorts, page, COHORT_PAGE_SIZE);
  const cohortSelectors = detailCohort
    ? SELECTORS.filter((selector) => selector.cohort === detailCohort.name)
    : [];

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
    const nextGenerationId = Math.max(...cohorts.map((cohort) => cohort.generationId)) + 1;
    setNewCohort((current) => ({
      ...current,
      generationId: nextGenerationId,
      name: `테스트기수${nextGenerationId}`,
    }));
    setIsCreateOpen(true);
  };

  const createCohort = () => {
    const name = newCohort.name.trim();
    if (!name) return;

    setCohorts((current) => [
      {
        endDate: newCohort.activityEnd,
        generationId: newCohort.generationId,
        id: `cohort-${String(newCohort.generationId).padStart(3, "0")}`,
        name,
        participantCount: 0,
        startDate: newCohort.activityStart,
        status: calculateCohortStatus(newCohort.activityStart, newCohort.activityEnd),
      },
      ...current,
    ]);
    setPage(1);
    resetFilters();
    setIsCreateOpen(false);
  };

  const saveCohort = () => {
    if (!editingCohort || !editingCohort.name.trim()) return;

    const updatedCohort: CohortFixture = {
      ...editingCohort,
      name: editingCohort.name.trim(),
      status: calculateCohortStatus(editingCohort.startDate, editingCohort.endDate),
    };
    setCohorts((current) => current.map((cohort) => (
      cohort.id === editingCohort.id
        ? updatedCohort
        : cohort
    )));
    setDetailCohort(updatedCohort);
    setEditingCohort(null);
  };

  return (
    <section className="fuma-page">
      <PageHeader screenCode="SL101" title="셀렉터스 기수 관리" />
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
        <nav aria-label="기수 상태" className="fuma-creator-category-filter fuma-cohort-status-filter">
          <div>
            <button
              aria-pressed={selectedStatus === null}
              className="fuma-creator-category-filter__option"
              onClick={() => {
                setSelectedStatus(null);
                setPage(1);
              }}
              type="button"
            >
              전체
            </button>
            {COHORT_STATUS_CATEGORIES.map((cohortStatus) => (
              <button
                aria-pressed={selectedStatus === cohortStatus}
                className="fuma-creator-category-filter__option"
                key={cohortStatus}
                onClick={() => {
                  setSelectedStatus(cohortStatus);
                  setPage(1);
                }}
                type="button"
              >
                {cohortStatus}
              </button>
            ))}
          </div>
          <Button onClick={openCreateModal} variant="primary">기수 생성</Button>
        </nav>
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={<span>총 {filteredCohorts.length}건</span>}
          title="기수 목록"
        />
        <div aria-label="기수 목록" className="fuma-wide-table" role="region">
          <DenseTable
            columns={COHORT_COLUMNS}
            onRowClick={setDetailCohort}
            rowKey={(cohort) => cohort.id}
            rows={pagedCohorts}
          />
        </div>
        <Pagination
          onPageChange={setPage}
          page={currentPage}
          pageSize={COHORT_PAGE_SIZE}
          totalPages={totalPages}
        />
      </div>
      <Modal
        actions={<><Button onClick={() => setIsCreateOpen(false)}>취소</Button><Button onClick={createCohort} variant="primary">생성</Button></>}
        open={isCreateOpen}
        title="새 기수 생성"
      >
        <div className="fuma-cohort-create-form">
          <FormRow label="기수 ID"><TextInput aria-label="기수 ID" readOnly value={newCohort.generationId} /></FormRow>
          <FormRow label="기수명" required><TextInput aria-label="기수명" onChange={(event) => setNewCohort((current) => ({ ...current, name: event.target.value }))} value={newCohort.name} /></FormRow>
          <FormRow label="기수 시작일" required><TextInput aria-label="기수 시작일" onChange={(event) => setNewCohort((current) => ({ ...current, activityStart: event.target.value }))} type="date" value={newCohort.activityStart} /></FormRow>
          <FormRow label="기수 종료일" required><TextInput aria-label="기수 종료일" onChange={(event) => setNewCohort((current) => ({ ...current, activityEnd: event.target.value }))} type="date" value={newCohort.activityEnd} /></FormRow>
        </div>
      </Modal>
      {detailCohort ? (
        <SidePanel
          actions={editingCohort ? (
            <>
              <Button onClick={() => setEditingCohort(null)}>취소</Button>
              <Button onClick={saveCohort} variant="primary">저장</Button>
            </>
          ) : (
            <Button onClick={() => setEditingCohort({ ...detailCohort })} variant="primary">
              수정
            </Button>
          )}
          onClose={() => {
            setEditingCohort(null);
            setDetailCohort(null);
          }}
          title={editingCohort ? `${detailCohort.name} 수정` : `${detailCohort.name} 상세`}
        >
          <div className="fuma-detail-panel__content fuma-cohort-detail-panel">
            <div className="fuma-cohort-detail">
              {editingCohort ? (
                <section aria-label="기수 정보 수정" className="fuma-cohort-detail__edit">
                  <FormRow label="기수 ID"><TextInput aria-label="기수 ID" readOnly value={editingCohort.generationId} /></FormRow>
                  <FormRow label="기수명" required><TextInput aria-label="기수명" onChange={(event) => setEditingCohort((current) => current ? { ...current, name: event.target.value } : current)} value={editingCohort.name} /></FormRow>
                  <FormRow label="기수 시작일" required><TextInput aria-label="기수 시작일" onChange={(event) => setEditingCohort((current) => current ? { ...current, startDate: event.target.value } : current)} type="date" value={editingCohort.startDate} /></FormRow>
                  <FormRow label="기수 종료일" required><TextInput aria-label="기수 종료일" onChange={(event) => setEditingCohort((current) => current ? { ...current, endDate: event.target.value } : current)} type="date" value={editingCohort.endDate} /></FormRow>
                </section>
              ) : (
                <dl className="fuma-cohort-detail__summary">
                  <div><dt>기수 ID</dt><dd>{detailCohort.generationId}</dd></div>
                  <div><dt>기수 기간</dt><dd>{detailCohort.startDate} ~ {detailCohort.endDate}</dd></div>
                  <div><dt>기수 상태</dt><dd><StatusPill tone={cohortStatusTone(detailCohort.status)}>{detailCohort.status}</StatusPill></dd></div>
                  <div><dt>참여 셀렉터스</dt><dd>{formatNumber(detailCohort.participantCount)}명</dd></div>
                </dl>
              )}
              <section className="fuma-cohort-detail__selectors" aria-labelledby="cohort-selectors-title">
                <header>
                  <div>
                    <h3 id="cohort-selectors-title">참여 셀렉터스</h3>
                    <span>이 기수에 참여한 셀렉터스 {cohortSelectors.length}명</span>
                  </div>
                </header>
                <DenseTable columns={COHORT_SELECTOR_COLUMNS} rowKey={(selector) => selector.id} rows={cohortSelectors} />
              </section>
            </div>
          </div>
        </SidePanel>
      ) : null}
    </section>
  );
}

const SELECTOR_COLUMNS: DenseTableColumn<SelectorFixture>[] = [
  { key: "id", header: "셀렉터스 ID", width: 110, align: "center" },
  { key: "selectorCode", header: "셀렉터스 코드", width: 120, align: "center" },
  { key: "name", header: "이름", width: 88, align: "center" },
  { key: "shopNickname", header: "닉네임", width: 120, align: "center" },
  { key: "cohort", header: "기수", width: 60, align: "center" },
  { key: "sns", header: "SNS", width: 110, align: "center" },
  {
    key: "status",
    header: "활동 상태",
    width: 88,
    align: "center",
    render: (selector) => {
      const status = selectorListStatus(selector);
      return <StatusPill tone={selectorListStatusTone(status)}>{status}</StatusPill>;
    },
  },
  { key: "contentCount", header: "콘텐츠 수", width: 78, align: "right" },
  { key: "recentActivity", header: "최근 활동일", width: 104, align: "center" },
];

const SELECTOR_PAGE_SIZE = 20;

export function SelectorOverviewPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [cohort, setCohort] = useState("");
  const [sns, setSns] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedCohort, setAppliedCohort] = useState("");
  const [appliedSns, setAppliedSns] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<SelectorListStatus | null>(null);
  const [page, setPage] = useState(1);
  const selectors = SELECTORS.filter((selector) => (
    (!appliedKeyword || [selector.name, selector.id, selector.selectorCode].some((value) => (
      value.toLowerCase().includes(appliedKeyword.toLowerCase())
    )))
    && (!appliedCohort || selector.cohort === appliedCohort)
    && (!appliedSns || selector.sns.includes(appliedSns))
    && (!selectedStatus || selectorListStatus(selector) === selectedStatus)
  ));
  const {
    currentPage,
    pagedItems: pagedSelectors,
    totalPages,
  } = paginate(selectors, page, SELECTOR_PAGE_SIZE);
  const selectorListTitle = selectedStatus === "활동중"
    ? "활동 중인 셀렉터스 목록"
    : selectedStatus === "활동정지"
      ? "활동 정지 셀렉터스 목록"
      : selectedStatus === "블랙리스트"
        ? "블랙리스트 목록"
        : "셀렉터스 목록";

  const applyFilters = () => {
    setAppliedKeyword(keyword);
    setAppliedCohort(cohort);
    setAppliedSns(sns);
    setPage(1);
  };

  const resetFilters = () => {
    setKeyword("");
    setCohort("");
    setSns("");
    setAppliedKeyword("");
    setAppliedCohort("");
    setAppliedSns("");
    setSelectedStatus(null);
    setPage(1);
  };

  return (
    <section className="fuma-page">
      <PageHeader screenCode="SL201" title="셀렉터스 목록" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-selector-search">
          <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
            <FilterField htmlFor="selector-name" label="이름 / ID">
              <TextInput id="selector-name" name="selectorName" onChange={(event) => setKeyword(event.target.value)} placeholder="이름 / ID 검색" value={keyword} />
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
                onChange={(event) => setCohort(event.target.value)}
                options={SELECTOR_COHORT_OPTIONS}
                value={cohort}
              />
            </FilterField>
          </SearchPanel>
        </div>
        <nav aria-label="활동 상태" className="fuma-creator-category-filter fuma-selector-status-filter">
          <div>
            <button
              aria-pressed={selectedStatus === null}
              className="fuma-creator-category-filter__option"
              onClick={() => {
                setSelectedStatus(null);
                setPage(1);
              }}
              type="button"
            >
              전체
            </button>
            {SELECTOR_STATUS_CATEGORIES.map((status) => (
              <button
                aria-pressed={selectedStatus === status}
                className="fuma-creator-category-filter__option"
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  setPage(1);
                }}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        </nav>
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={
            <>
              <span>{[appliedCohort, appliedSns].filter(Boolean).join(" · ") || "전체"}</span>
              <span>총 {selectors.length}건</span>
            </>
          }
          title={selectorListTitle}
        />
        <div
          aria-label={selectorListTitle}
          className="fuma-wide-table fuma-settlement-table fuma-selector-list-table"
          role="region"
        >
          <DenseTable
            columns={SELECTOR_COLUMNS}
            onRowClick={(selector) => navigate(`/selectors/${selector.id}`)}
            rowKey={(selector) => selector.id}
            rows={pagedSelectors}
          />
        </div>
        <Pagination
          onPageChange={setPage}
          page={currentPage}
          pageSize={SELECTOR_PAGE_SIZE}
          totalPages={totalPages}
        />
      </div>
    </section>
  );
}

export function SelectorDetailPanel({
  onClose,
  selector,
}: {
  onClose: () => void;
  selector?: SelectorFixture;
}) {
  const detail = selector ? getSelectorDetailData(selector) : null;
  const primarySns = detail?.snsLinks[0] ?? null;
  const audienceLabel = selector?.sns === "YouTube" ? "구독자" : "팔로워";
  const settlementRows: SettlementTableRow[] = selector && detail
    ? detail.settlements.map((settlement) => ({
      attributionMonth: settlement.month,
      expectedAmount: settlement.amount,
      id: settlement.id,
      paymentStatus: settlement.status,
      selectorId: selector.id,
      selectorName: selector.name,
    }))
    : [];

  return (
    <SidePanel onClose={onClose} title="셀렉터스 상세">
      {selector && detail ? (
        <div className="fuma-detail-panel__content fuma-selector-detail-panel">
          <section
            aria-label="셀렉터스 프로필"
            className="fuma-creator-detail-hero fuma-selector-detail-hero fuma-unified-detail-hero"
          >
            <div className="fuma-creator-detail-hero__portrait">
              <img alt={`${selector.name} 프로필`} src={detail.profileImageUrl} />
              {primarySns ? (
                <span className="fuma-creator-detail-hero__platform">
                  <PlatformIcon platform={primarySns.platform as "Instagram" | "YouTube"} />
                </span>
              ) : null}
            </div>
            <div className="fuma-creator-detail-hero__content">
              <div className="fuma-creator-detail-hero__identity">
                <div className="fuma-creator-detail-hero__title-row">
                  <h2>{selector.name}</h2>
                  <StatusPill tone={selectorStatusTone(selector.status)}>{selector.status}</StatusPill>
                </div>
                {primarySns ? (
                  <a className="fuma-creator-detail-hero__channel" href={primarySns.url} rel="noreferrer" target="_blank">
                    <PlatformIcon decorative platform={primarySns.platform as "Instagram" | "YouTube"} />
                    <span>{primarySns.handle}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
                <div aria-label="셀렉터스 정보" className="fuma-creator-detail-hero__categories">
                  <strong>{selector.category ?? "셀렉터스"}</strong>
                  <span aria-hidden="true">/</span>
                  <span>{selector.id} · {selector.selectorCode} · {selector.shopNickname}</span>
                </div>
              </div>
              <p className="fuma-unified-detail-hero__summary">
                {selector.cohort} · {selector.status} · 최근 활동 {selector.recentActivity}
              </p>
              <dl className="fuma-creator-detail-hero__metrics">
                <div><dt>{audienceLabel}</dt><dd>{selector.followers ? formatNumber(selector.followers) : "-"}</dd></div>
                <div><dt>등록 콘텐츠</dt><dd>{formatNumber(selector.contentCount)}건</dd></div>
                <div><dt>구매 전환</dt><dd>{formatNumber(selector.conversions)}건</dd></div>
                <div><dt>누적 정산</dt><dd>{formatWon(detail.totalSettlement)}</dd></div>
              </dl>
            </div>
          </section>

          <section aria-labelledby="selector-contents-title" className="fuma-content-section fuma-selector-detail-section">
            <header className="fuma-content-section__header">
              <h3 id="selector-contents-title">업로드 콘텐츠</h3>
              <span>최근 {detail.contents.length}건</span>
            </header>
            <div className="fuma-selector-content-list">
              {detail.contents.map((content) => (
                <article key={content.id}>
                  <div className="fuma-selector-content-list__media">
                    <img alt="" src={content.thumbnailUrl} />
                    <span>{content.format}</span>
                  </div>
                  <div className="fuma-selector-content-list__body">
                    <div className="fuma-selector-content-list__meta">
                      <time>{content.publishedAt}</time>
                      <StatusPill tone={content.status === "승인" ? "approved" : "pending"}>
                        {content.status}
                      </StatusPill>
                    </div>
                    <h4>{content.title}</h4>
                    <p>{content.campaign}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="fuma-selector-detail-columns">
            <section aria-labelledby="selector-cohort-history-title" className="fuma-content-section fuma-selector-detail-section">
              <header className="fuma-content-section__header">
                <h3 id="selector-cohort-history-title">이전 기수 활동 내역</h3>
                <span>{detail.cohortHistory.length}개 기수</span>
              </header>
              <div className="fuma-selector-cohort-history">
                {detail.cohortHistory.length > 0 ? detail.cohortHistory.map((activity) => (
                  <article key={activity.cohort}>
                    <div>
                      <strong>{activity.cohort}</strong>
                      <StatusPill tone="neutral">{activity.result}</StatusPill>
                    </div>
                    <p>{activity.period}</p>
                    <dl>
                      <div>
                        <dt>참여 캠페인</dt>
                        <dd>{activity.campaignCount}건</dd>
                      </div>
                      <div>
                        <dt>등록 콘텐츠</dt>
                        <dd>{activity.contentCount}건</dd>
                      </div>
                    </dl>
                  </article>
                )) : (
                  <p className="fuma-selector-detail-empty">이전 기수 활동 내역이 없습니다.</p>
                )}
              </div>
            </section>

            <section aria-labelledby="selector-settlement-history-title" className="fuma-content-section fuma-selector-detail-section">
              <header className="fuma-content-section__header">
                <h3 id="selector-settlement-history-title">정산 내역</h3>
                <span>총 {detail.settlements.length}건</span>
              </header>
              <SettlementTable ariaLabel="셀렉터스 정산 내역" rows={settlementRows} />
            </section>
          </div>
        </div>
      ) : (
        <div className="fuma-detail-panel__content">
          <section className="fuma-empty-state" aria-label="셀렉터스 없음">
            <h2>대상을 찾을 수 없습니다</h2>
            <p>요청한 셀렉터스 정보를 확인할 수 없습니다.</p>
          </section>
        </div>
      )}
    </SidePanel>
  );
}

export function SelectorDetailPage() {
  const { selectorId } = useParams();
  const selector = SELECTORS.find((item) => item.id === selectorId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromQualifications = searchParams.get("from") === "qualifications";
  const listPath = fromQualifications ? "/selectors/qualifications" : "/selectors";

  return (
    <>
      {fromQualifications ? <QualificationManagementPage /> : <SelectorOverviewPage />}
      <SelectorDetailPanel onClose={() => navigate(listPath)} selector={selector} />
    </>
  );
}

const QUALIFICATION_COLUMNS: DenseTableColumn<QualificationFixture>[] = [
  { key: "selectorId", header: "셀렉터스 ID", width: 110, align: "center" },
  { key: "name", header: "이름", width: 110, align: "center" },
  { key: "cohort", header: "기수", width: 60, align: "center" },
  {
    key: "penaltyCount",
    header: "누적 패널티",
    width: 86,
    align: "center",
    render: (qualification) => `${qualification.penaltyCount}회`,
  },
  { key: "revocationReason", header: "박탈 사유", width: 250 },
  { key: "blacklistedAt", header: "블랙리스트 지정일", width: 130, align: "center" },
];

const BLACKLIST_PAGE_SIZE = 20;

export function QualificationManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const [cohort, setCohort] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedCohort, setAppliedCohort] = useState("");
  const [page, setPage] = useState(1);
  const qualifications = QUALIFICATIONS.filter((qualification) => (
    (!appliedKeyword || [qualification.name, qualification.selectorId].some((value) => (
      value.toLowerCase().includes(appliedKeyword.toLowerCase())
    )))
    && (!appliedCohort || qualification.cohort === appliedCohort)
  ));
  const {
    currentPage,
    pagedItems: pagedQualifications,
    totalPages,
  } = paginate(qualifications, page, BLACKLIST_PAGE_SIZE);
  const detailSelectorId = searchParams.get("detail");
  const detailSelector = SELECTORS.find((selector) => selector.id === detailSelectorId);

  const applyFilters = () => {
    setAppliedKeyword(keyword);
    setAppliedCohort(cohort);
    setPage(1);
  };

  const resetFilters = () => {
    setKeyword("");
    setCohort("");
    setAppliedKeyword("");
    setAppliedCohort("");
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

  return (
    <section className="fuma-page">
      <PageHeader screenCode="SL301" title="블랙리스트 관리" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-qualification-search">
          <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
            <FilterField htmlFor="qualification-name" label="이름 / ID">
              <TextInput
                id="qualification-name"
                name="selectorName"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="이름 / ID 검색"
                value={keyword}
              />
            </FilterField>
            <FilterField htmlFor="qualification-cohort" label="기수">
              <Select
                id="qualification-cohort"
                name="cohort"
                onChange={(event) => setCohort(event.target.value)}
                options={QUALIFICATION_COHORT_OPTIONS}
                value={cohort}
              />
            </FilterField>
          </SearchPanel>
        </div>
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          description="블랙리스트는 향후 셀렉터스 지원 및 활동이 불가합니다."
          meta={
            <>
              <span>{appliedCohort || "전체"}</span>
              <span>총 {qualifications.length}건</span>
            </>
          }
          title="블랙리스트 목록"
        />
        <div aria-label="블랙리스트 목록" className="fuma-wide-table fuma-settlement-table" role="region">
          <DenseTable
            columns={QUALIFICATION_COLUMNS}
            onRowClick={(qualification) => openDetail(qualification.selectorId)}
            rowKey={(qualification) => qualification.selectorId}
            rows={pagedQualifications}
          />
        </div>
        <Pagination
          onPageChange={setPage}
          page={currentPage}
          pageSize={BLACKLIST_PAGE_SIZE}
          totalPages={totalPages}
        />
      </div>
      {detailSelector ? <SelectorDetailPanel onClose={closeDetail} selector={detailSelector} /> : null}
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
      <PageHeader screenCode="SL302" title="우수 활동자" />
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
