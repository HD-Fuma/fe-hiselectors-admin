import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  MousePointer2,
  Package,
  PlaySquare,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import "../../styles/performance-dashboard.css";
import {
  PerformanceAreaChart,
  PerformanceBarChart,
  PerformanceKpiGrid,
  PerformanceRanking,
  PerformanceTrendChart,
} from "./PerformanceCharts";
import {
  CAMPAIGN_PERFORMANCE,
  CONTENT_INFLUENCE,
  CREATOR_INFLUENCE,
  PERFORMANCE_TREND,
  PRODUCT_INFLUENCE,
  SELECTOR_PERFORMANCE,
  campaignNameById,
  creatorNameById,
  formatCount,
  formatRate,
  selectorCohortById,
  type CampaignPerformance,
  type ContentInfluence,
  type CreatorInfluence,
  type PerformanceTrendPoint,
  type ProductInfluence,
  type SelectorActivityStatus,
  type SelectorPerformance,
} from "./fixtures";

const COHORT_OPTIONS = [
  { label: "전체", value: "" },
  { label: "3기", value: "3기" },
  { label: "2기", value: "2기" },
];

const CAMPAIGN_OPTIONS = [
  { label: "전체", value: "" },
  { label: "2026 가을 골프웨어 셀렉션", value: "cp-001" },
  { label: "여름 바캉스 스타일링", value: "cp-002" },
  { label: "초여름 패션 리뷰", value: "cp-003" },
];

interface FilterFieldProps {
  children: ReactNode;
  htmlFor: string;
  label: string;
}

