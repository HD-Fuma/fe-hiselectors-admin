import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { AlertDialog } from "../../components/ui/AlertDialog";
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
import { formatNumber } from "../../lib/formatters";
import { paginate } from "../../lib/pagination";
import { assetUrl } from "../../lib/assetUrl";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { DiscoverySettingsPanel } from "./DiscoverySettingsPanel";
import "../../styles/creator-discovery-settings.css";
import { getDiscoveryCategories } from "../../entities/discovery-category";
import {
  CREATORS,
  getCreators,
  PROPOSALS,
  type CreatorFixture,
  type CreatorSummary,
  type CreatorProfileFixture,
  type ProposalFixture,
  type ProposalStatus,
} from "../../entities/creator";

const PROPOSAL_HISTORY_STATUSES: ProposalStatus[] = ["발송 대기", "발송 완료", "발송 실패"];
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
  minEngagementRate: "",
  minRecent90DayContentCount: "",
};

function numericFilter(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function categoryLabel(code: string | null) {
  return CREATOR_CATEGORY_OPTIONS.find((option) => option.value === code)?.label ?? code ?? "-";
}

function platformFor(code: CreatorSummary["snsCode"]): CreatorProfileFixture["platform"] {
  return code === "INSTAGRAM" ? "Instagram" : "YouTube";
}

function CreatorAccountLink({ creator }: { creator: CreatorSummary }) {
  const instagramUsername = (/^\d+$/.test(creator.accountId)
    ? creator.creatorName
    : creator.accountId)?.replace(/^@/, "");
  const href = creator.snsCode === "YOUTUBE"
    ? `https://www.youtube.com/channel/${encodeURIComponent(creator.accountId)}`
    : instagramUsername
      ? `https://www.instagram.com/${encodeURIComponent(instagramUsername)}`
      : null;
  const label = creator.snsCode === "YOUTUBE" ? "채널 열기" : "프로필 열기";
  const linkText = creator.snsCode === "YOUTUBE" ? `${label} ↗` : `@${instagramUsername} ↗`;

  return href ? (
    <a
      aria-label={`${creator.creatorName || creator.accountId} ${label} (새 창)`}
      className="hsas-button fuma-table-link"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {linkText}
    </a>
  ) : "-";
}

function PlatformLabel({ platform }: { platform: CreatorProfileFixture["platform"] }) {
  return (
    <span className="fuma-platform-label">
      <PlatformIcon platform={platform} />
      <span aria-hidden="true">{platform}</span>
    </span>
  );
}

function proposalTone(
  status: ProposalStatus | "미제안" | "발송 전",
): NonNullable<StatusPillProps["tone"]> {
  if (status === "발송 완료") {
    return "approved";
  }
  if (status === "발송 대기") {
    return "pending";
  }
  if (status === "발송 실패") {
    return "rejected";
  }
  if (status === "발송 전") {
    return "pending";
  }
  return "neutral";
}

const CREATOR_COLUMNS: DenseTableColumn<CreatorSummary>[] = [
  { key: "id", header: "크리에이터 ID", width: 92, align: "center" },
  {
    key: "creatorName",
    header: "계정명",
    width: 150,
    align: "center",
    render: (creator) => creator.creatorName || "-",
  },
  {
    id: "account",
    header: "SNS 계정",
    width: 110,
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
    render: (creator) => categoryLabel(creator.category),
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

export function CreatorListPage() {
  const [filters, setFilters] = useState(EMPTY_CREATOR_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_CREATOR_FILTERS);
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
      minEngagementRate: numericFilter(appliedFilters.minEngagementRate),
      minRecent90DayContentCount: numericFilter(appliedFilters.minRecent90DayContentCount),
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
    setAppliedFilters({ ...filters, keyword: filters.keyword.trim() });
    setPage(1);
  };
  const resetSearch = () => {
    setFilters(EMPTY_CREATOR_FILTERS);
    setAppliedFilters(EMPTY_CREATOR_FILTERS);
    setPage(1);
  };

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
            <FilterField htmlFor="creator-category" label="카테고리">
              <Select id="creator-category" onChange={(event) => setFilters((current) => ({ ...current, categoryCode: event.target.value }))} options={categoryOptions} value={filters.categoryCode} />
            </FilterField>
            <FilterField htmlFor="creator-min-follower" label="최소 팔로워·구독자">
              <TextInput id="creator-min-follower" inputMode="numeric" min="0" onChange={(event) => setFilters((current) => ({ ...current, minFollower: event.target.value }))} placeholder="0" value={filters.minFollower} />
            </FilterField>
            <FilterField htmlFor="creator-min-er" label="최소 ER">
              <TextInput id="creator-min-er" inputMode="decimal" min="0" onChange={(event) => setFilters((current) => ({ ...current, minEngagementRate: event.target.value }))} placeholder="0" value={filters.minEngagementRate} />
            </FilterField>
            <FilterField htmlFor="creator-min-activity" label="최근 90일 최소 활동">
              <TextInput id="creator-min-activity" inputMode="numeric" min="0" onChange={(event) => setFilters((current) => ({ ...current, minRecent90DayContentCount: event.target.value }))} placeholder="0" value={filters.minRecent90DayContentCount} />
            </FilterField>
          </SearchPanel>
        </div>
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
              columns={CREATOR_COLUMNS}
              emptyMessage={pageData ? "검색 결과가 없습니다." : "크리에이터를 불러오는 중입니다."}
              rowKey={(creator) => creator.id}
              rows={pageData?.content ?? []}
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

function ProposalCreatorSummary({ creator }: { creator: CreatorFixture }) {
  const platform = creator.profile.platform;
  const audienceLabel = platform === "Instagram" ? "팔로워" : "구독자";

  return (
    <aside aria-label="제안 대상" className="fuma-proposal-compose__creator">
      <p className="fuma-proposal-compose__eyebrow">제안 대상</p>
      <div className="fuma-proposal-compose__creator-profile">
        <img
          alt={`${creator.profile.handle} 프로필 이미지`}
          src={assetUrl(creator.profile.profileImageUrl)}
        />
        <div>
          <strong>{creator.profile.handle}</strong>
          <span>
            <PlatformLabel platform={platform} />
          </span>
        </div>
      </div>
      <dl className="fuma-proposal-compose__creator-metrics">
        <div>
          <dt>{audienceLabel}</dt>
          <dd>{formatNumber(creator.profile.followers)}</dd>
        </div>
        <div>
          <dt>카테고리</dt>
          <dd>{creator.category}</dd>
        </div>
      </dl>
      <p className="fuma-proposal-compose__creator-note">
        공개 정량 지표를 확인한 뒤 제안 내용을 작성해 주세요.
      </p>
    </aside>
  );
}

function resizeProposalMessage(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export function ProposalComposePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [proposalCompleted, setProposalCompleted] = useState(false);
  const creatorIds = searchParams.get("creators")?.split(",") ?? [searchParams.get("creator")];
  const selectedCreators = CREATORS.filter((item) => creatorIds.includes(item.id));
  const creator = selectedCreators[0];
  const isBatchProposal = selectedCreators.length > 1;

  if (!creator) {
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

  const channelOptions = [{ label: "이메일", value: "이메일" }];
  const recipientLabel = isBatchProposal ? "크리에이터님" : `${creator.profile.handle}님`;
  const proposalSubject = isBatchProposal
    ? "[더현대Hi] 셀렉터스 크리에이터 활동을 제안드립니다"
    : `[더현대Hi] ${creator.profile.handle}님, 셀렉터스 크리에이터 활동을 제안드립니다`;
  const proposalMessage = `안녕하세요, ${recipientLabel}.
더현대Hi 셀렉터스 운영팀입니다.

${isBatchProposal
    ? "크리에이터님의 콘텐츠를 관심 있게 보고, 더현대Hi와 함께하는 셀렉터스 활동을 제안드리고자 연락드립니다."
    : `${creator.profile.handle}님의 ${creator.category} 콘텐츠를 관심 있게 보고, 더현대Hi와 함께하는 셀렉터스 활동을 제안드리고자 연락드립니다.`}

셀렉터스는 크리에이터의 개성과 전문성을 바탕으로 더현대Hi의 상품과 브랜드를 소개하는 크리에이터 파트너 프로그램입니다.

[제안 내용]
- 더현대Hi 주요 캠페인 및 콘텐츠 협업
- 채널 특성에 맞춘 상품과 캠페인 제안
- 캠페인별 활동 조건 및 상세 가이드 별도 안내

참여 의향이 있으시다면 본 메일에 회신해 주세요. 확인 후 활동 방식과 다음 절차를 상세히 안내드리겠습니다.

감사합니다.
더현대Hi 셀렉터스 운영팀 드림`;

  return (
    <>
    <section className="fuma-page fuma-proposal-compose">
      <PageHeader title="셀렉터스 제안" />
      <div className="fuma-page__body">
        <div className="fuma-proposal-compose__layout">
          {isBatchProposal ? (
            <aside aria-label="제안 대상" className="fuma-proposal-compose__creator fuma-proposal-compose__creator--batch">
              <p className="fuma-proposal-compose__eyebrow">제안 대상</p>
              <strong>{selectedCreators.length}명 선택됨</strong>
              <ul>{selectedCreators.map((item) => <li key={item.id}>{item.profile.handle}<span>{item.profile.platform}</span></li>)}</ul>
            </aside>
          ) : <ProposalCreatorSummary creator={creator} />}
          <form
            aria-label="제안 작성"
            className="fuma-proposal-compose__form"
            onSubmit={(event) => {
              event.preventDefault();
              setProposalCompleted(true);
            }}
          >
            <div className="fuma-proposal-compose__form-heading">
              <h2>제안 내용</h2>
              <span>필수 항목을 입력해 주세요.</span>
            </div>
            <FormRow label="제안 채널" required>
              <Select aria-label="제안 채널" defaultValue="이메일" disabled options={channelOptions} />
            </FormRow>
            <FormRow label="제목" required>
              <TextInput
                aria-label="제목"
                defaultValue={proposalSubject}
                placeholder={proposalSubject}
              />
            </FormRow>
            <FormRow label="제안 메시지" required>
              <textarea
                aria-label="제안 메시지"
                className="hsas-control fuma-proposal-compose__textarea"
                defaultValue={proposalMessage}
                onInput={(event) => resizeProposalMessage(event.currentTarget)}
                placeholder={proposalMessage}
                ref={(textarea) => {
                  if (textarea) resizeProposalMessage(textarea);
                }}
              />
            </FormRow>
            <footer className="fuma-proposal-compose__footer">
              <span>발송 후 제안 이력에서 상태를 확인할 수 있습니다.</span>
              <div>
                <Button onClick={() => navigate(-1)}>취소</Button>
                <Button className="fuma-proposal-compose__submit" type="submit" variant="primary">제안 발송</Button>
              </div>
            </footer>
          </form>
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

function createProposalColumns(): DenseTableColumn<ProposalFixture>[] {
  return [
  {
    id: "target",
    header: "크리에이터",
    width: 120,
    align: "center",
    render: (proposal) => proposal.receiver,
  },
  {
    id: "platform",
    header: "플랫폼",
    width: 120,
    align: "center",
    render: (proposal) => {
      const creator = CREATORS.find((item) => item.id === proposal.targetId);
      return creator ? <PlatformLabel platform={creator.profile.platform} /> : "-";
    },
  },
  { key: "recipientEmail", header: "이메일 주소", width: 210, align: "center" },
  { key: "sentAt", header: "발송 시각", width: 150, align: "center" },
  { key: "administratorName", header: "발송자", width: 130, align: "center" },
  {
    key: "status",
    header: "상태",
    width: 110,
    align: "center",
    render: (proposal) => (
      <StatusPill tone={proposalTone(proposal.status)}>{proposal.status}</StatusPill>
    ),
  },
  ];
}

function ProposalDeliveryDetail({ proposal }: { proposal: ProposalFixture }) {
  return (
    <div className="fuma-detail-panel__content fuma-proposal-delivery-detail">
      <section aria-label="발송 내역" className="fuma-proposal-delivery-detail__section">
        <dl className="fuma-proposal-delivery-detail__list">
          <div>
            <dt>크리에이터 SNS ID</dt>
            <dd>{proposal.receiver}</dd>
          </div>
          <div>
            <dt>발송 관리자 ID</dt>
            <dd>{proposal.administratorId}</dd>
          </div>
          <div>
            <dt>발송 시각</dt>
            <dd>{proposal.sentAt}</dd>
          </div>
          <div>
            <dt>상태</dt>
            <dd><StatusPill tone={proposalTone(proposal.status)}>{proposal.status}</StatusPill></dd>
          </div>
          <div>
            <dt>발송 안내</dt>
            <dd>{proposal.message}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export function ProposalHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [selectedProposal, setSelectedProposal] = useState<ProposalFixture | null>(null);
  const [sentDateInput, setSentDateInput] = useState(searchParams.get("sentDate") ?? "");
  const [keywordInput, setKeywordInput] = useState(
    searchParams.get("keyword") ?? searchParams.get("creator") ?? "",
  );
  const creatorId = searchParams.get("creator");
  const requestedStatus = searchParams.get("status");
  const selectedStatus = PROPOSAL_HISTORY_STATUSES.find((status) => status === requestedStatus);
  const sentDate = searchParams.get("sentDate");
  const keyword = searchParams.get("keyword")?.trim().toLocaleLowerCase("ko-KR");
  const proposals = (
    searchParams.get("fixture") === "empty"
      ? []
      : creatorId
        ? PROPOSALS.filter((proposal) => proposal.targetId === creatorId)
        : PROPOSALS
  ).filter((proposal) => (
    (!selectedStatus || proposal.status === selectedStatus)
    && (!sentDate || proposal.sentAt.startsWith(sentDate))
    && (!keyword || [
      proposal.targetId,
      proposal.targetName,
      proposal.receiver,
      proposal.recipientEmail,
    ].some((value) => value.toLocaleLowerCase("ko-KR").includes(keyword)))
  ));
  const { currentPage, pagedItems: pagedProposals, totalPages } = paginate(
    proposals,
    page,
    PROPOSAL_PAGE_SIZE,
  );

  const selectStatus = (status?: ProposalStatus) => {
    const nextParams = new URLSearchParams(searchParams);
    if (status) {
      nextParams.set("status", status);
    } else {
      nextParams.delete("status");
    }
    setPage(1);
    setSearchParams(nextParams);
  };

  const searchProposals = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("creator");
    if (sentDateInput) {
      nextParams.set("sentDate", sentDateInput);
    } else {
      nextParams.delete("sentDate");
    }
    if (keywordInput.trim()) {
      nextParams.set("keyword", keywordInput.trim());
    } else {
      nextParams.delete("keyword");
    }
    setPage(1);
    setSearchParams(nextParams);
  };

  const resetProposalSearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("creator");
    nextParams.delete("sentDate");
    nextParams.delete("keyword");
    nextParams.delete("status");
    setSentDateInput("");
    setKeywordInput("");
    setPage(1);
    setSearchParams(nextParams);
  };

  return (
    <section className="fuma-page">
      <PageHeader title="제안 이력 관리" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-proposal-history-search">
          <SearchPanel actions={<SearchActions onReset={resetProposalSearch} onSearch={searchProposals} />}>
            <FilterField htmlFor="proposal-sent-date" label="발송일">
              <TextInput
                aria-label="발송일"
                id="proposal-sent-date"
                onChange={(event) => setSentDateInput(event.target.value)}
                type="date"
                value={sentDateInput}
              />
            </FilterField>
            <FilterField htmlFor="proposal-keyword" label="ID 또는 이름">
              <TextInput
                aria-label="ID 또는 이름"
                id="proposal-keyword"
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="크리에이터 ID 또는 이름 검색"
                value={keywordInput}
              />
            </FilterField>
          </SearchPanel>
        </div>
        <ChoiceTabs
          ariaLabel="제안 발송 상태"
          className="fuma-proposal-status-filter"
          emptyOption={{ label: "전체", onSelect: () => selectStatus() }}
          onChange={selectStatus}
          options={PROPOSAL_HISTORY_STATUSES}
          value={selectedStatus}
        />
        <div className="fuma-result-toolbar fuma-simple-result-toolbar">
          <strong>제안 이력 목록</strong>
          <div className="fuma-settlement-result-meta">
            <span>{sentDate ? sentDate.replaceAll("-", ".") : "전체 발송일"}</span>
            <span>총 {proposals.length}건</span>
          </div>
        </div>
        <div
          aria-label="제안 이력 목록"
          className="fuma-wide-table fuma-settlement-table fuma-proposal-history-table"
          role="region"
        >
          <DenseTable
            columns={createProposalColumns()}
            emptyMessage="등록된 제안 이력이 없습니다."
            onRowClick={setSelectedProposal}
            rowKey={(proposal) => proposal.id}
            rows={pagedProposals}
          />
        </div>
        <Pagination
          onPageChange={setPage}
          page={currentPage}
          pageSize={PROPOSAL_PAGE_SIZE}
          totalPages={totalPages}
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
