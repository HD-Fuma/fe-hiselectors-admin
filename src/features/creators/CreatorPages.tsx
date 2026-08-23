import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { AlertDialog } from "../../components/ui/AlertDialog";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SidePanel } from "../../components/ui/SidePanel";
import { formatNumber } from "../../lib/formatters";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { DiscoverySettingsPanel } from "./DiscoverySettingsPanel";
import "../../styles/creator-discovery-settings.css";
import { getDiscoveryCategories } from "../../entities/discovery-category";
import {
  getAdminProposals,
  getCreator,
  getCreators,
  postAdminProposal,
  type CreatorDetail,
  type CreatorProfileFixture,
  type CreatorSummary,
  type ProposalHistoryEntry,
  type ProposalHistoryPage as ProposalHistoryPageResult,
} from "../../entities/creator";

const PROPOSAL_PAGE_SIZE = 20;
const CREATOR_LIST_PAGE_SIZE = 20;

const CREATOR_PLATFORM_OPTIONS = [
  { label: "전체", value: "" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "YouTube", value: "YOUTUBE" },
] as const;

const CREATOR_CATEGORY_OPTIONS = [
  { label: "전체", value: "" },
  { label: "뷰티", value: "BEAUTY" },
  { label: "패션", value: "FASHION" },
  { label: "푸드", value: "FOOD" },
  { label: "리빙/라이프", value: "LIVING_LIFE" },
  { label: "유아동/패밀리", value: "KIDS_FAMILY" },
  { label: "컬처/서비스", value: "CULTURE_SERVICE" },
  { label: "스포츠/레저", value: "SPORTS_LEISURE" },
  { label: "여행", value: "TRAVEL" },
  { label: "반려생활", value: "PET_LIFE" },
] as const;

const EMPTY_CREATOR_FILTERS = {
  keyword: "",
  snsCode: "",
  categoryCode: "",
  minFollower: "",
  maxFollower: "",
};

function dateTime(value: string) {
  return value.replace("T", " ").slice(0, 16).replaceAll("-", ".");
}