function FilterField({ children, htmlFor, label }: FilterFieldProps) {
  return (
    <label className="fuma-filter-field" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}

interface KeywordFilter {
  id: string;
  label: string;
  placeholder: string;
}

function PerformanceFilters({ keyword }: { keyword?: KeywordFilter }) {
  return (
    <div className="fuma-performance-search">
      <SearchPanel
        actions={
          <>
            <Button variant="primary">조회</Button>
            <Button>초기화</Button>
          </>
        }
      >
        {keyword ? (
          <FilterField htmlFor={keyword.id} label={keyword.label}>
            <TextInput
              aria-label={keyword.label}
              id={keyword.id}
              placeholder={keyword.placeholder}
            />
          </FilterField>
        ) : null}
        <FilterField htmlFor="performance-cohort" label="기수">
          <Select
            aria-label="기수"
            defaultValue=""
            id="performance-cohort"
            options={COHORT_OPTIONS}
          />
        </FilterField>
        <FilterField htmlFor="performance-campaign" label="캠페인">
          <Select
            aria-label="캠페인"
            defaultValue=""
            id="performance-campaign"
            options={CAMPAIGN_OPTIONS}
          />
        </FilterField>
        <div className="fuma-performance-period-filter">
          <span>집계 기간</span>
          <div>
            <TextInput
              aria-label="집계 시작일"
              defaultValue="2026-08-01"
              type="date"
            />
            <span aria-hidden="true">~</span>
            <TextInput
              aria-label="집계 종료일"
              defaultValue="2026-08-03"
              type="date"
            />
          </div>
        </div>
      </SearchPanel>
    </div>
  );
}

type PerformanceScope = "overview" | "creators" | "contents" | "products";

const PERFORMANCE_SCOPES: readonly { id: PerformanceScope; label: string; path: string }[] = [
  { id: "overview", label: "종합 현황", path: "/performance" },
  { id: "creators", label: "크리에이터", path: "/performance/creators" },
  { id: "contents", label: "콘텐츠", path: "/performance/contents" },
  { id: "products", label: "상품", path: "/performance/products" },
];

function PerformanceScopeNav({ active }: { active: PerformanceScope }) {
  return (
    <nav aria-label="성과 분석 범위" className="fuma-performance-scope-nav">
      {PERFORMANCE_SCOPES.map((scope) => (
        <Link
          aria-current={scope.id === active ? "page" : undefined}
          className={scope.id === active ? "is-active" : undefined}
          key={scope.id}
          to={scope.path}
        >
          {scope.label}
        </Link>
      ))}
    </nav>
  );
}

function PerformanceWorkspaceIntro({
  active,
  caption,
}: {
  active: PerformanceScope;
  caption: string;
}) {
  return (
    <div className="fuma-performance-workspace-intro">
      <div>
        <p>PERFORMANCE WORKSPACE</p>
        <strong>{caption}</strong>
      </div>
      <PerformanceScopeNav active={active} />
    </div>
  );
}

interface PerformanceEntityCard {
  detail: string;
  id: string;
  label: string;
  meta: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  tone: "creator" | "content" | "product";
}

function PerformanceEntityCardGrid({
  items,
  title,
}: {
  items: readonly PerformanceEntityCard[];
  title: string;
}) {
  return (
    <section aria-label={title} className="fuma-performance-entity-section">
      <div className="fuma-performance-section-heading">
        <div>
          <p>PERFORMANCE LIST</p>
          <h2>{title}</h2>
        </div>
        <span>총 {items.length}건</span>
      </div>
      <div className="fuma-performance-entity-grid">
        {items.map((item) => (
          <article className={`fuma-performance-entity-card is-${item.tone}`} key={item.id}>
            <header>
              <span>{item.meta}</span>
              <ArrowUpRight size={16} />
            </header>
            <div className="fuma-performance-entity-card__identity">
              <div aria-hidden="true">{item.label.slice(0, 1)}</div>
              <div><h3>{item.label}</h3><p>{item.detail}</p></div>
            </div>
            <dl>
              <div><dt>{item.primaryLabel}</dt><dd>{item.primaryValue}</dd></div>
              <div><dt>{item.secondaryLabel}</dt><dd>{item.secondaryValue}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function PerformanceAnalysisHero({
  focusDetail,
  focusLabel,
  focusValue,
  kpis,
  points,
  primaryLabel,
  secondaryLabel,
  title,
}: {
  focusDetail: string;
  focusLabel: string;
  focusValue: string;
  kpis: Parameters<typeof PerformanceKpiGrid>[0]["items"];
  points: Parameters<typeof PerformanceAreaChart>[0]["points"];
  primaryLabel: string;
  secondaryLabel: string;
  title: string;
}) {
  return (
    <div className="fuma-performance-analysis-hero">
      <PerformanceAreaChart
        description="상위 성과 항목 기준 비교"
        points={points}
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        title={title}
      />
      <section className="fuma-performance-analysis-focus">
        <span>TOP PERFORMANCE</span>
        <strong>{focusValue}</strong>
        <p>{focusLabel}</p>
        <small>{focusDetail}</small>
      </section>
      <PerformanceKpiGrid
        ariaLabel={`${title} 보조 지표`}
        className="fuma-performance-kpi-grid--analysis"
        items={kpis}
      />
    </div>
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
  return (
    <section aria-label={title} className="fuma-performance-results">
      <div className="fuma-result-toolbar">
        <strong>{title}</strong>
        <span>총 {rows.length}건</span>
      </div>
      <div className={`fuma-wide-table ${className}`}>
        <DenseTable columns={columns} rowKey={rowKey} rows={rows} />
      </div>
      <Pagination page={1} pageSize={20} totalPages={1} />
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

const CREATOR_COLUMNS: DenseTableColumn<CreatorInfluence>[] = [
  { key: "id", header: "크리에이터 ID", width: 104 },
  { key: "name", header: "크리에이터", width: 96 },
  { key: "cohort", header: "기수", width: 62, align: "center" },
  { key: "platform", header: "주요 플랫폼", width: 145, align: "center" },
  { key: "campaign", header: "캠페인", width: 225 },
  {
    key: "conversions",
    header: "구매 전환 수",
    width: 105,
    align: "right",
    render: (creator) => formatCount(creator.conversions),
  },
  {
    key: "views",
    header: "조회 수",
    width: 95,
    align: "right",
    render: (creator) => formatCount(creator.views),
  },
  {
    key: "likes",
    header: "좋아요",
    width: 90,
    align: "right",
    render: (creator) => formatCount(creator.likes),
  },
  {
    key: "comments",
    header: "댓글",
    width: 80,
    align: "right",
    render: (creator) => formatCount(creator.comments),
  },
];

const CONTENT_COLUMNS: DenseTableColumn<ContentInfluence>[] = [
  { key: "id", header: "콘텐츠 ID", width: 88 },
  { key: "title", header: "콘텐츠 제목", width: 215 },
  {
    id: "author",
    header: "작성자",
    width: 82,
    render: (content) => creatorNameById(content.creatorId),
  },
  {
    id: "cohort",
    header: "기수",
    width: 58,
    align: "center",
    render: (content) => selectorCohortById(content.selectorId),
  },
  {
    id: "campaign",
    header: "캠페인",
    width: 220,
    render: (content) => campaignNameById(content.campaignId),
  },
  { key: "platform", header: "플랫폼", width: 88, align: "center" },
  {
    key: "conversions",
    header: "구매 전환 수",
    width: 105,
    align: "right",
    render: (content) => formatCount(content.conversions),
  },
  {
    key: "views",
    header: "조회 수",
    width: 92,
    align: "right",
    render: (content) => formatCount(content.views),
  },
  {
    key: "likes",
    header: "좋아요",
    width: 86,
    align: "right",
    render: (content) => formatCount(content.likes),
  },
  {
    key: "comments",
    header: "댓글",
    width: 74,
    align: "right",
    render: (content) => formatCount(content.comments),
  },
];

const PRODUCT_COLUMNS: DenseTableColumn<ProductInfluence>[] = [
  { key: "id", header: "상품 ID", width: 88 },
  { key: "name", header: "상품명", width: 235 },
  { key: "category", header: "카테고리", width: 130 },
  {
    id: "campaign",
    header: "캠페인",
    width: 225,
    render: (product) => campaignNameById(product.campaignId),
  },
  { key: "contentCount", header: "콘텐츠 수", width: 92, align: "right", render: (product) => `${product.contentCount}개` },
  { key: "clicks", header: "클릭 수", width: 100, align: "right", render: (product) => formatCount(product.clicks) },
  { key: "conversions", header: "구매 전환 수", width: 112, align: "right", render: (product) => formatCount(product.conversions) },
  { id: "conversionRate", header: "전환율", width: 88, align: "right", render: (product) => formatRate(product.conversions, product.clicks) },
];

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
    areaPoints: creators.map((creator) => ({
      id: creator.id,
      label: creator.name,
      primary: creator.views,
      secondary: creator.conversions,
    })),
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
    areaPoints: contents.map((content) => ({
      id: content.id,
      label: content.title.slice(0, 5),
      primary: content.views,
      secondary: content.conversions,
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
    areaPoints: products.map((product) => ({
      id: product.id,
      label: product.name.slice(0, 5),
      primary: product.clicks,
      secondary: product.conversions,
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

// eslint-disable-next-line react-refresh/only-export-components
export function buildProductVisualData(products: readonly ProductInfluence[]) {
  const totalClicks = products.reduce((total, product) => total + product.clicks, 0);
  const totalConversions = products.reduce((total, product) => total + product.conversions, 0);
  const totalContents = products.reduce((total, product) => total + product.contentCount, 0);

  return {
    chartItems: products.map((product) => ({
      id: product.id,
      label: product.name,
      primaryText: `구매 전환 ${formatCount(product.conversions)}`,
      primaryValue: product.conversions,
      secondaryText: `전환율 ${formatRate(product.conversions, product.clicks)}`,
      secondaryValue: product.clicks === 0 ? 0 : (product.conversions / product.clicks) * 100,
      sortValue: product.conversions,
    })),
    kpis: [
      { label: "분석 상품", value: products.length === 0 ? "-" : `${products.length}개`, icon: <Package size={19} /> },
      { label: "연결 콘텐츠", value: products.length === 0 ? "-" : `${totalContents}개`, icon: <PlaySquare size={19} /> },
      { label: "구매 전환 수", value: formattedTotal(products.length, totalConversions), icon: <ShoppingBag size={19} /> },
      { label: "평균 전환율", value: products.length === 0 ? "-" : formatRate(totalConversions, totalClicks), icon: <ChartNoAxesCombined size={19} /> },
    ],
  };
}

export function PerformanceDashboardPage() {
  const visualData = buildDashboardVisualData(
    CAMPAIGN_PERFORMANCE,
    SELECTOR_PERFORMANCE,
    PERFORMANCE_TREND,
  );

  return (
    <section className="fuma-page fuma-performance-page">
      <PageHeader screenCode="PF101" title="관리자 성과 대시보드" />
      <div className="fuma-page__body">
        <PerformanceFilters />
        <PerformanceKpiGrid ariaLabel="성과 요약" items={visualData.kpis} />
        <div className="fuma-performance-visuals fuma-performance-visuals--overview">
          <div className="fuma-performance-visuals__wide">
            <PerformanceTrendChart
              points={visualData.trendPoints}
              title="선택 기간 성과 추이"
            />
          </div>
          <PerformanceBarChart
            items={visualData.campaignItems}
            mode="single"
            primaryLabel="전환율"
            title="캠페인 전환 성과"
          />
          <PerformanceRanking
            items={visualData.selectorItems}
            title="셀렉터스 성과 순위"
          />
        </div>
        <PerformanceResultTable
          className="fuma-performance-selector-table"
          columns={SELECTOR_COLUMNS}
          rowKey={(selector) => selector.id}
          rows={[...SELECTOR_PERFORMANCE]}
          title="셀렉터스별 성과"
        />
      </div>
    </section>
  );
}

export function CreatorPerformancePage() {
  const visualData = buildCreatorVisualData(CREATOR_INFLUENCE);

  return (
    <section className="fuma-page fuma-performance-page">
      <PageHeader screenCode="PF201" title="크리에이터 영향력 분석" />
      <div className="fuma-page__body">
        <PerformanceWorkspaceIntro active="creators" caption="전환을 만든 크리에이터를 확인하세요." />
        <PerformanceFilters
          keyword={{
            id: "performance-creator-name",
            label: "크리에이터명",
            placeholder: "이름 검색",
          }}
        />
        <PerformanceAnalysisHero
          focusDetail="구매 전환 기준 1위"
          focusLabel="오하늘 · Instagram"
          focusValue="711"
          kpis={visualData.kpis}
          points={visualData.areaPoints}
          primaryLabel="조회 수"
          secondaryLabel="구매 전환"
          title="크리에이터 성과 추이"
        />
        <PerformanceEntityCardGrid
          title="크리에이터별 성과"
          items={CREATOR_INFLUENCE.map((creator) => ({
            id: creator.id,
            label: creator.name,
            detail: creator.campaign,
            meta: creator.platform,
            primaryLabel: "구매 전환",
            primaryValue: formatCount(creator.conversions),
            secondaryLabel: "조회 수",
            secondaryValue: formatCount(creator.views),
            tone: "creator" as const,
          }))}
        />
        <PerformanceResultTable
          className="fuma-performance-creator-table"
          columns={CREATOR_COLUMNS}
          rowKey={(creator) => creator.id}
          rows={[...CREATOR_INFLUENCE]}
          title="크리에이터 영향력"
        />
      </div>
    </section>
  );
}

export function ContentPerformancePage() {
  const visualData = buildContentVisualData(CONTENT_INFLUENCE);

  return (
    <section className="fuma-page fuma-performance-page">
      <PageHeader screenCode="PF202" title="콘텐츠 영향력 분석" />
      <div className="fuma-page__body">
        <PerformanceWorkspaceIntro active="contents" caption="콘텐츠별 반응과 전환을 비교하세요." />
        <PerformanceFilters
          keyword={{
            id: "performance-content-keyword",
            label: "콘텐츠/작성자",
            placeholder: "콘텐츠 ID 또는 작성자",
          }}
        />
        <PerformanceAnalysisHero
          focusDetail="구매 전환 기준 1위"
          focusLabel="바캉스 푸드 스타일링"
          focusValue="711"
          kpis={visualData.kpis}
          points={visualData.areaPoints}
          primaryLabel="조회 수"
          secondaryLabel="구매 전환"
          title="콘텐츠 반응 추이"
        />
        <PerformanceEntityCardGrid
          title="콘텐츠별 성과"
          items={CONTENT_INFLUENCE.map((content) => ({
            id: content.id,
            label: content.title,
            detail: `${creatorNameById(content.creatorId)} · ${campaignNameById(content.campaignId)}`,
            meta: content.platform,
            primaryLabel: "구매 전환",
            primaryValue: formatCount(content.conversions),
            secondaryLabel: "조회 수",
            secondaryValue: formatCount(content.views),
            tone: "content" as const,
          }))}
        />
        <PerformanceResultTable
          className="fuma-performance-content-table"
          columns={CONTENT_COLUMNS}
          rowKey={(content) => content.id}
          rows={[...CONTENT_INFLUENCE]}
          title="콘텐츠 영향력"
        />
      </div>
    </section>
  );
}

export function ProductPerformancePage() {
  const visualData = buildProductVisualData(PRODUCT_INFLUENCE);

  return (
    <section className="fuma-page fuma-performance-page">
      <PageHeader screenCode="PF203" title="상품 성과 분석" />
      <div className="fuma-page__body">
        <PerformanceWorkspaceIntro active="products" caption="상품별 콘텐츠 기여도를 확인하세요." />
        <PerformanceFilters
          keyword={{
            id: "performance-product-keyword",
            label: "상품명",
            placeholder: "상품명 또는 상품 ID 검색",
          }}
        />
        <PerformanceAnalysisHero
          focusDetail="구매 전환 기준 1위"
          focusLabel="리조트 린넨 셋업"
          focusValue="975"
          kpis={visualData.kpis}
          points={visualData.areaPoints}
          primaryLabel="클릭 수"
          secondaryLabel="구매 전환"
          title="상품 전환 추이"
        />
        <PerformanceEntityCardGrid
          title="상품별 성과"
          items={PRODUCT_INFLUENCE.map((product) => ({
            id: product.id,
            label: product.name,
            detail: campaignNameById(product.campaignId),
            meta: product.category,
            primaryLabel: "구매 전환",
            primaryValue: formatCount(product.conversions),
            secondaryLabel: "전환율",
            secondaryValue: formatRate(product.conversions, product.clicks),
            tone: "product" as const,
          }))}
        />
        <PerformanceResultTable
          className="fuma-performance-product-table"
          columns={PRODUCT_COLUMNS}
          rowKey={(product) => product.id}
          rows={[...PRODUCT_INFLUENCE]}
          title="상품별 성과"
        />
      </div>
    </section>
  );
}
