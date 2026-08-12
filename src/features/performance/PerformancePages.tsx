import { useState } from "react";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  Eye,
  Heart,
  MessageCircle,
  MousePointer2,
  PlaySquare,
  ShoppingBag,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "../../components/shell/PageHeader";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { paginate } from "../../lib/pagination";
import "../../styles/performance-dashboard.css";
import {
  PerformanceBarChart,
  PerformanceKpiGrid,
  PerformanceRanking,
  PerformanceTrendChart,
} from "./PerformanceCharts";
import {
  CAMPAIGN_PERFORMANCE,
  CONTENT_INFLUENCE,
  PERFORMANCE_TREND,
  PRODUCT_INFLUENCE,
  SELECTOR_PERFORMANCE,
  creatorNameById,
  formatCount,
  formatRate,
  selectorCohortById,
  type CampaignPerformance,
  type ContentInfluence,
  type CreatorInfluence,
  type PerformanceTrendPoint,
  type SelectorActivityStatus,
  type SelectorPerformance,
} from "./fixtures";

const COHORT_OPTIONS = [
  { label: "전체", value: "" },
  ...Array.from(new Set(SELECTOR_PERFORMANCE.map((selector) => selector.cohort))).map((cohort) => ({
    label: cohort,
    value: cohort,
  })),
];

const CAMPAIGN_OPTIONS = [
  { label: "전체", value: "" },
  ...CAMPAIGN_PERFORMANCE.map((campaign) => ({
    label: campaign.name,
    value: campaign.id,
  })),
];

interface PerformanceFilterValues {
  campaign: string;
  cohort: string;
  keyword: string;
  periodEnd: string;
  periodStart: string;
}

const EMPTY_PERFORMANCE_FILTERS: PerformanceFilterValues = {
  campaign: "",
  cohort: "",
  keyword: "",
  periodEnd: "",
  periodStart: "",
};

const DASHBOARD_INITIAL_FILTERS: PerformanceFilterValues = {
  ...EMPTY_PERFORMANCE_FILTERS,
  periodEnd: PERFORMANCE_TREND.at(-1)?.date ?? "",
  periodStart: PERFORMANCE_TREND[0]?.date ?? "",
};

const PERFORMANCE_PAGE_SIZE = 20;
const TOP_SELECTOR_INITIAL_COUNT = 10;

function usePerformanceFilterState(initialValues = EMPTY_PERFORMANCE_FILTERS) {
  const [draftFilters, setDraftFilters] = useState<PerformanceFilterValues>(() => ({
    ...initialValues,
  }));
  const [appliedFilters, setAppliedFilters] = useState<PerformanceFilterValues>(() => ({
    ...initialValues,
  }));

  const updateDraftFilter = <Key extends keyof PerformanceFilterValues>(
    key: Key,
    value: PerformanceFilterValues[Key],
  ) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = () => setAppliedFilters({ ...draftFilters });
  const resetFilters = () => {
    setDraftFilters({ ...EMPTY_PERFORMANCE_FILTERS });
    setAppliedFilters({ ...EMPTY_PERFORMANCE_FILTERS });
  };

  return {
    appliedFilters,
    applyFilters,
    draftFilters,
    resetFilters,
    updateDraftFilter,
  };
}

function selectorProfilePath(selectorId: string) {
  const selectorNumber = Number(selectorId.replace(/\D/g, "")) || 1;
  const mediaIndex = ((selectorNumber - 1) % 4) + 1;

  return `creator-media/kr-cr-${String(mediaIndex).padStart(3, "0")}-profile.jpg`;
}

interface KeywordFilter {
  id: string;
  label: string;
  placeholder: string;
}

function PerformanceFilters({
  keyword,
  onChange,
  onReset,
  onSearch,
  values,
}: {
  keyword?: KeywordFilter;
  onChange: <Key extends keyof PerformanceFilterValues>(
    key: Key,
    value: PerformanceFilterValues[Key],
  ) => void;
  onReset: () => void;
  onSearch: () => void;
  values: PerformanceFilterValues;
}) {
  return (
    <div className="fuma-performance-search fuma-operations-search fuma-settlement-search">
      <SearchPanel actions={<SearchActions onReset={onReset} onSearch={onSearch} />}>
        {keyword ? (
          <FilterField htmlFor={keyword.id} label={keyword.label}>
            <TextInput
              aria-label={keyword.label}
              id={keyword.id}
              onChange={(event) => onChange("keyword", event.target.value)}
              placeholder={keyword.placeholder}
              value={values.keyword}
            />
          </FilterField>
        ) : null}
        <FilterField htmlFor="performance-cohort" label="기수">
          <Select
            aria-label="기수"
            id="performance-cohort"
            onChange={(event) => onChange("cohort", event.target.value)}
            options={COHORT_OPTIONS}
            value={values.cohort}
          />
        </FilterField>
        <FilterField htmlFor="performance-campaign" label="캠페인">
          <Select
            aria-label="캠페인"
            id="performance-campaign"
            onChange={(event) => onChange("campaign", event.target.value)}
            options={CAMPAIGN_OPTIONS}
            value={values.campaign}
          />
        </FilterField>
        <div aria-label="집계 기간" className="fuma-performance-period-filter" role="group">
          <span>기간</span>
          <div>
            <TextInput
              aria-label="집계 시작일"
              id="performance-period-start"
              max={values.periodEnd || undefined}
              name="periodStart"
              onChange={(event) => onChange("periodStart", event.target.value)}
              type="date"
              value={values.periodStart}
            />
            <span aria-hidden="true">~</span>
            <TextInput
              aria-label="집계 종료일"
              id="performance-period-end"
              min={values.periodStart || undefined}
              name="periodEnd"
              onChange={(event) => onChange("periodEnd", event.target.value)}
              type="date"
              value={values.periodEnd}
            />
          </div>
        </div>
      </SearchPanel>
    </div>
  );
}