function numericFilter(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function categoryLabel(
  code: string | null,
  options: readonly { label: string; value: string }[],
) {
  return options.find((option) => option.value === code)?.label ?? code ?? "-";
}

function platformFor(code: CreatorSummary["snsCode"]): CreatorProfileFixture["platform"] {
  return code === "INSTAGRAM" ? "Instagram" : "YouTube";
}

function CreatorAccountLink({ creator }: { creator: CreatorSummary }) {
  const instagramUsernameCandidate = /^\d+$/.test(creator.accountId)
    ? creator.creatorName?.replace(/^@/, "")
    : creator.accountId.replace(/^@/, "");
  const instagramUsername = instagramUsernameCandidate
    && /^[A-Za-z0-9._]{1,30}$/.test(instagramUsernameCandidate)
    ? instagramUsernameCandidate
    : null;
  const href = creator.snsCode === "YOUTUBE"
    ? `https://www.youtube.com/channel/${encodeURIComponent(creator.accountId)}`
    : instagramUsername
      ? `https://www.instagram.com/${encodeURIComponent(instagramUsername)}`
      : null;
  const accountName = creator.creatorName
    || (creator.snsCode === "INSTAGRAM" && instagramUsername
      ? `@${instagramUsername}`
      : creator.accountId);

  return href ? (
    <a
      aria-label={`${accountName} SNS 계정 열기 (새 창)`}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {accountName} ↗
    </a>
  ) : accountName;
}

function PlatformLabel({ platform }: { platform: CreatorProfileFixture["platform"] }) {
  return (
    <span className="fuma-platform-label">
      <PlatformIcon platform={platform} />
      <span aria-hidden="true">{platform}</span>
    </span>
  );
}

function creatorColumns(
  categoryOptions: readonly { label: string; value: string }[],
): DenseTableColumn<CreatorSummary>[] {
  return [
  { key: "id", header: "크리에이터 ID", width: 92, align: "center" },
  {
    key: "creatorName",
    header: "계정명",
    width: 150,
    align: "center",
    render: (creator) => <CreatorAccountLink creator={creator} />,
  },
  {
    id: "platform",
    header: "플랫폼",
    width: 115,
    align: "center",
    render: (creator) => <PlatformLabel platform={platformFor(creator.snsCode)} />,
  },
  {
    id: "categories",
    header: "카테고리",
    width: 110,
    align: "center",
    render: (creator) => categoryLabel(creator.category, categoryOptions),
  },
  {
    id: "followers",
    header: "팔로워·구독자",
    width: 105,
    align: "right",
    render: (creator) => creator.followerCount === null ? "-" : formatNumber(creator.followerCount),
  },
  {
    id: "engagementRate",
    header: "ER",
    width: 72,
    align: "right",
    render: (creator) => creator.engagementRate === null ? "-" : `${creator.engagementRate.toFixed(2)}%`,
  },
  {
    key: "recent90DayContentCount",
    header: "최근 90일 활동",
    width: 110,
    align: "right",
    render: (creator) => creator.recent90DayContentCount === null
      ? "-"
      : creator.recent90DayContentCount >= 25
        ? "25+건"
        : `${formatNumber(creator.recent90DayContentCount)}건`,
  },
  {
    key: "lastContentAt",
    header: "최근 활동일",
    width: 110,
    align: "center",
    render: (creator) => creator.lastContentAt?.slice(0, 10) ?? "-",
  },
  ];
}

export function CreatorListPage() {
  const [filters, setFilters] = useState(EMPTY_CREATOR_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_CREATOR_FILTERS);
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<Awaited<ReturnType<typeof getCreators>> | null>(null);
  const [error, setError] = useState("");
  const [discoverySettingsOpen, setDiscoverySettingsOpen] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<readonly { label: string; value: string }[]>(
    CREATOR_CATEGORY_OPTIONS,
  );

  const refreshCategoryOptions = useCallback((signal?: AbortSignal) => (
    getDiscoveryCategories(signal).then((categories) => {
      setCategoryOptions([
        { label: "전체", value: "" },
        ...categories.map((category) => ({ label: category.name, value: category.code })),
      ]);
    })
  ), []);

  useEffect(() => {
    const controller = new AbortController();
    getCreators({
      keyword: appliedFilters.keyword || undefined,
      snsCode: appliedFilters.snsCode || undefined,
      categoryCode: appliedFilters.categoryCode || undefined,
      minFollower: numericFilter(appliedFilters.minFollower),
      maxFollower: numericFilter(appliedFilters.maxFollower),
      page: page - 1,
      size: CREATOR_LIST_PAGE_SIZE,
    }, controller.signal).then((result) => {
      setPageData(result);
      setError("");
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : "크리에이터 목록 조회에 실패했습니다.");
      }
    });
    return () => controller.abort();
  }, [appliedFilters, page]);

  useEffect(() => {
    const controller = new AbortController();
    refreshCategoryOptions(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [refreshCategoryOptions]);

  const applySearch = () => {
    const minFollower = numericFilter(filters.minFollower);
    const maxFollower = numericFilter(filters.maxFollower);
    if ((filters.minFollower.trim() && minFollower === undefined)
      || (filters.maxFollower.trim() && maxFollower === undefined)
      || (minFollower !== undefined && maxFollower !== undefined && minFollower > maxFollower)) {
      setError("팔로워·구독자 범위를 올바르게 입력해 주세요.");
      return;
    }
    setError("");
    setAppliedFilters({ ...filters, keyword: filters.keyword.trim() });
    setSelectedCreatorIds(new Set());
    setPage(1);
  };
  const resetSearch = () => {
    setFilters(EMPTY_CREATOR_FILTERS);
    setAppliedFilters(EMPTY_CREATOR_FILTERS);
    setSelectedCreatorIds(new Set());
    setPage(1);
  };
  const selectCategory = (categoryCode: string) => {
    setFilters((current) => ({ ...current, categoryCode }));
    setAppliedFilters((current) => ({ ...current, categoryCode }));
    setSelectedCreatorIds(new Set());
    setPage(1);
  };
  const listedCreators = pageData?.content ?? [];
  const selectedOnPage = listedCreators.filter((creator) => selectedCreatorIds.has(creator.id)).length;
  const allListedCreatorsSelected = listedCreators.length > 0
    && selectedOnPage === listedCreators.length;
  const toggleSelected = (creatorId: number) => setSelectedCreatorIds((current) => {
    const next = new Set(current);
    if (next.has(creatorId)) next.delete(creatorId);
    else next.add(creatorId);
    return next;
  });
  const toggleAll = () => setSelectedCreatorIds((current) => {
    const next = new Set(current);
    const shouldClearPage = listedCreators.every((creator) => next.has(creator.id));
    listedCreators.forEach((creator) => {
      if (shouldClearPage) next.delete(creator.id);
      else next.add(creator.id);
    });
    return next;
  });
  const columns: DenseTableColumn<CreatorSummary>[] = [
    {
      id: "select",
      header: (
        <input
          aria-label="현재 페이지 전체 선택"
          checked={allListedCreatorsSelected}
          disabled={listedCreators.length === 0}
          onChange={toggleAll}
          ref={(input) => {
            if (input) input.indeterminate = selectedOnPage > 0 && !allListedCreatorsSelected;
          }}
          type="checkbox"
        />
      ),
      width: 40,
      align: "center",
      render: (creator) => (
        <input
          aria-label={`${creator.creatorName || creator.accountId} 선택`}
          checked={selectedCreatorIds.has(creator.id)}
          onChange={() => toggleSelected(creator.id)}
          type="checkbox"
        />
      ),
    },
    ...creatorColumns(categoryOptions),
  ];

  return (
    <>
    <section className="fuma-page">
      <PageHeader title="크리에이터 풀" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-creator-pool-search">
          <SearchPanel actions={<SearchActions onReset={resetSearch} onSearch={applySearch} />}>
            <FilterField htmlFor="creator-keyword" label="키워드">
              <TextInput
                id="creator-keyword"
                name="keyword"
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                placeholder="계정명 또는 SNS 계정 검색"
                value={filters.keyword}
              />
            </FilterField>
            <FilterField htmlFor="creator-platform" label="플랫폼">
              <Select id="creator-platform" onChange={(event) => setFilters((current) => ({ ...current, snsCode: event.target.value }))} options={CREATOR_PLATFORM_OPTIONS} value={filters.snsCode} />
            </FilterField>
            <div className="fuma-follower-range">
              <span>팔로워·구독자</span>
              <div className="fuma-follower-range__inputs">
                <TextInput aria-label="최소 팔로워·구독자" id="creator-followers-min" inputMode="numeric" min="0" onChange={(event) => setFilters((current) => ({ ...current, minFollower: event.target.value }))} placeholder="최소" value={filters.minFollower} />
                <i aria-hidden="true" />
                <TextInput aria-label="최대 팔로워·구독자" id="creator-followers-max" inputMode="numeric" min="0" onChange={(event) => setFilters((current) => ({ ...current, maxFollower: event.target.value }))} placeholder="최대" value={filters.maxFollower} />
                <em>명</em>
              </div>
            </div>
          </SearchPanel>
        </div>
        <ChoiceTabs
          ariaLabel="크리에이터 카테고리"
          emptyOption={{ label: "전체", onSelect: () => selectCategory("") }}
          onChange={selectCategory}
          options={categoryOptions.filter((option) => option.value)}
          value={appliedFilters.categoryCode || null}
        />
        <ResultToolbar
          actions={(
            <Button aria-haspopup="dialog" onClick={() => setDiscoverySettingsOpen(true)}>
              발굴 설정
            </Button>
          )}
          className="fuma-simple-result-toolbar"
          meta={<span>총 {pageData?.totalElements ?? 0}건</span>}
          title="크리에이터 목록"
        />
        <div aria-label="크리에이터 목록" className="fuma-wide-table fuma-settlement-table" role="region">
          {error ? (
            <EmptyState description={error} title="목록을 불러오지 못했습니다" />
          ) : (
            <DenseTable
              columns={columns}
              emptyMessage={pageData ? "검색 결과가 없습니다." : "크리에이터를 불러오는 중입니다."}
              rowKey={(creator) => creator.id}
              rows={listedCreators}
              selectedRowKeys={[...selectedCreatorIds]}
            />
          )}
        </div>
        <Pagination
          onPageChange={setPage}
          page={page}
          pageSize={CREATOR_LIST_PAGE_SIZE}
          totalPages={Math.max(1, pageData?.totalPages ?? 1)}
        />
      </div>
    </section>
    {discoverySettingsOpen ? (
      <DiscoverySettingsPanel onClose={() => {
        setDiscoverySettingsOpen(false);
        refreshCategoryOptions().catch(() => undefined);
      }} />
    ) : null}
    </>
  );
}

function ProposalCreatorSummary({ creator }: { creator: CreatorDetail }) {
  const platform = platformFor(creator.snsCode);
  const audienceLabel = platform === "Instagram" ? "팔로워" : "구독자";

  return (
    <aside aria-label="제안 대상" className="fuma-proposal-compose__creator">
      <p className="fuma-proposal-compose__eyebrow">제안 대상</p>
      <div className="fuma-proposal-compose__creator-profile">
        <div>
          <strong>{creator.creatorName || creator.accountId}</strong>
          <span>
            <PlatformLabel platform={platform} />
          </span>
        </div>
      </div>
      <dl className="fuma-proposal-compose__creator-metrics">
        <div>
          <dt>{audienceLabel}</dt>
          <dd>{creator.followerCount === null ? "-" : formatNumber(creator.followerCount)}</dd>
        </div>
        <div>
          <dt>이메일</dt>
          <dd>{creator.email}</dd>
        </div>
      </dl>
      <p className="fuma-proposal-compose__creator-note">
        발송 버튼을 누르면 크리에이터 이메일로 셀렉터스 제안 메일이 발송되고 제안 이력에 기록됩니다.
      </p>
    </aside>
  );
}

function proposalHistoryColumns(): DenseTableColumn<ProposalHistoryEntry>[] {
  return [
  { key: "creatorName", header: "크리에이터", width: 130, align: "center" },
  {
    id: "platform",
    header: "플랫폼",
    width: 120,
    align: "center",
    render: (proposal) => <PlatformLabel platform={platformFor(proposal.snsCode)} />,
  },
  { key: "accountId", header: "SNS 계정", width: 150, align: "center" },
  { key: "email", header: "이메일 주소", width: 210, align: "center" },
  { key: "adminName", header: "발송자", width: 130, align: "center" },
  {
    id: "sentAt",
    header: "발송 시각",
    width: 150,
    align: "center",
    render: (proposal) => dateTime(proposal.createdAt),
  },
  ];
}

function ProposalDeliveryDetail({ proposal }: { proposal: ProposalHistoryEntry }) {
  return (
    <div className="fuma-detail-panel__content fuma-proposal-delivery-detail">
      <section aria-label="발송 내역" className="fuma-proposal-delivery-detail__section">
        <dl className="fuma-proposal-delivery-detail__list">
          <div>
            <dt>크리에이터</dt>
            <dd>{proposal.creatorName}</dd>
          </div>
          <div>
            <dt>SNS 계정</dt>
            <dd>{proposal.accountId}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{proposal.email}</dd>
          </div>
          <div>
            <dt>발송자</dt>
            <dd>{proposal.adminName}</dd>
          </div>
          <div>
            <dt>발송 시각</dt>
            <dd>{dateTime(proposal.createdAt)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export function ProposalComposePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const creatorId = Number(searchParams.get("creator"));
  const invalidCreatorId = !Number.isSafeInteger(creatorId) || creatorId <= 0;
  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [history, setHistory] = useState<ProposalHistoryEntry[] | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [proposalCompleted, setProposalCompleted] = useState(false);

  useEffect(() => {
    if (invalidCreatorId) return;
    const controller = new AbortController();
    getCreator(creatorId, controller.signal).then((result) => {
      if (!controller.signal.aborted) setCreator(result);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : "크리에이터 정보를 불러오지 못했습니다.");
      }
    });
    return () => controller.abort();
  }, [creatorId, invalidCreatorId]);

  useEffect(() => {
    if (invalidCreatorId) return;
    const controller = new AbortController();
    // ponytail: proposals API has no per-creator filter, so this reads one page and filters
    // client-side; upgrade to a server-side creatorId filter if history grows past 100 entries.
    getAdminProposals(0, 100, controller.signal).then((result) => {
      if (!controller.signal.aborted) {
        setHistory(result.content.filter((entry) => entry.creatorId === creatorId));
      }
    }).catch(() => {
      if (!controller.signal.aborted) setHistory([]);
    });
    return () => controller.abort();
  }, [creatorId, invalidCreatorId]);

  if (invalidCreatorId) {
    return (
      <section className="fuma-page">
        <PageHeader title="셀렉터스 제안" />
        <div className="fuma-page__body">
          <EmptyState
            description="크리에이터 풀에서 제안할 대상을 선택해 주세요."
            title="제안 대상이 없습니다"
          />
        </div>
      </section>
    );
  }

  const sendProposal = async () => {
    setSending(true);
    setError("");
    try {
      const entry = await postAdminProposal(creatorId);
      setHistory((current) => [entry, ...(current ?? [])]);
      setProposalCompleted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "제안 메일 발송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
    <section className="fuma-page fuma-proposal-compose">
      <PageHeader title="셀렉터스 제안" />
      <div className="fuma-page__body">
        {error ? <EmptyState description={error} title="처리 중 오류가 발생했습니다" /> : null}
        <div className="fuma-proposal-compose__layout">
          {creator ? <ProposalCreatorSummary creator={creator} /> : (
            <aside aria-label="제안 대상" className="fuma-proposal-compose__creator">
              <p className="fuma-proposal-compose__eyebrow">제안 대상</p>
              <p>크리에이터 정보를 불러오는 중입니다.</p>
            </aside>
          )}
          <div className="fuma-proposal-compose__form">
            <div className="fuma-proposal-compose__form-heading">
              <h2>제안 이력</h2>
              <span>이 크리에이터에게 이전에 발송한 제안 내역입니다.</span>
            </div>
            {history === null ? (
              <p>제안 이력을 불러오는 중입니다.</p>
            ) : history.length === 0 ? (
              <p>이전에 발송한 제안 이력이 없습니다.</p>
            ) : (
              <ul>
                {history.map((entry) => (
                  <li key={entry.proposalHistoryId}>
                    {dateTime(entry.createdAt)} · {entry.adminName} 발송
                  </li>
                ))}
              </ul>
            )}
            <footer className="fuma-proposal-compose__footer">
              <span>발송 후 제안 이력에서 상태를 확인할 수 있습니다.</span>
              <div>
                <Button onClick={() => navigate(-1)}>취소</Button>
                <Button
                  className="fuma-proposal-compose__submit"
                  disabled={!creator || sending}
                  onClick={sendProposal}
                  variant="primary"
                >
                  {sending ? "발송 중..." : "제안 발송"}
                </Button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </section>
    <AlertDialog
      message="제안이 완료되었습니다."
      onClose={() => {
        setProposalCompleted(false);
        navigate("/creators");
      }}
      open={proposalCompleted}
      title="제안 발송 완료"
    />
    </>
  );
}

export function ProposalHistoryPage() {
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<ProposalHistoryPageResult | null>(null);
  const [error, setError] = useState("");
  const [selectedProposal, setSelectedProposal] = useState<ProposalHistoryEntry | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getAdminProposals(page - 1, PROPOSAL_PAGE_SIZE, controller.signal).then((result) => {
      setPageData(result);
      setError("");
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : "제안 이력 조회에 실패했습니다.");
      }
    });
    return () => controller.abort();
  }, [page]);

  return (
    <section className="fuma-page">
      <PageHeader title="제안 이력 관리" />
      <div className="fuma-page__body">
        <div className="fuma-result-toolbar fuma-simple-result-toolbar">
          <strong>제안 이력 목록</strong>
          <div className="fuma-settlement-result-meta">
            <span>총 {pageData?.totalElements ?? 0}건</span>
          </div>
        </div>
        <div
          aria-label="제안 이력 목록"
          className="fuma-wide-table fuma-settlement-table fuma-proposal-history-table"
          role="region"
        >
          {error ? (
            <EmptyState description={error} title="목록을 불러오지 못했습니다" />
          ) : (
            <DenseTable
              columns={proposalHistoryColumns()}
              emptyMessage={pageData ? "등록된 제안 이력이 없습니다." : "제안 이력을 불러오는 중입니다."}
              onRowClick={setSelectedProposal}
              rowKey={(proposal) => proposal.proposalHistoryId}
              rows={pageData?.content ?? []}
            />
          )}
        </div>
        <Pagination
          onPageChange={setPage}
          page={page}
          pageSize={PROPOSAL_PAGE_SIZE}
          totalPages={Math.max(1, pageData?.totalPages ?? 1)}
        />
      </div>
      {selectedProposal ? (
        <SidePanel onClose={() => setSelectedProposal(null)} title="발송 내역">
          <ProposalDeliveryDetail proposal={selectedProposal} />
        </SidePanel>
      ) : null}
    </section>
  );
}
