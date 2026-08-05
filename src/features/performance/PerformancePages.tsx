import type { ReactNode } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
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
  CREATOR_INFLUENCE,
  PERFORMANCE_TREND,
  SELECTOR_PERFORMANCE,
  campaignNameById,
  creatorNameById,
  formatCount,
  formatRate,
  selectorCohortById,
  type CampaignPerformance,
  type CampaignPerformanceStatus,
  type ContentInfluence,
  type CreatorInfluence,
  type PerformanceTrendPoint,
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

function campaignStatusTone(
  status: CampaignPerformanceStatus,
): NonNullable<StatusPillProps["tone"]> {
  if (status === "시작 전") {
    return "pending";
  }
  if (status === "진행 중") {
    return "approved";
  }
  return "neutral";
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

const CAMPAIGN_COLUMNS: DenseTableColumn<CampaignPerformance>[] = [
  { key: "id", header: "캠페인 ID", width: 92 },
  { key: "name", header: "캠페인명", width: 250 },
  {
    key: "status",
    header: "상태",
    width: 88,
    align: "center",
    render: (campaign) => (
      <StatusPill tone={campaignStatusTone(campaign.status)}>
        {campaign.status}
      </StatusPill>
    ),
  },
  {
    key: "clicks",
    header: "클릭 수",
    width: 110,
    align: "right",
    render: (campaign) => formatCount(campaign.clicks),
  },
  {
    key: "conversions",
    header: "구매 전환 수",
    width: 120,
    align: "right",
    render: (campaign) => formatCount(campaign.conversions),
  },
  {
    id: "conversionRate",
    header: "전환율",
    width: 90,
    align: "right",
    render: (campaign) => formatRate(campaign.conversions, campaign.clicks),
  },
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
      { label: "총 클릭 수", value: formattedTotal(campaigns.length, totalClicks) },
      {
        label: "구매 전환 수",
        value: formattedTotal(campaigns.length, totalConversions),
      },
      { label: "전환율", value: conversionRate },
      {
        label: "집계 셀렉터스",
        value: selectors.length === 0 ? "-" : `${selectors.length}명`,
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
      { label: "총 조회 수", value: formattedTotal(creators.length, totalViews) },
      { label: "총 좋아요", value: formattedTotal(creators.length, totalLikes) },
      { label: "총 댓글", value: formattedTotal(creators.length, totalComments) },
      {
        label: "구매 전환 수",
        value: formattedTotal(creators.length, totalConversions),
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
      },
      { label: "총 조회 수", value: formattedTotal(contents.length, totalViews) },
      {
        label: "총 반응",
        value: formattedTotal(contents.length, totalReactions),
      },
      {
        label: "구매 전환 수",
        value: formattedTotal(contents.length, totalConversions),
      },
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
        <PerformanceKpiGrid
          ariaLabel="성과 요약"
          items={visualData.kpis}
        />
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
          className="fuma-performance-campaign-table"
          columns={CAMPAIGN_COLUMNS}
          rowKey={(campaign) => campaign.id}
          rows={[...CAMPAIGN_PERFORMANCE]}
          title="캠페인별 성과"
        />
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
        <PerformanceFilters
          keyword={{
            id: "performance-creator-name",
            label: "크리에이터명",
            placeholder: "이름 검색",
          }}
        />
        <PerformanceKpiGrid
          ariaLabel="크리에이터 성과 요약"
          items={visualData.kpis}
        />
        <div className="fuma-performance-visuals fuma-performance-visuals--single">
          <PerformanceBarChart
            items={visualData.chartItems}
            mode="bar-dot"
            primaryLabel="조회 수"
            secondaryLabel="구매 전환"
            title="크리에이터 영향력 비교"
          />
        </div>
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
        <PerformanceFilters
          keyword={{
            id: "performance-content-keyword",
            label: "콘텐츠/작성자",
            placeholder: "콘텐츠 ID 또는 작성자",
          }}
        />
        <PerformanceKpiGrid
          ariaLabel="콘텐츠 성과 요약"
          items={visualData.kpis}
        />
        <div className="fuma-performance-visuals fuma-performance-visuals--single">
          <PerformanceBarChart
            items={visualData.chartItems}
            mode="single"
            primaryLabel="조회 수"
            title="콘텐츠 성과 순위"
          />
        </div>
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
