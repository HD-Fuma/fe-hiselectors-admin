import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { AlertDialog } from "../../components/ui/AlertDialog";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { formatNumber } from "../../lib/formatters";
import { paginate } from "../../lib/pagination";
import { CreatorCardGrid } from "./CreatorCardGrid";
import { CreatorContentPhoto, CreatorProfilePhoto } from "./CreatorArtwork";
import { CreatorKeywordTags } from "./CreatorKeywordTags";
import { assetUrl } from "./assetUrl";
import { engagementResultForCreator } from "./CreatorAnalysisReport";
import {
  CreatorAnalysisReport,
  type AnalysisMetricOverrides,
  type AnalysisPercentileContext,
} from "./CreatorAnalysisReport";
import {
  CreatorResultToolbar,
  type CreatorPoolView,
} from "./CreatorResultToolbar";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import {
  CREATORS,
  CREATOR_CATEGORIES,
  PENDING_AI_REPORT,
  PROPOSALS,
  type CreatorCategory,
  type CreatorFixture,
  type CreatorProfileFixture,
  type ProposalFixture,
  type ProposalStatus,
} from "./fixtures";

const PLATFORM_OPTIONS = ["전체", "Instagram", "YouTube"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const PROPOSAL_HISTORY_STATUSES: ProposalStatus[] = ["발송 대기", "발송 완료", "발송 실패"];
const PROPOSAL_PAGE_SIZE = 20;
const CREATOR_LIST_PAGE_SIZE = 20;

function parseFollowerBound(value: string, fallback: number) {
  const normalizedValue = value.replaceAll(",", "").trim();
  if (!normalizedValue) return fallback;

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : fallback;
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

const CREATOR_COLUMNS: DenseTableColumn<CreatorFixture>[] = [
  {
    id: "platform",
    header: "플랫폼",
    width: 115,
    align: "center",
    render: (creator) => <PlatformLabel platform={creator.profile.platform} />,
  },
  {
    id: "account",
    header: "SNS ID",
    width: 180,
    align: "center",
    render: (creator) => creator.profile.handle,
  },
  {
    id: "categories",
    header: "카테고리",
    width: 110,
    align: "center",
    render: (creator) => creator.category,
  },
  {
    id: "keywords",
    header: "키워드",
    width: 165,
    align: "center",
    render: (creator) => <CreatorKeywordTags keywords={creator.keywords} />,
  },
  {
    id: "followers",
    header: "팔로워·구독자",
    width: 105,
    align: "right",
    render: (creator) => formatNumber(creator.profile.followers),
  },
  {
    id: "engagementRate",
    header: "ER",
    width: 72,
    align: "right",
    render: (creator) => {
      const engagement = engagementResultForCreator(creator);
      return engagement.value === null ? "집계 불가" : `${engagement.value.toFixed(1)}%`;
    },
  },
  { key: "recentActivity", header: "최근 활동일", width: 96, align: "center" },
];

export function CreatorListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedCategory = CREATOR_CATEGORIES.find((category) => category === searchParams.get("category")) ?? "";
  const creatorPoolPath = selectedCategory ? `/creators?category=${encodeURIComponent(selectedCategory)}` : "/creators";
  const detailCreatorId = searchParams.get("detail");
  const [keyword, setKeyword] = useState("");
  const [followersMin, setFollowersMin] = useState("");
  const [followersMax, setFollowersMax] = useState("");
  const [platform, setPlatform] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedFollowersMin, setAppliedFollowersMin] = useState("");
  const [appliedFollowersMax, setAppliedFollowersMax] = useState("");
  const [appliedPlatform, setAppliedPlatform] = useState("");
  const creators = [...(searchParams.get("fixture") === "empty" ? [] : CREATORS)]
    .filter((creator) => !selectedCategory || creator.category === selectedCategory)
    .filter((creator) => {
      const normalizedKeyword = appliedKeyword.trim().toLowerCase();
      const minimum = parseFollowerBound(appliedFollowersMin, 0);
      const maximum = parseFollowerBound(appliedFollowersMax, Number.POSITIVE_INFINITY);
      const matchesKeyword = !normalizedKeyword || [
        creator.id,
        creator.profile.handle,
        ...creator.keywords,
      ].some((value) => value.toLowerCase().includes(normalizedKeyword));

      return matchesKeyword
        && creator.profile.followers >= minimum
        && creator.profile.followers <= maximum
        && (!appliedPlatform || creator.profile.platform === appliedPlatform);
    })
    .sort(
    (left, right) => {
      const leftRate = engagementResultForCreator(left).value;
      const rightRate = engagementResultForCreator(right).value;
      return (rightRate ?? Number.NEGATIVE_INFINITY) - (leftRate ?? Number.NEGATIVE_INFINITY);
    },
  );
  const [view, setView] = useState<CreatorPoolView>("cards");
  const [listPage, setListPage] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    currentPage: currentListPage,
    pagedItems: pagedCreators,
    totalPages: totalListPages,
  } = paginate(
    creators,
    listPage,
    CREATOR_LIST_PAGE_SIZE,
  );
  const applySearch = () => {
    setAppliedKeyword(keyword);
    setAppliedFollowersMin(followersMin);
    setAppliedFollowersMax(followersMax);
    setAppliedPlatform(platform);
    setSelectedIds(new Set());
    setListPage(1);
  };
  const resetSearch = () => {
    setKeyword("");
    setFollowersMin("");
    setFollowersMax("");
    setPlatform("");
    setAppliedKeyword("");
    setAppliedFollowersMin("");
    setAppliedFollowersMax("");
    setAppliedPlatform("");
    setSelectedIds(new Set());
    setListPage(1);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    nextParams.delete("detail");
    setSearchParams(nextParams);
  };
  const toggleSelected = (creatorId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(creatorId)) {
        next.delete(creatorId);
      } else {
        next.add(creatorId);
      }
      return next;
    });
  };
  const toggleSelectionMode = () => {
    if (selectionMode) setSelectedIds(new Set());
    setSelectionMode((current) => !current);
  };
  const openCategory = (category?: CreatorCategory) => {
    setListPage(1);
    setSelectedIds(new Set());
    const nextParams = new URLSearchParams(searchParams);
    if (category) nextParams.set("category", category);
    else nextParams.delete("category");
    nextParams.delete("detail");
    setSearchParams(nextParams);
  };
  const allListedCreatorsSelected = pagedCreators.length > 0
    && pagedCreators.every((creator) => selectedIds.has(creator.id));
  const toggleAll = () => setSelectedIds((current) => {
    const next = new Set(current);
    const shouldClearPage = pagedCreators.every((creator) => next.has(creator.id));
    pagedCreators.forEach((creator) => {
      if (shouldClearPage) next.delete(creator.id);
      else next.add(creator.id);
    });
    return next;
  });
  const sendBatchProposal = () => navigate(`/proposals/new?creators=${[...selectedIds].join(",")}`);
  const creatorColumns: DenseTableColumn<CreatorFixture>[] = selectionMode
    ? [
      {
        id: "select",
        header: <input aria-label="전체 선택" checked={allListedCreatorsSelected} onChange={toggleAll} type="checkbox" />,
        width: 40,
        align: "center" as const,
        render: (creator: CreatorFixture) => <input aria-label={`${creator.profile.handle} 선택`} checked={selectedIds.has(creator.id)} onChange={() => toggleSelected(creator.id)} type="checkbox" />,
      },
      ...CREATOR_COLUMNS,
    ]
    : CREATOR_COLUMNS;

  return (
    <>
    <section className="fuma-page">
      <PageHeader screenCode="CR101" title={selectedCategory ? `${selectedCategory} 크리에이터` : "크리에이터 풀"} />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-creator-pool-search">
          <SearchPanel actions={<SearchActions onReset={resetSearch} onSearch={applySearch} />}>
            <FilterField htmlFor="creator-keyword" label="키워드">
              <TextInput
                id="creator-keyword"
                name="keyword"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="계정 또는 채널명 검색"
                value={keyword}
              />
            </FilterField>
            <div className="fuma-follower-range">
              <span>팔로워·구독자</span>
              <div className="fuma-follower-range__inputs">
                <TextInput aria-label="최소 팔로워·구독자" id="creator-followers-min" inputMode="numeric" name="followersMin" onChange={(event) => setFollowersMin(event.target.value)} placeholder="최소" value={followersMin} />
                <i aria-hidden="true" />
                <TextInput aria-label="최대 팔로워·구독자" id="creator-followers-max" inputMode="numeric" name="followersMax" onChange={(event) => setFollowersMax(event.target.value)} placeholder="최대" value={followersMax} />
                <em>명</em>
              </div>
            </div>
            <FilterField htmlFor="creator-platform" label="플랫폼">
              <Select id="creator-platform" name="platform" onChange={(event) => setPlatform(event.target.value)} options={PLATFORM_OPTIONS} value={platform} />
            </FilterField>
          </SearchPanel>
        </div>
        <nav aria-label="크리에이터 카테고리" className="fuma-creator-category-filter">
          <div>
            <button
              aria-pressed={!selectedCategory}
              className="fuma-creator-category-filter__option"
              onClick={() => openCategory()}
              type="button"
            >
              전체
            </button>
            {CREATOR_CATEGORIES.map((category) => (
              <button
                  aria-pressed={selectedCategory === category}
                  className="fuma-creator-category-filter__option"
                  key={category}
                  onClick={() => openCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </nav>
        <CreatorResultToolbar
          count={creators.length}
          onBatchProposal={sendBatchProposal}
          onSelectionModeChange={toggleSelectionMode}
          onViewChange={(nextView) => {
            setView(nextView);
            setListPage(1);
          }}
          selectedCount={selectedIds.size}
          selectionMode={selectionMode}
          view={view}
        />
        {creators.length === 0 ? (
          <EmptyState title="검색 결과가 없습니다." />
        ) : (
          <>
            {view === "cards" ? (
              <CreatorCardGrid
                creators={pagedCreators}
                onOpen={(creator) => navigate(`${creatorPoolPath}${selectedCategory ? "&" : "?"}detail=${creator.id}`)}
                onSelect={toggleSelected}
                selectedIds={selectedIds}
                selectionMode={selectionMode}
              />
            ) : (
              <div aria-label="크리에이터 목록" className="fuma-wide-table" role="region">
                <DenseTable
                  columns={creatorColumns}
                  emptyMessage="검색 결과가 없습니다."
                  onRowClick={(creator) => selectionMode ? toggleSelected(creator.id) : navigate(`${creatorPoolPath}${selectedCategory ? "&" : "?"}detail=${creator.id}`)}
                  rowKey={(creator) => creator.id}
                  rows={pagedCreators}
                  selectedRowKeys={[...selectedIds]}
                />
              </div>
            )}
            <Pagination
              onPageChange={setListPage}
              page={currentListPage}
              pageSize={CREATOR_LIST_PAGE_SIZE}
              totalPages={totalListPages}
            />
          </>
        )}
      </div>
    </section>
    {detailCreatorId ? (
      <CreatorDetailPage
        embedded
        creatorIdOverride={detailCreatorId}
        onClose={() => navigate(creatorPoolPath)}
      />
    ) : null}
    </>
  );
}

export function BasicInformation({ creator }: { creator: CreatorFixture }) {
  const fields = [
    ["ID", creator.id],
    ["카테고리", creator.category],
    ["팔로워·구독자", formatNumber(creator.profile.followers)],
    ["콘텐츠 수", formatNumber(creator.contentCount)],
    ["최근 활동일", creator.recentActivity],
  ];

  return (
    <section aria-labelledby="creator-basic-title" className="fuma-content-section" id="basic">
      <header className="fuma-content-section__header">
        <h2 id="creator-basic-title">기본 정보</h2>
      </header>
      <dl className="fuma-key-value-grid">
        {fields.map(([label, value]) => (
          <div className="fuma-key-value-grid__item" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function CreatorProfileHero({
  creator,
}: {
  creator: CreatorFixture;
}) {
  const engagement = engagementResultForCreator(creator);
  const audienceLabel = creator.profile.platform === "Instagram" ? "팔로워" : "구독자";
  const engagementValue =
    engagement.value === null ? "집계 불가" : `${engagement.value.toFixed(1)}%`;
  const proposalHref = `/proposals/new?creator=${creator.id}&channel=${encodeURIComponent("이메일")}`;

  return (
    <section aria-label={`${creator.name} 프로필 요약`} className="fuma-creator-detail-hero fuma-unified-detail-hero">
      <div className="fuma-creator-detail-hero__portrait">
        <CreatorProfilePhoto creatorName={creator.name} src={creator.profile.profileImageUrl} />
        <span className="fuma-creator-detail-hero__platform">
          <PlatformIcon platform={creator.profile.platform} />
        </span>
      </div>
      <div className="fuma-creator-detail-hero__content">
        <div className="fuma-creator-detail-hero__identity">
          <div className="fuma-creator-detail-hero__title-row">
            <h2>{creator.name}</h2>
            <StatusPill tone={proposalTone(creator.proposalStatus)}>{creator.proposalStatus}</StatusPill>
          </div>
          <a className="fuma-creator-detail-hero__channel" href={creator.profile.profileUrl} rel="noreferrer" target="_blank">
            <PlatformLabel platform={creator.profile.platform} />
            <span>{creator.profile.handle}</span>
            <span aria-hidden="true">↗</span>
          </a>
          <div aria-label="카테고리" className="fuma-creator-detail-hero__categories">
            <strong>{creator.category}</strong>
            <span aria-hidden="true">/</span>
            <span>{creator.keywords.join("  ")}</span>
          </div>
        </div>
        <p className="fuma-unified-detail-hero__summary">{creator.aiReport.status === "ready" ? creator.aiReport.summary : "크리에이터 분석 리포트를 생성하고 있습니다."}</p>
        <dl className="fuma-creator-detail-hero__metrics">
          <div>
            <dt>{audienceLabel}</dt>
            <dd>{formatNumber(creator.profile.followers)}</dd>
          </div>
          <div>
            <dt>ER</dt>
            <dd>{engagementValue}</dd>
          </div>
          <div>
            <dt>콘텐츠</dt>
            <dd>{formatNumber(creator.contentCount)}</dd>
          </div>
          <div><dt>최근 활동</dt><dd>{creator.recentActivity}</dd></div>
        </dl>
      </div>
      <aside aria-label="영입 제안" className="fuma-creator-detail-hero__actions fuma-review-summary">
        <span>영입 제안</span>
        <StatusPill tone={proposalTone(creator.proposalStatus)}>{creator.proposalStatus}</StatusPill>
        <p>대표 콘텐츠와 분석 결과를 확인한 뒤 영입 제안을 보낼 수 있습니다.</p>
        <Link className="fuma-review-summary__proposal" to={proposalHref}>제안 보내기</Link>
      </aside>
    </section>
  );
}

void CreatorProfileHero;

function CreatorDetailSidebar({
  actionSection,
  creator,
  statusPill,
}: {
  actionSection?: ReactNode;
  creator: CreatorFixture;
  statusPill?: ReactNode;
}) {
  const engagement = engagementResultForCreator(creator);
  const audienceLabel = creator.profile.platform === "Instagram" ? "팔로워" : "구독자";
  const proposalHref = `/proposals/new?creator=${creator.id}&channel=${encodeURIComponent("이메일")}`;
  const proposalTooltipId = `creator-${creator.id}-proposal-tooltip`;

  return (
    <aside className="fuma-creator-detail-sidebar">
      <section className="fuma-creator-detail-sidebar__profile">
        <div className="fuma-social-profile__identity">
        <div className="fuma-creator-detail-sidebar__portrait">
          <CreatorProfilePhoto creatorName={creator.name} src={creator.profile.profileImageUrl} />
          <PlatformIcon platform={creator.profile.platform} />
        </div>
        <div>
          {statusPill ?? <StatusPill tone={proposalTone(creator.proposalStatus)}>{creator.proposalStatus}</StatusPill>}
          <h2>{creator.name}</h2>
          <a href={creator.profile.profileUrl} rel="noreferrer" target="_blank">{creator.profile.handle} ↗</a>
        </div>
        </div>
        <dl className="fuma-social-profile__metrics">
          <div><dt>게시물</dt><dd>{creator.contentCount}</dd></div>
          <div><dt>{audienceLabel}</dt><dd>{formatNumber(creator.profile.followers)}</dd></div>
          <div><dt>ER</dt><dd>{engagement.value === null ? "-" : `${engagement.value.toFixed(1)}%`}</dd></div>
        </dl>
        <div className="fuma-social-profile__gallery" aria-label="대표 콘텐츠">
          {creator.featuredContents.map((content) => (
            <CreatorContentPhoto creatorName={creator.name} key={content.id} src={content.thumbnailUrl} title={content.title} />
          ))}
        </div>
      </section>

      <section className="fuma-creator-detail-sidebar__info">
        <h3>기본 정보</h3>
        <dl>
          <div><dt>크리에이터 ID</dt><dd>{creator.id}</dd></div>
          <div><dt>계정 ID</dt><dd>{creator.profile.handle}</dd></div>
          <div><dt>이메일</dt><dd>{creator.email}</dd></div>
          <div><dt>카테고리</dt><dd>{creator.category}</dd></div>
          <div><dt>{audienceLabel}</dt><dd>{formatNumber(creator.profile.followers)}</dd></div>
          <div><dt>콘텐츠 수</dt><dd>{formatNumber(creator.contentCount)}건</dd></div>
          <div><dt>최근 활동</dt><dd>{creator.recentActivity}</dd></div>
          <div><dt>ER</dt><dd>{engagement.value === null ? "집계 불가" : `${engagement.value.toFixed(1)}%`}</dd></div>
        </dl>
      </section>

      {actionSection ?? (
        <section className="fuma-creator-detail-sidebar__proposal fuma-creator-detail-sidebar__proposal--send">
          <div className="fuma-creator-detail-sidebar__proposal-action">
            <Link aria-describedby={proposalTooltipId} to={proposalHref}>제안하기</Link>
            <span id={proposalTooltipId} role="tooltip">크리에이터에게 영입을 제안해보세요.</span>
          </div>
        </section>
      )}
    </aside>
  );
}

void CreatorDetailSidebar;

function CreatorFeaturedPosts({ creator }: { creator: CreatorFixture }) {
  return (
    <section aria-labelledby="creator-featured-title" className="fuma-content-section fuma-detail-featured" id="featured">
      <header className="fuma-content-section__header">
        <div>
          <h2 id="creator-featured-title">대표 콘텐츠</h2>
          <span>조회 수가 높은 콘텐츠를 기준으로 표시합니다.</span>
        </div>
        <a href={creator.profile.profileUrl} rel="noreferrer" target="_blank">채널에서 전체 보기 ↗</a>
      </header>
      <div className="fuma-detail-featured__grid">
        {creator.featuredContents.map((content, index) => (
          <a className="fuma-detail-featured__post" href={creator.profile.profileUrl} key={content.id} rel="noreferrer" target="_blank">
            <div className="fuma-detail-featured__image">
              <CreatorContentPhoto creatorName={creator.name} src={content.thumbnailUrl} title={content.title} />
              <span>{index + 1}</span>
              {content.mediaType === "동영상" ? <b aria-label="동영상">▶</b> : null}
            </div>
            <div className="fuma-detail-featured__copy">
              <div><strong>{content.title}</strong><span>{content.mediaType}</span></div>
              <dl className="fuma-detail-featured__metrics">
                <div><dt>조회</dt><dd>{formatNumber(content.views)}</dd></div>
                <div><dt>평균 반응</dt><dd>{formatNumber(creator.profile.averageReactions)}</dd></div>
                <div><dt>도달률</dt><dd>{((content.views / creator.profile.followers) * 100).toFixed(1)}%</dd></div>
              </dl>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

void CreatorFeaturedPosts;

function ProposalMethod({
  buttonLabel,
  children,
  href,
  title,
}: {
  buttonLabel: string;
  children: ReactNode;
  href: string;
  title: string;
}) {
  return (
    <article className="fuma-proposal-method">
      <h3>{title}</h3>
      <div className="fuma-proposal-method__details">{children}</div>
      <Link className="hsas-button hsas-button--primary" to={href}>{buttonLabel}</Link>
    </article>
  );
}

function ProposalMethods({ creator }: { creator: CreatorFixture }) {
  return (
    <section
      aria-labelledby="creator-proposal-title"
      className="fuma-content-section"
      id="proposal"
    >
      <header className="fuma-content-section__header">
        <h2 id="creator-proposal-title">영입 제안</h2>
      </header>
      <div className="fuma-proposal-methods">
        <ProposalMethod buttonLabel="이메일 제안 작성" href={`/proposals/new?creator=${creator.id}&channel=${encodeURIComponent("이메일")}`} title="이메일">
          <dl>
            <div>
              <dt>이메일</dt>
              <dd>{creator.email}</dd>
            </div>
          </dl>
        </ProposalMethod>
      </div>
    </section>
  );
}

void ProposalMethods;

interface CreatorDetailPageProps {
  actionSection?: ReactNode;
  analysisMetricOverrides?: AnalysisMetricOverrides;
  analysisPercentileContext?: AnalysisPercentileContext;
  creatorIdOverride?: string;
  creatorOverride?: CreatorFixture;
  embedded?: boolean;
  onClose?: () => void;
  reportEyebrow?: string;
  reportTitle?: string;
  statusPill?: ReactNode;
  title?: string;
}

export function CreatorDetailPage({
  actionSection,
  analysisMetricOverrides,
  analysisPercentileContext,
  creatorIdOverride,
  creatorOverride,
  embedded = false,
  onClose,
  reportEyebrow,
  reportTitle,
  statusPill,
  title = "크리에이터 상세",
}: CreatorDetailPageProps = {}) {
  const { creatorId: routeCreatorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const creatorId = creatorIdOverride ?? routeCreatorId;
  const fixture = creatorOverride ?? CREATORS.find((creator) => creator.id === creatorId);
  const creator =
    fixture && searchParams.get("fixture") === "ai-pending"
      ? { ...fixture, name: creatorOverride ? fixture.name : fixture.profile.handle, aiReport: PENDING_AI_REPORT }
      : fixture && !creatorOverride
        ? { ...fixture, name: fixture.profile.handle }
        : fixture;
  return (
    <>
      {embedded ? null : <CreatorListPage />}
      <SidePanel onClose={onClose ?? (() => navigate("/creators"))} title={title}>
        <div className="fuma-detail-panel__content fuma-creator-detail-page">
          {creator ? (
            <div className="fuma-creator-detail-workspace">
              <CreatorDetailSidebar
                actionSection={actionSection}
                creator={creator}
                statusPill={statusPill}
              />
              <main className="fuma-creator-detail-main">
                <CreatorAnalysisReport
                  creator={creator}
                  eyebrow={reportEyebrow}
                  metricOverrides={analysisMetricOverrides}
                  percentileContext={analysisPercentileContext}
                  title={reportTitle}
                />
              </main>
            </div>
          ) : (
            <EmptyState
              description="요청한 크리에이터 정보를 확인할 수 없습니다."
              title="대상을 찾을 수 없습니다"
            />
          )}
        </div>
      </SidePanel>
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
        대표 콘텐츠와 분석 리포트를 확인한 뒤 제안 내용을 작성해 주세요.
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
        <PageHeader screenCode="CR202" title="셀렉터스 제안" />
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
      <PageHeader screenCode="CR202" title="셀렉터스 제안" />
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
      <PageHeader screenCode="CR201" title="제안 이력 관리" />
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
        <nav aria-label="제안 발송 상태" className="fuma-creator-category-filter fuma-proposal-status-filter">
          <div>
            <button
              aria-pressed={!selectedStatus}
              className="fuma-creator-category-filter__option"
              onClick={() => selectStatus()}
              type="button"
            >
              전체
            </button>
            {PROPOSAL_HISTORY_STATUSES.map((status) => (
              <button
                aria-pressed={selectedStatus === status}
                className="fuma-creator-category-filter__option"
                key={status}
                onClick={() => selectStatus(status)}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        </nav>
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