function PerformancePeriodSummary({
  change,
  label,
  points,
  value,
}: {
  change: string;
  label: string;
  points: readonly number[];
  value: string;
}) {
  const safePoints = points.length > 0
    ? points.map((point) => Math.max(0, Number.isFinite(point) ? point : 0))
    : [0];
  const maximum = Math.max(1, ...safePoints);
  const minimum = Math.min(...safePoints);
  const range = Math.max(1, maximum - minimum);
  const path = safePoints
    .map((point, index) => {
      const x = safePoints.length <= 1 ? 50 : (index / (safePoints.length - 1)) * 100;
      const y = 30 - ((point - minimum) / range) * 22;
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");

  return (
    <section aria-label="기간 성과 요약" className="fuma-performance-period-summary">
      <header>
        <span>PERIOD SUMMARY</span>
        <em><i aria-hidden="true" />집계 완료</em>
      </header>
      <h2>기간 성과 요약</h2>
      <p>{label}</p>
      <div className="fuma-performance-period-summary__metric">
        <strong>{value}</strong>
        <span>{change}</span>
      </div>
      <svg aria-label={`선택 기간 ${label} 추이`} role="img" viewBox="0 0 100 34">
        <path d="M0 31H100" />
        <path className="fuma-performance-period-summary__line" d={path} />
      </svg>
      <footer>
        <span>2026.07.29 ~ 07.31 대비</span>
        <span>08.03 23:50 집계</span>
      </footer>
    </section>
  );
}

function PerformanceLiftCards({
  items,
}: {
  items: readonly { label: string; value: string }[];
}) {
  return (
    <section aria-label="주요 지표 증감" className="fuma-performance-lift-list">
      {items.map((item, index) => (
        <article key={item.label}>
          <span>{item.label}</span>
          <div>
            <strong>{item.value}</strong>
            <em><TrendingUp aria-hidden="true" size={12} /> +{index + 1}.{index + 2}%</em>
          </div>
        </article>
      ))}
    </section>
  );
}

interface PerformanceResultTableProps<T extends object> {
  className: string;
  columns: DenseTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  title: string;
}

function PerformanceResultTable<T extends object>({
  className,
  columns,
  rows,
  rowKey,
  title,
}: PerformanceResultTableProps<T>) {
  const [page, setPage] = useState(1);
  const pageSize = PERFORMANCE_PAGE_SIZE;
  const {
    currentPage,
    pagedItems: pagedRows,
    totalPages,
  } = paginate(rows, page, pageSize);

  return (
    <section aria-label={title} className="fuma-performance-results">
      <div className="fuma-result-toolbar">
        <strong>{title}</strong>
        <span>총 {rows.length}건</span>
      </div>
      <div className={`fuma-wide-table ${className}`}>
        <DenseTable columns={columns} rowKey={rowKey} rows={pagedRows} />
      </div>
      <Pagination
        onPageChange={setPage}
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
      />
    </section>
  );
}

function selectorStatusTone(
  status: SelectorActivityStatus,
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

function campaignStatusTone(
  status: CampaignPerformance["status"],
): NonNullable<StatusPillProps["tone"]> {
  if (status === "진행 중") {
    return "approved";
  }
  if (status === "시작 전") {
    return "pending";
  }
  return "neutral";
}

const CAMPAIGN_COLUMNS: DenseTableColumn<CampaignPerformance>[] = [
  { key: "id", header: "캠페인 ID", width: 96 },
  { key: "name", header: "캠페인명", width: 260 },
  {
    key: "status",
    header: "상태",
    width: 92,
    align: "center",
    render: (campaign) => (
      <StatusPill tone={campaignStatusTone(campaign.status)}>{campaign.status}</StatusPill>
    ),
  },
  { key: "clicks", header: "클릭 수", width: 110, align: "right", render: (campaign) => formatCount(campaign.clicks) },
  { key: "conversions", header: "구매 전환 수", width: 120, align: "right", render: (campaign) => formatCount(campaign.conversions) },
  { id: "conversionRate", header: "전환율", width: 90, align: "right", render: (campaign) => formatRate(campaign.conversions, campaign.clicks) },
];

const SELECTOR_COLUMNS: DenseTableColumn<SelectorPerformance>[] = [
  { key: "id", header: "셀렉터스 ID", width: 96 },
  { key: "name", header: "셀렉터스", width: 110 },
  { key: "cohort", header: "기수", width: 70, align: "center" },
  {
    key: "status",
    header: "활동 상태",
    width: 92,
    align: "center",
    render: (selector) => (
      <StatusPill tone={selectorStatusTone(selector.status)}>
        {selector.status}
      </StatusPill>
    ),
  },
  {
    key: "clicks",
    header: "클릭 수",
    width: 110,
    align: "right",
    render: (selector) => formatCount(selector.clicks),
  },
  {
    key: "conversions",
    header: "구매 전환 수",
    width: 120,
    align: "right",
    render: (selector) => formatCount(selector.conversions),
  },
  {
    id: "conversionRate",
    header: "전환율",
    width: 90,
    align: "right",
    render: (selector) => formatRate(selector.conversions, selector.clicks),
  },
];

const CONTENT_MEDIA: Record<string, { creatorImage: string; thumbnail: string }> = {
  "ct-001": { thumbnail: "creator-media/kr-cr-001-01.jpg", creatorImage: "creator-media/kr-cr-001-profile.jpg" },
  "ct-002": { thumbnail: "creator-media/kr-cr-002-02.jpg", creatorImage: "creator-media/kr-cr-002-profile.jpg" },
  "ct-003": { thumbnail: "creator-media/kr-cr-001-02.jpg", creatorImage: "creator-media/kr-cr-001-profile.jpg" },
  "ct-004": { thumbnail: "creator-media/kr-cr-003-01.jpg", creatorImage: "creator-media/kr-cr-003-profile.jpg" },
  "ct-005": { thumbnail: "creator-media/kr-cr-004-01.jpg", creatorImage: "creator-media/kr-cr-004-profile.jpg" },
};

function contentMediaFor(content: ContentInfluence) {
  const savedMedia = CONTENT_MEDIA[content.id];

  if (savedMedia) {
    return savedMedia;
  }

  const selectorNumber = Number(content.selectorId.replace(/\D/g, "")) || 1;
  const creatorNumber = ((selectorNumber - 1) % 4) + 1;
  const imageNumber = ((selectorNumber - 1) % 3) + 1;
  const creatorId = String(creatorNumber).padStart(3, "0");

  return {
    thumbnail: `creator-media/kr-cr-${creatorId}-${String(imageNumber).padStart(2, "0")}.jpg`,
    creatorImage: `creator-media/kr-cr-${creatorId}-profile.jpg`,
  };
}

interface CampaignContentCardData {
  id: string;
  campaignId: string;
  title: string;
  creator: string;
  creatorImage: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
}

const CAMPAIGN_CONTENT_CARDS: readonly CampaignContentCardData[] = [
  { id: "cpc-001", campaignId: "cp-001", title: "가을 라운딩을 위한 패딩 팬츠 스타일링", creator: "김서연", creatorImage: "creator-media/kr-cr-001-profile.jpg", thumbnail: "creator-media/kr-cr-001-01.jpg", views: 48_200, likes: 3_880, comments: 274, publishedAt: "2026.08.01" },
  { id: "cpc-002", campaignId: "cp-001", title: "필드에서 직접 입어본 라이트 웨더 베스트", creator: "박도윤", creatorImage: "creator-media/kr-cr-002-profile.jpg", thumbnail: "creator-media/kr-cr-002-02.jpg", views: 41_300, likes: 2_780, comments: 188, publishedAt: "2026.08.02" },
  { id: "cpc-003", campaignId: "cp-001", title: "초가을 골프룩에 어울리는 클래식 캡", creator: "이지아", creatorImage: "creator-media/kr-cr-003-profile.jpg", thumbnail: "creator-media/kr-cr-003-01.jpg", views: 28_600, likes: 1_220, comments: 96, publishedAt: "2026.08.02" },
  { id: "cpc-004", campaignId: "cp-001", title: "라운딩 전 꼭 확인할 골프웨어 레이어드 팁", creator: "오하늘", creatorImage: "creator-media/kr-cr-004-profile.jpg", thumbnail: "creator-media/kr-cr-004-02.jpg", views: 36_800, likes: 2_410, comments: 142, publishedAt: "2026.08.03" },
  { id: "cpc-005", campaignId: "cp-001", title: "움직임이 편한 에어핏 팬츠 실착 리뷰", creator: "김서연", creatorImage: "creator-media/kr-cr-001-profile.jpg", thumbnail: "creator-media/kr-cr-001-03.jpg", views: 52_700, likes: 4_120, comments: 318, publishedAt: "2026.08.03" },
  { id: "cpc-006", campaignId: "cp-001", title: "아침 라운딩부터 클럽하우스까지 한 벌 코디", creator: "박도윤", creatorImage: "creator-media/kr-cr-002-profile.jpg", thumbnail: "creator-media/kr-cr-002-01.jpg", views: 31_900, likes: 1_940, comments: 121, publishedAt: "2026.08.04" },
  { id: "cpc-007", campaignId: "cp-002", title: "휴양지에서 빛나는 리조트 린넨 셋업", creator: "오하늘", creatorImage: "creator-media/kr-cr-004-profile.jpg", thumbnail: "creator-media/kr-cr-004-01.jpg", views: 154_200, likes: 11_920, comments: 940, publishedAt: "2026.07.24" },
  { id: "cpc-008", campaignId: "cp-002", title: "바캉스 컬러를 살린 데일리 스타일링", creator: "김서연", creatorImage: "creator-media/kr-cr-001-profile.jpg", thumbnail: "creator-media/kr-cr-001-02.jpg", views: 62_200, likes: 4_980, comments: 312, publishedAt: "2026.07.25" },
  { id: "cpc-009", campaignId: "cp-002", title: "여행 가방에 꼭 챙긴 썸머 드레이프 원피스", creator: "이지아", creatorImage: "creator-media/kr-cr-003-profile.jpg", thumbnail: "creator-media/kr-cr-003-02.jpg", views: 44_100, likes: 3_120, comments: 205, publishedAt: "2026.07.26" },
  { id: "cpc-010", campaignId: "cp-002", title: "라피아 미니 토트백으로 완성한 휴양지 룩", creator: "오하늘", creatorImage: "creator-media/kr-cr-004-profile.jpg", thumbnail: "creator-media/kr-cr-004-03.jpg", views: 34_700, likes: 2_310, comments: 166, publishedAt: "2026.07.27" },
  { id: "cpc-011", campaignId: "cp-002", title: "낮부터 저녁까지 입는 리조트웨어 조합", creator: "박도윤", creatorImage: "creator-media/kr-cr-002-profile.jpg", thumbnail: "creator-media/kr-cr-002-03.jpg", views: 39_800, likes: 2_680, comments: 191, publishedAt: "2026.07.28" },
  { id: "cpc-012", campaignId: "cp-003", title: "초여름 에센셜 가디건 3가지 코디", creator: "이지아", creatorImage: "creator-media/kr-cr-003-profile.jpg", thumbnail: "creator-media/kr-cr-003-01.jpg", views: 17_900, likes: 912, comments: 68, publishedAt: "2026.06.15" },
  { id: "cpc-013", campaignId: "cp-003", title: "코튼 립 슬리브리스 출근룩 활용법", creator: "김서연", creatorImage: "creator-media/kr-cr-001-profile.jpg", thumbnail: "creator-media/kr-cr-001-02.jpg", views: 12_480, likes: 610, comments: 44, publishedAt: "2026.06.16" },
  { id: "cpc-014", campaignId: "cp-003", title: "데일리 스트레이트 데님 핏 비교", creator: "박도윤", creatorImage: "creator-media/kr-cr-002-profile.jpg", thumbnail: "creator-media/kr-cr-002-02.jpg", views: 9_260, likes: 438, comments: 31, publishedAt: "2026.06.17" },
  { id: "cpc-015", campaignId: "cp-003", title: "한여름 전까지 입기 좋은 가벼운 레이어드", creator: "오하늘", creatorImage: "creator-media/kr-cr-004-profile.jpg", thumbnail: "creator-media/kr-cr-004-02.jpg", views: 14_800, likes: 736, comments: 52, publishedAt: "2026.06.18" },
];

function CampaignContentGallery({
  campaigns = CAMPAIGN_PERFORMANCE,
  contentCards = CAMPAIGN_CONTENT_CARDS,
}: {
  campaigns?: readonly CampaignPerformance[];
  contentCards?: readonly CampaignContentCardData[];
}) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id ?? "");
  const activeCampaignId = campaigns.some((campaign) => campaign.id === selectedCampaignId)
    ? selectedCampaignId
    : campaigns[0]?.id ?? "";
  const selectedCampaign = campaigns.find((campaign) => campaign.id === activeCampaignId);
  const cards = contentCards.filter((card) => card.campaignId === activeCampaignId);

  return (
    <section aria-label="캠페인 내 콘텐츠" className="fuma-campaign-content-gallery">
      <header className="fuma-campaign-content-gallery__heading">
        <div>
          <span>CAMPAIGN CONTENT</span>
          <h2>캠페인 내 콘텐츠</h2>
        </div>
        <p>{selectedCampaign?.name} · 콘텐츠 {cards.length}건</p>
      </header>
      <div aria-label="캠페인 선택" className="fuma-campaign-content-gallery__tabs" role="tablist">
        {campaigns.map((campaign) => (
          <button
            aria-selected={campaign.id === activeCampaignId}
            key={campaign.id}
            onClick={() => setSelectedCampaignId(campaign.id)}
            role="tab"
            type="button"
          >
            #{campaign.name.replaceAll(" ", "")}
          </button>
        ))}
      </div>
      <div className="fuma-campaign-content-gallery__track">
        {cards.map((card, index) => (
          <article className="fuma-campaign-content-card" key={card.id}>
            <div className="fuma-campaign-content-card__media">
              <img alt="" src={`${import.meta.env.BASE_URL}${card.thumbnail}`} />
              <span>#{index + 1}</span>
              <em>광고</em>
            </div>
            <div className="fuma-campaign-content-card__body">
              <h3>{card.title}</h3>
              <time>{card.publishedAt}</time>
              <div className="fuma-campaign-content-card__creator">
                <img alt="" src={`${import.meta.env.BASE_URL}${card.creatorImage}`} />
                <strong>@{card.creator}</strong>
              </div>
              <dl>
                <div><dt><Eye aria-hidden="true" size={12} /> 조회</dt><dd>{formatCount(card.views)}</dd></div>
                <div><dt><Heart aria-hidden="true" size={12} /> 좋아요</dt><dd>{formatCount(card.likes)}</dd></div>
                <div><dt><MessageCircle aria-hidden="true" size={12} /> 댓글</dt><dd>{formatCount(card.comments)}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SelectorPerformanceReport({
  selectors,
}: {
  selectors: readonly SelectorPerformance[];
}) {
  const [showAllSelectors, setShowAllSelectors] = useState(false);
  const rankedSelectors = [...selectors].sort(
    (left, right) => right.conversions - left.conversions || right.clicks - left.clicks,
  );
  const totalConversions = rankedSelectors.reduce(
    (total, selector) => total + selector.conversions,
    0,
  );
  const totalClicks = rankedSelectors.reduce((total, selector) => total + selector.clicks, 0);
  const topSelectors = rankedSelectors.slice(0, 5);
  const maxTopConversions = Math.max(1, ...topSelectors.map((selector) => selector.conversions));
  const topSelectorConversions = topSelectors
    .reduce((total, selector) => total + selector.conversions, 0);
  const topTenCount = Math.max(1, Math.ceil(rankedSelectors.length * 0.1));
  const topHalfCount = Math.max(topTenCount, Math.ceil(rankedSelectors.length * 0.5));
  const conversionDistribution = [
    { label: "상위 10%", conversions: rankedSelectors.slice(0, topTenCount).reduce((total, selector) => total + selector.conversions, 0) },
    { label: "다음 40%", conversions: rankedSelectors.slice(topTenCount, topHalfCount).reduce((total, selector) => total + selector.conversions, 0) },
    { label: "나머지", conversions: rankedSelectors.slice(topHalfCount).reduce((total, selector) => total + selector.conversions, 0) },
  ].map((group) => ({
    ...group,
    share: totalConversions === 0 ? 0 : (group.conversions / totalConversions) * 100,
  }));
  const maxDistributionShare = Math.max(1, ...conversionDistribution.map((group) => group.share));
  const visibleSelectors = showAllSelectors
    ? rankedSelectors
    : rankedSelectors.slice(0, TOP_SELECTOR_INITIAL_COUNT);
  const hiddenSelectorCount = Math.max(
    0,
    rankedSelectors.length - TOP_SELECTOR_INITIAL_COUNT,
  );

  return (
    <section aria-label="셀렉터스 성과" className="fuma-selector-performance-report">
      <header className="fuma-selector-performance-report__header">
        <div>
          <p>TOP SELECTORS</p>
          <h2>셀렉터스 성과</h2>
          <span>구매 전환 기여도 기준</span>
        </div>
        <dl>
          <div><dt>분석 셀렉터스</dt><dd>{rankedSelectors.length}명</dd></div>
          <div><dt>총 구매 전환</dt><dd>{formatCount(totalConversions)}</dd></div>
        </dl>
      </header>
      <section aria-labelledby="selector-performance-comparison-title" className="fuma-selector-performance-report__insights">
        <h3 id="selector-performance-comparison-title">셀렉터스 성과 비교</h3>
        <dl className="fuma-selector-performance-report__kpis">
          <div><dt>분석 셀렉터스</dt><dd>{rankedSelectors.length}<small>명</small></dd></div>
          <div><dt>평균 전환율</dt><dd>{formatRate(totalConversions, totalClicks)}</dd></div>
          <div><dt>TOP 5 전환 비중</dt><dd>{totalConversions === 0 ? "-" : `${((topSelectorConversions / totalConversions) * 100).toFixed(1)}%`}</dd></div>
        </dl>
        <div className="fuma-selector-performance-report__charts">
          <figure aria-label="TOP 5 셀렉터스 구매 전환" className="fuma-selector-performance-report__chart">
            <figcaption><strong>TOP 5 셀렉터스 구매 전환</strong><span>구매 전환 수</span></figcaption>
            <div className="fuma-selector-performance-report__bars">
              {topSelectors.map((selector) => (
                <div className="fuma-selector-performance-report__bar-item" key={selector.id}>
                  <strong>{formatCount(selector.conversions)}</strong>
                  <i aria-hidden="true"><b style={{ height: `${(selector.conversions / maxTopConversions) * 100}%` }} /></i>
                  <span>{selector.name}</span>
                </div>
              ))}
            </div>
          </figure>
          <figure aria-label="전체 셀렉터스 전환 기여도 분포" className="fuma-selector-performance-report__chart">
            <figcaption><strong>전체 셀렉터스 전환 기여도 분포</strong><span>구매 전환 기여 비중</span></figcaption>
            <div className="fuma-selector-performance-report__bars fuma-selector-performance-report__bars--cohort">
              {conversionDistribution.map((group) => (
                <div className="fuma-selector-performance-report__bar-item" key={group.label}>
                  <strong>{group.share.toFixed(1)}%</strong>
                  <i aria-hidden="true"><b style={{ height: `${(group.share / maxDistributionShare) * 100}%` }} /></i>
                  <span>{group.label}</span>
                </div>
              ))}
            </div>
          </figure>
        </div>
      </section>
      <section aria-labelledby="top-selectors-title" className="fuma-selector-performance-report__ranking">
        <header>
          <div>
            <p>TOP SELECTORS</p>
            <h3 id="top-selectors-title">TOP 셀렉터스</h3>
          </div>
          <span>전환 성과 순</span>
        </header>
        <div className="fuma-selector-performance-report__list">
          {visibleSelectors.length > 0 ? visibleSelectors.map((selector, index) => {
            const contribution = totalConversions === 0 ? 0 : (selector.conversions / totalConversions) * 100;
            const profilePath = selectorProfilePath(selector.id);
            const rank = index + 1;

            return (
              <article className="fuma-selector-performance-report__entry" key={selector.id}>
                <span className="fuma-selector-performance-report__rank">{String(rank).padStart(2, "0")}</span>
                <img
                  alt={`${selector.name} 프로필`}
                  className="fuma-selector-performance-report__profile"
                  src={`${import.meta.env.BASE_URL}${profilePath}`}
                />
                <div className="fuma-selector-performance-report__identity">
                  <h4>{selector.name}</h4>
                  <div className="fuma-selector-performance-report__identity-meta">
                    <span>{selector.cohort}</span>
                    <span aria-label={`${selector.platforms.join(" 및 ")} 플랫폼`} className="fuma-selector-performance-report__platforms">
                      {selector.platforms.map((platform) => (
                        <PlatformIcon decorative key={platform} platform={platform} />
                      ))}
                    </span>
                  </div>
                </div>
                <dl className="fuma-selector-performance-report__metrics">
                  <div><dt>클릭 수</dt><dd>{formatCount(selector.clicks)}</dd></div>
                  <div><dt>구매 전환</dt><dd>{formatCount(selector.conversions)}</dd></div>
                  <div><dt>전환율</dt><dd>{formatRate(selector.conversions, selector.clicks)}</dd></div>
                </dl>
                <div className="fuma-selector-performance-report__contribution">
                  <span>기여도 <b>{contribution.toFixed(1)}%</b></span>
                  <i aria-hidden="true"><em style={{ width: `${contribution}%` }} /></i>
                </div>
              </article>
            );
          }) : <p className="fuma-selector-detail-empty">조회 결과가 없습니다.</p>}
        </div>
        {hiddenSelectorCount > 0 ? (
          <button
            aria-expanded={showAllSelectors}
            className="fuma-selector-performance-report__more"
            onClick={() => setShowAllSelectors((current) => !current)}
            type="button"
          >
            {showAllSelectors ? "접기" : `더보기 (${hiddenSelectorCount}명)`}
          </button>
        ) : null}
      </section>
    </section>
  );
}

function trendDateLabel(recordedAt: string | undefined) {
  if (!recordedAt) {
    return "";
  }

  const [, month, day] = recordedAt.split("-");
  return month && day ? `${month}.${day}` : recordedAt;
}

function ContentTrendGraph({
  label,
  recordedAt,
  tone,
  values,
}: {
  label: string;
  recordedAt: readonly string[];
  tone: "views" | "likes";
  values: readonly number[];
}) {
  if (values.length === 0) {
    return (
      <div aria-label={`${label} 추이 데이터 없음`} className="fuma-content-trend-graph is-empty">
        데이터 없음
      </div>
    );
  }

  const chartWidth = 144;
  const baseline = 29;
  const chartPadding = 4;
  const barGap = 3;
  const maximum = Math.max(1, ...values);
  const barWidth = (chartWidth - chartPadding * 2 - barGap * (values.length - 1)) / values.length;

  return (
    <div aria-label={`날짜별 ${label} 추이`} className={`fuma-content-trend-graph is-${tone}`}>
      <svg aria-hidden="true" viewBox="0 0 144 34">
        <line x1="4" x2="140" y1="29" y2="29" />
        {values.map((value, index) => {
          const height = Math.max(2, (value / maximum) * 23);
          const x = chartPadding + index * (barWidth + barGap);

          return (
            <rect
              height={height}
              key={`${recordedAt[index]}-${value}`}
              rx="1.5"
              width={barWidth}
              x={x}
              y={baseline - height}
            />
          );
        })}
      </svg>
      <div className="fuma-content-trend-graph__dates">
        <span>{trendDateLabel(recordedAt[0])}</span>
        <span>{trendDateLabel(recordedAt.at(-1))}</span>
      </div>
    </div>
  );
}

function ContentPerformanceReport({
  contents,
  onPageChange,
  page,
}: {
  contents: readonly ContentInfluence[];
  onPageChange: (page: number) => void;
  page: number;
}) {
  const orderById = new Map(contents.map((content, index) => [content.id, index + 1]));
  const {
    currentPage,
    pagedItems: pagedContents,
    totalPages,
  } = paginate(contents, page, PERFORMANCE_PAGE_SIZE);
  const columns: DenseTableColumn<ContentInfluence>[] = [
    {
      id: "rank",
      header: "순위",
      width: 64,
      align: "center",
      render: (content) => orderById.get(content.id) ?? "-",
    },
    {
      id: "content",
      header: "콘텐츠",
      width: 300,
      render: (content) => {
        const media = contentMediaFor(content);

        return (
          <div className="fuma-content-reaction-table__content">
            <img alt="" src={`${import.meta.env.BASE_URL}${media.thumbnail}`} />
            <div>
              <strong>{content.title}</strong>
              <span>{content.publishedAt}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "platform",
      header: "플랫폼",
      align: "center",
      width: 112,
      render: (content) => (
        <span className="fuma-content-reaction-table__platform">
          <PlatformIcon decorative platform={content.platform as "Instagram" | "YouTube"} />
          {content.platform}
        </span>
      ),
    },
    {
      id: "selector",
      header: "셀렉터스",
      width: 160,
      render: (content) => {
        const media = contentMediaFor(content);

        return (
          <div className="fuma-content-reaction-table__channel">
            <img alt="" src={`${import.meta.env.BASE_URL}${media.creatorImage}`} />
            <span>
              <strong>{creatorNameById(content.creatorId)}</strong>
            </span>
          </div>
        );
      },
    },
    {
      key: "followers",
      header: "팔로워 수",
      width: 112,
      align: "right",
      render: (content) => formatCount(content.followers),
    },
    {
      key: "views",
      header: "누적 조회 수",
      width: 108,
      align: "right",
      render: (content) => (content.views > 0 ? formatCount(content.views) : "-"),
    },
    {
      key: "likes",
      header: "누적 좋아요 수",
      width: 108,
      align: "right",
      render: (content) => <span className="fuma-content-reaction-table__count">{formatCount(content.likes)}</span>,
    },
    {
      id: "viewTrend",
      header: "조회수 추이",
      width: 176,
      render: (content) => (
        <ContentTrendGraph
          label="조회수"
          recordedAt={content.viewsTrend.map((point) => point.recordedAt)}
          tone="views"
          values={content.viewsTrend.map((point) => point.views)}
        />
      ),
    },
    {
      id: "likeTrend",
      header: "좋아요 수 추이",
      width: 176,
      render: (content) => (
        <ContentTrendGraph
          label="좋아요 수"
          recordedAt={content.reactionTrend.map((point) => point.recordedAt)}
          tone="likes"
          values={content.reactionTrend.map((point) => point.likes)}
        />
      ),
    },
  ];

  return (
    <section aria-label="콘텐츠별 반응" className="fuma-content-performance-results">
      <ResultToolbar
        className="fuma-simple-result-toolbar fuma-campaign-result-toolbar"
        meta={<span>총 {contents.length}건</span>}
        title="콘텐츠 성과"
      />
      <div
        aria-label="콘텐츠 성과 목록"
        className="fuma-wide-table fuma-settlement-table fuma-campaign-list-table"
        role="region"
      >
        <DenseTable columns={columns} rowKey={(content) => content.id} rows={pagedContents} />
      </div>
      <Pagination
        onPageChange={onPageChange}
        page={currentPage}
        pageSize={PERFORMANCE_PAGE_SIZE}
        totalPages={totalPages}
      />
    </section>
  );
}

interface CampaignBundlePerformance extends CampaignPerformance {
  contentCount: number;
  productBundle: string;
  productCount: number;
}

function formattedTotal(rowCount: number, total: number) {
  return rowCount === 0 ? "-" : formatCount(total);
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildDashboardVisualData(
  campaigns: readonly CampaignPerformance[],
  selectors: readonly SelectorPerformance[],
  trendPoints: readonly PerformanceTrendPoint[],
) {
  const totalClicks = campaigns.reduce(
    (total, campaign) => total + campaign.clicks,
    0,
  );
  const totalConversions = campaigns.reduce(
    (total, campaign) => total + campaign.conversions,
    0,
  );
  const conversionRate =
    campaigns.length === 0
      ? "-"
      : totalClicks === 0 && totalConversions === 0
        ? "0"
        : formatRate(totalConversions, totalClicks);

  return {
    campaignItems: campaigns.map((campaign) => ({
      id: campaign.id,
      label: campaign.name,
      primaryText: `전환율 ${formatRate(campaign.conversions, campaign.clicks)}`,
      primaryValue:
        campaign.clicks === 0
          ? 0
          : (campaign.conversions / campaign.clicks) * 100,
      sortValue:
        campaign.clicks === 0
          ? 0
          : campaign.conversions / campaign.clicks,
    })),
    kpis: [
      { label: "총 클릭 수", value: formattedTotal(campaigns.length, totalClicks), icon: <MousePointer2 size={19} />, featured: true },
      {
        label: "구매 전환 수",
        value: formattedTotal(campaigns.length, totalConversions),
        icon: <ShoppingBag size={19} />,
      },
      { label: "전환율", value: conversionRate, icon: <ChartNoAxesCombined size={19} /> },
      {
        label: "집계 셀렉터스",
        value: selectors.length === 0 ? "-" : `${selectors.length}명`,
        icon: <UsersRound size={19} />,
      },
    ],
    selectorItems: selectors.map((selector) => ({
      conversionText: `${formatCount(selector.conversions)}건`,
      conversions: selector.conversions,
      detail: selector.cohort,
      id: selector.id,
      label: selector.name,
    })),
    trendPoints,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildCreatorVisualData(
  creators: readonly CreatorInfluence[],
) {
  const totalViews = creators.reduce(
    (total, creator) => total + creator.views,
    0,
  );
  const totalLikes = creators.reduce(
    (total, creator) => total + creator.likes,
    0,
  );
  const totalComments = creators.reduce(
    (total, creator) => total + creator.comments,
    0,
  );
  const totalConversions = creators.reduce(
    (total, creator) => total + creator.conversions,
    0,
  );

  return {
    areaPoints: creators.map((creator) => ({
      id: creator.id,
      label: creator.name,
      primary: creator.views,
      secondary: creator.conversions,
    })),
    chartItems: creators.map((creator) => ({
      id: creator.id,
      label: creator.name,
      primaryText: `조회 수 ${formatCount(creator.views)}`,
      primaryValue: creator.views,
      secondaryText: `구매 전환 ${formatCount(creator.conversions)}`,
      secondaryValue: creator.conversions,
      sortValue: creator.conversions,
    })),
    kpis: [
      { label: "총 조회 수", value: formattedTotal(creators.length, totalViews), icon: <PlaySquare size={19} /> },
      { label: "총 좋아요", value: formattedTotal(creators.length, totalLikes), icon: <ChartNoAxesCombined size={19} /> },
      { label: "총 댓글", value: formattedTotal(creators.length, totalComments), icon: <UsersRound size={19} /> },
      {
        label: "구매 전환 수",
        value: formattedTotal(creators.length, totalConversions),
        icon: <ShoppingBag size={19} />,
      },
    ],
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildContentVisualData(
  contents: readonly ContentInfluence[],
) {
  const totalViews = contents.reduce(
    (total, content) => total + content.views,
    0,
  );
  const totalReactions = contents.reduce(
    (total, content) => total + content.likes + content.comments,
    0,
  );
  const totalConversions = contents.reduce(
    (total, content) => total + content.conversions,
    0,
  );

  return {
    areaPoints: contents.map((content) => ({
      id: content.id,
      label: content.title.slice(0, 5),
      primary: content.views,
      secondary: content.conversions,
    })),
    chartItems: contents.map((content) => ({
      id: content.id,
      label: content.title,
      primaryText: `조회 수 ${formatCount(content.views)}, 전환율 ${formatRate(content.conversions, content.clicks)}`,
      primaryValue: content.views,
      sortValue: content.conversions,
    })),
    kpis: [
      {
        label: "콘텐츠 수",
        value: contents.length === 0 ? "-" : `${contents.length}개`,
        icon: <PlaySquare size={19} />,
      },
      { label: "총 조회 수", value: formattedTotal(contents.length, totalViews), icon: <MousePointer2 size={19} /> },
      {
        label: "총 반응",
        value: formattedTotal(contents.length, totalReactions),
        icon: <ChartNoAxesCombined size={19} />,
      },
      {
        label: "구매 전환 수",
        value: formattedTotal(contents.length, totalConversions),
        icon: <ShoppingBag size={19} />,
      },
    ],
  };
}

function buildCampaignBundles(
  campaigns: readonly CampaignPerformance[],
  products: typeof PRODUCT_INFLUENCE,
): CampaignBundlePerformance[] {
  return campaigns.map((campaign) => {
    const campaignProducts = products.filter((product) => product.campaignId === campaign.id);
    return {
      ...campaign,
      contentCount: campaignProducts.reduce((total, product) => total + product.contentCount, 0),
      productBundle: campaignProducts.map((product) => product.name).join(" · "),
      productCount: campaignProducts.length,
    };
  });
}

interface CampaignProductMetric {
  contentCount: number;
  engagementRate: string;
  id: string;
  likes: number;
  name: string;
  purchases: number;
  revenue: string;
  thumbnail: string;
  totalViews: number;
  clicks: number;
}

const CAMPAIGN_PRODUCT_COLLECTIONS: Record<string, readonly CampaignProductMetric[]> = {
  "cp-001": [
    { id: "cp-001-p1", name: "에어핏 라운딩 패딩 팬츠", thumbnail: "creator-media/kr-cr-001-01.jpg", revenue: "1,840만원", purchases: 214, clicks: 8_420, contentCount: 2, totalViews: 75_000, likes: 5_110, engagementRate: "6.9%" },
    { id: "cp-001-p2", name: "라이트 웨더 베스트", thumbnail: "creator-media/kr-cr-002-02.jpg", revenue: "1,120만원", purchases: 156, clicks: 5_640, contentCount: 1, totalViews: 41_300, likes: 2_780, engagementRate: "6.8%" },
    { id: "cp-001-p3", name: "클래식 골프 캡", thumbnail: "creator-media/kr-cr-001-03.jpg", revenue: "680만원", purchases: 94, clicks: 3_120, contentCount: 1, totalViews: 28_600, likes: 1_220, engagementRate: "4.3%" },
  ],
  "cp-002": [
    { id: "cp-002-p1", name: "리조트 린넨 셋업", thumbnail: "creator-media/kr-cr-004-01.jpg", revenue: "4,260만원", purchases: 518, clicks: 14_920, contentCount: 3, totalViews: 119_400, likes: 9_860, engagementRate: "8.8%" },
    { id: "cp-002-p2", name: "썸머 드레이프 원피스", thumbnail: "creator-media/kr-cr-001-02.jpg", revenue: "2,410만원", purchases: 289, clicks: 7_280, contentCount: 2, totalViews: 62_500, likes: 4_730, engagementRate: "7.6%" },
    { id: "cp-002-p3", name: "라피아 미니 토트백", thumbnail: "creator-media/kr-cr-004-03.jpg", revenue: "1,370만원", purchases: 168, clicks: 3_880, contentCount: 1, totalViews: 34_700, likes: 2_310, engagementRate: "6.7%" },
  ],
  "cp-003": [
    { id: "cp-003-p1", name: "썸머 에센셜 가디건", thumbnail: "creator-media/kr-cr-003-01.jpg", revenue: "520만원", purchases: 54, clicks: 3_120, contentCount: 1, totalViews: 17_900, likes: 912, engagementRate: "5.5%" },
    { id: "cp-003-p2", name: "코튼 립 슬리브리스", thumbnail: "creator-media/kr-cr-003-02.jpg", revenue: "370만원", purchases: 41, clicks: 2_010, contentCount: 1, totalViews: 12_480, likes: 610, engagementRate: "4.9%" },
    { id: "cp-003-p3", name: "데일리 스트레이트 데님", thumbnail: "creator-media/kr-cr-003-03.jpg", revenue: "290만원", purchases: 33, clicks: 1_480, contentCount: 1, totalViews: 9_260, likes: 438, engagementRate: "4.7%" },
  ],
};

function CampaignProductList({ campaigns }: { campaigns: readonly CampaignBundlePerformance[] }) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(() => new Set());

  return (
    <section aria-label="캠페인 상품 목록" className="fuma-campaign-product-list">
      <div className="fuma-performance-section-heading">
        <div><p>CAMPAIGN COLLECTION</p><h2>캠페인별 상품 성과</h2></div>
        <span>총 {campaigns.length}개 캠페인</span>
      </div>
      <div className="fuma-campaign-product-list__items">
        {campaigns.map((campaign) => {
          const products = CAMPAIGN_PRODUCT_COLLECTIONS[campaign.id] ?? [];
          const expanded = expandedCampaigns.has(campaign.id);
          const visibleProducts = expanded ? products : products.slice(0, 2);
          const hiddenCount = Math.max(0, products.length - visibleProducts.length);
          return (
            <article className="fuma-campaign-product-group" key={campaign.id}>
              <header>
                <div>
                  <span>{campaign.id.toUpperCase()} · {campaign.status}</span>
                  <h3>{campaign.name}</h3>
                  <p>상품 {products.length}개 · 연결 콘텐츠 {campaign.contentCount}개 · 구매 전환 {formatCount(campaign.conversions)}건</p>
                </div>
                <dl>
                  <div><dt>총 클릭</dt><dd>{formatCount(campaign.clicks)}</dd></div>
                  <div><dt>전환율</dt><dd>{formatRate(campaign.conversions, campaign.clicks)}</dd></div>
                </dl>
              </header>
              <div className="fuma-campaign-product-group__products">
                {visibleProducts.map((product) => (
                  <article className="fuma-campaign-product" key={product.id}>
                    <img alt="" src={`${import.meta.env.BASE_URL}${product.thumbnail}`} />
                    <div className="fuma-campaign-product__body">
                      <div className="fuma-campaign-product__title"><h4>{product.name}</h4><span>상품 성과</span></div>
                      <dl>
                        <div><dt>매출</dt><dd>{product.revenue}</dd></div>
                        <div><dt>구매 수</dt><dd>{formatCount(product.purchases)}</dd></div>
                        <div><dt>클릭 수</dt><dd>{formatCount(product.clicks)}</dd></div>
                        <div><dt>콘텐츠 수</dt><dd>{product.contentCount}개</dd></div>
                        <div><dt>콘텐츠 총 조회수</dt><dd>{formatCount(product.totalViews)}</dd></div>
                        <div><dt>좋아요</dt><dd>{formatCount(product.likes)}</dd></div>
                        <div><dt>ER</dt><dd>{product.engagementRate}</dd></div>
                      </dl>
                    </div>
                  </article>
                ))}
              </div>
              {hiddenCount > 0 ? (
                <button
                  className="fuma-campaign-product-group__more"
                  onClick={() => setExpandedCampaigns((current) => new Set(current).add(campaign.id))}
                  type="button"
                >
                  상품 {hiddenCount}개 더보기 <ArrowUpRight aria-hidden="true" size={14} />
                </button>
              ) : expanded ? (
                <button
                  className="fuma-campaign-product-group__more is-open"
                  onClick={() => setExpandedCampaigns((current) => {
                    const next = new Set(current);
                    next.delete(campaign.id);
                    return next;
                  })}
                  type="button"
                >
                  상품 접기
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PerformanceDashboardPage() {
  const {
    appliedFilters,
    applyFilters,
    draftFilters,
    resetFilters,
    updateDraftFilter,
  } = usePerformanceFilterState(DASHBOARD_INITIAL_FILTERS);
  const filteredData = dashboardDataForFilters(appliedFilters);
  const visualData = buildDashboardVisualData(
    filteredData.campaigns,
    filteredData.selectors,
    filteredData.trendPoints,
  );
  const filterKey = JSON.stringify(appliedFilters);
  const totalConversions = filteredData.campaigns.reduce(
    (total, campaign) => total + campaign.conversions,
    0,
  );
  const totalContentViews = filteredData.contentCards.reduce(
    (total, card) => total + card.views,
    0,
  );

  return (
    <section className="fuma-page fuma-performance-page">
      <PageHeader screenCode="PF101" title="관리자 성과 대시보드" />
      <div className="fuma-page__body">
        <PerformanceFilters
          onChange={updateDraftFilter}
          onReset={resetFilters}
          onSearch={applyFilters}
          values={draftFilters}
        />
        <div className="fuma-performance-command-layout">
          <div className="fuma-performance-command-layout__main">
            <PerformanceKpiGrid
              ariaLabel="성과 요약"
              className="fuma-performance-kpi-grid--dashboard"
              items={visualData.kpis}
            />
            <PerformanceTrendChart
              points={visualData.trendPoints}
              title="선택 기간 성과 추이"
            />
            <PerformanceBarChart
              items={visualData.campaignItems}
              mode="single"
              primaryLabel="전환율"
              title="캠페인 전환 성과"
            />
          </div>
          <aside className="fuma-performance-command-layout__rail">
            <PerformancePeriodSummary
              change={filteredData.campaigns.length > 0 ? "+12.4%" : "-"}
              label="구매 전환"
              points={filteredData.trendPoints.map((point) => point.conversions)}
              value={filteredData.campaigns.length > 0 ? formatCount(totalConversions) : "-"}
            />
            <PerformanceRanking
              items={visualData.selectorItems}
              title="셀렉터스 성과 순위"
            />
            <PerformanceLiftCards
              items={[
                { label: "콘텐츠 조회 증가", value: filteredData.contentCards.length > 0 ? formatCount(totalContentViews) : "-" },
                { label: "구매 전환 증가", value: filteredData.campaigns.length > 0 ? formatCount(totalConversions) : "-" },
                { label: "참여 셀렉터스", value: filteredData.selectors.length > 0 ? `${filteredData.selectors.length}명` : "-" },
              ]}
            />
          </aside>
        </div>
        <PerformanceResultTable
          key={`campaign-${filterKey}`}
          className="fuma-performance-campaign-table"
          columns={CAMPAIGN_COLUMNS}
          rowKey={(campaign) => campaign.id}
          rows={filteredData.campaigns}
          title="캠페인별 성과"
        />
        <CampaignContentGallery
          key={`gallery-${filterKey}`}
          campaigns={filteredData.campaigns}
          contentCards={filteredData.contentCards}
        />
        <PerformanceResultTable
          key={`selector-${filterKey}`}
          className="fuma-performance-selector-table"
          columns={SELECTOR_COLUMNS}
          rowKey={(selector) => selector.id}
          rows={filteredData.selectors}
          title="셀렉터스별 성과"
        />
      </div>
    </section>
  );
}

export function SelectorPerformancePage() {
  const {
    appliedFilters,
    applyFilters,
    draftFilters,
    resetFilters,
    updateDraftFilter,
  } = usePerformanceFilterState();
  const selectors = selectorPerformanceForFilters(appliedFilters);

  return (
    <section className="fuma-page fuma-performance-page">
      <PageHeader screenCode="PF201" title="셀렉터스 성과" />
      <div className="fuma-page__body">
        <PerformanceFilters
          keyword={{
            id: "performance-selector-name",
            label: "셀렉터스명",
            placeholder: "이름 또는 ID 검색",
          }}
          onChange={updateDraftFilter}
          onReset={resetFilters}
          onSearch={applyFilters}
          values={draftFilters}
        />
        <SelectorPerformanceReport
          key={JSON.stringify(appliedFilters)}
          selectors={selectors}
        />
      </div>
    </section>
  );
}

function includesKeyword(values: readonly string[], keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return !normalizedKeyword || values.some((value) => (
    value.toLowerCase().includes(normalizedKeyword)
  ));
}

function isWithinPeriod(date: string, periodStart: string, periodEnd: string) {
  return (!periodStart || date >= periodStart) && (!periodEnd || date <= periodEnd);
}

function sumContentValues(
  contents: readonly ContentInfluence[],
  metric: "clicks" | "conversions",
) {
  return contents.reduce((total, content) => total + content[metric], 0);
}

function scaledMetric(value: number, ratio: number) {
  return ratio === 1 ? value : Math.round(value * ratio);
}

function dashboardDataForFilters(filters: PerformanceFilterValues) {
  const cohortSelectors = SELECTOR_PERFORMANCE.filter((selector) => (
    !filters.cohort || selector.cohort === filters.cohort
  ));
  const cohortSelectorIds = new Set(cohortSelectors.map((selector) => selector.id));
  const scopedContents = CONTENT_INFLUENCE.filter((content) => (
    cohortSelectorIds.has(content.selectorId)
    && (!filters.campaign || content.campaignId === filters.campaign)
  ));
  const scopedCampaigns = CAMPAIGN_PERFORMANCE
    .filter((campaign) => (
      (!filters.campaign || campaign.id === filters.campaign)
      && scopedContents.some((content) => content.campaignId === campaign.id)
    ))
    .map((campaign) => {
      const campaignContents = scopedContents.filter((content) => (
        content.campaignId === campaign.id
      ));

      return {
        ...campaign,
        clicks: sumContentValues(campaignContents, "clicks"),
        conversions: sumContentValues(campaignContents, "conversions"),
      };
    });
  const scopedSelectorIds = new Set(scopedContents.map((content) => content.selectorId));
  const scopedSelectors = cohortSelectors
    .filter((selector) => !filters.campaign || scopedSelectorIds.has(selector.id))
    .map((selector) => {
      const selectorContents = scopedContents.filter((content) => (
        content.selectorId === selector.id
      ));

      return {
        ...selector,
        clicks: sumContentValues(selectorContents, "clicks"),
        conversions: sumContentValues(selectorContents, "conversions"),
      };
    });
  const hasPeriodFilter = Boolean(filters.periodStart || filters.periodEnd);
  const periodTrend = PERFORMANCE_TREND.filter((point) => (
    isWithinPeriod(point.date, filters.periodStart, filters.periodEnd)
  ));

  if (hasPeriodFilter && periodTrend.length === 0) {
    return {
      campaigns: [] as CampaignPerformance[],
      contentCards: [] as CampaignContentCardData[],
      scopedContents: [] as ContentInfluence[],
      selectors: [] as SelectorPerformance[],
      trendPoints: [] as PerformanceTrendPoint[],
    };
  }

  const allTrendClicks = PERFORMANCE_TREND.reduce((total, point) => total + point.clicks, 0);
  const allTrendConversions = PERFORMANCE_TREND.reduce(
    (total, point) => total + point.conversions,
    0,
  );
  const periodClickRatio = hasPeriodFilter && allTrendClicks > 0
    ? periodTrend.reduce((total, point) => total + point.clicks, 0) / allTrendClicks
    : 1;
  const periodConversionRatio = hasPeriodFilter && allTrendConversions > 0
    ? periodTrend.reduce((total, point) => total + point.conversions, 0) / allTrendConversions
    : 1;
  const allCampaignClicks = CAMPAIGN_PERFORMANCE.reduce(
    (total, campaign) => total + campaign.clicks,
    0,
  );
  const allCampaignConversions = CAMPAIGN_PERFORMANCE.reduce(
    (total, campaign) => total + campaign.conversions,
    0,
  );
  const scopedClicks = scopedCampaigns.reduce((total, campaign) => total + campaign.clicks, 0);
  const scopedConversions = scopedCampaigns.reduce(
    (total, campaign) => total + campaign.conversions,
    0,
  );
  const scopeClickRatio = allCampaignClicks > 0 ? scopedClicks / allCampaignClicks : 0;
  const scopeConversionRatio = allCampaignConversions > 0
    ? scopedConversions / allCampaignConversions
    : 0;
  const selectorNames = new Set(cohortSelectors.map((selector) => selector.name));
  const contentCards = CAMPAIGN_CONTENT_CARDS.filter((card) => {
    const publishedAt = card.publishedAt.replaceAll(".", "-");

    return (!filters.campaign || card.campaignId === filters.campaign)
      && (!filters.cohort || selectorNames.has(card.creator))
      && isWithinPeriod(publishedAt, filters.periodStart, filters.periodEnd);
  });

  return {
    campaigns: scopedCampaigns.map((campaign) => ({
      ...campaign,
      clicks: scaledMetric(campaign.clicks, periodClickRatio),
      conversions: scaledMetric(campaign.conversions, periodConversionRatio),
    })),
    contentCards,
    scopedContents: [...scopedContents],
    selectors: scopedSelectors.map((selector) => ({
      ...selector,
      clicks: scaledMetric(selector.clicks, periodClickRatio),
      conversions: scaledMetric(selector.conversions, periodConversionRatio),
    })),
    trendPoints: periodTrend.map((point) => ({
      ...point,
      clicks: scaledMetric(point.clicks, scopeClickRatio),
      conversions: scaledMetric(point.conversions, scopeConversionRatio),
    })),
  };
}

function selectorPerformanceForFilters(filters: PerformanceFilterValues) {
  const selectors = SELECTOR_PERFORMANCE.filter((selector) => (
    (!filters.cohort || selector.cohort === filters.cohort)
    && includesKeyword([selector.id, selector.name], filters.keyword)
  ));
  const hasAttributionFilter = Boolean(
    filters.campaign || filters.periodStart || filters.periodEnd,
  );

  if (!hasAttributionFilter) {
    return [...selectors];
  }

  const selectorIds = new Set(selectors.map((selector) => selector.id));
  const contents = CONTENT_INFLUENCE.filter((content) => (
    selectorIds.has(content.selectorId)
    && (!filters.campaign || content.campaignId === filters.campaign)
    && isWithinPeriod(content.publishedAt, filters.periodStart, filters.periodEnd)
  ));
  const matchedSelectorIds = new Set(contents.map((content) => content.selectorId));

  return selectors
    .filter((selector) => matchedSelectorIds.has(selector.id))
    .map((selector) => {
      const selectorContents = contents.filter((content) => content.selectorId === selector.id);

      return {
        ...selector,
        clicks: sumContentValues(selectorContents, "clicks"),
        conversions: sumContentValues(selectorContents, "conversions"),
      };
    });
}

function contentPerformanceForFilters(filters: PerformanceFilterValues) {
  return CONTENT_INFLUENCE.filter((content) => (
    (!filters.campaign || content.campaignId === filters.campaign)
    && (!filters.cohort || selectorCohortById(content.selectorId) === filters.cohort)
    && isWithinPeriod(content.publishedAt, filters.periodStart, filters.periodEnd)
    && includesKeyword(
      [content.id, content.title, creatorNameById(content.creatorId)],
      filters.keyword,
    )
  ));
}

export function ContentPerformancePage() {
  const [page, setPage] = useState(1);
  const {
    appliedFilters,
    applyFilters,
    draftFilters,
    resetFilters,
    updateDraftFilter,
  } = usePerformanceFilterState();
  const contents = contentPerformanceForFilters(appliedFilters);

  const applyAndResetPage = () => {
    applyFilters();
    setPage(1);
  };

  const resetAndResetPage = () => {
    resetFilters();
    setPage(1);
  };

  return (
    <section className="fuma-page fuma-performance-page">
      <PageHeader screenCode="PF202" title="콘텐츠 성과" />
      <div className="fuma-page__body">
        <PerformanceFilters
          keyword={{
            id: "performance-content-keyword",
            label: "콘텐츠/작성자",
            placeholder: "콘텐츠 ID, 제목 또는 작성자 검색",
          }}
          onChange={updateDraftFilter}
          onReset={resetAndResetPage}
          onSearch={applyAndResetPage}
          values={draftFilters}
        />
        <ContentPerformanceReport
          contents={contents}
          onPageChange={setPage}
          page={page}
        />
      </div>
    </section>
  );
}

export function ProductPerformancePage() {
  const campaigns = buildCampaignBundles(CAMPAIGN_PERFORMANCE, PRODUCT_INFLUENCE);
  const {
    appliedFilters,
    applyFilters,
    draftFilters,
    resetFilters,
    updateDraftFilter,
  } = usePerformanceFilterState();
  const filteredCampaigns = campaigns.flatMap((campaign) => {
    const campaignContents = CONTENT_INFLUENCE.filter((content) => (
      content.campaignId === campaign.id
    ));
    const scopedContents = campaignContents.filter((content) => (
      (!appliedFilters.cohort
        || selectorCohortById(content.selectorId) === appliedFilters.cohort)
      && isWithinPeriod(
        content.publishedAt,
        appliedFilters.periodStart,
        appliedFilters.periodEnd,
      )
    ));
    const matchesIdentity = (!appliedFilters.campaign
      || campaign.id === appliedFilters.campaign)
      && includesKeyword(
        [campaign.id, campaign.name, campaign.productBundle],
        appliedFilters.keyword,
      );
    const hasAttributionFilter = Boolean(
      appliedFilters.cohort || appliedFilters.periodStart || appliedFilters.periodEnd,
    );

    if (!matchesIdentity || (hasAttributionFilter && scopedContents.length === 0)) {
      return [];
    }

    return [{
      ...campaign,
      clicks: hasAttributionFilter
        ? sumContentValues(scopedContents, "clicks")
        : campaign.clicks,
      contentCount: hasAttributionFilter ? scopedContents.length : campaign.contentCount,
      conversions: hasAttributionFilter
        ? sumContentValues(scopedContents, "conversions")
        : campaign.conversions,
    }];
  });

  return (
    <section className="fuma-page fuma-performance-page">
      <PageHeader screenCode="PF203" title="캠페인 성과" />
      <div className="fuma-page__body">
        <PerformanceFilters
          keyword={{
            id: "performance-campaign-keyword",
            label: "캠페인/상품",
            placeholder: "캠페인 또는 상품 검색",
          }}
          onChange={updateDraftFilter}
          onReset={resetFilters}
          onSearch={applyFilters}
          values={draftFilters}
        />
        <CampaignProductList campaigns={filteredCampaigns} />
      </div>
    </section>
  );
}
