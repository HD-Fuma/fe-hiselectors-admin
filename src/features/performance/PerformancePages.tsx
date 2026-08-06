import { useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  MousePointer2,
  PlaySquare,
  ShoppingBag,
  TrendingUp,
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
  const safePoints = points.map((point) => Math.max(0, Number.isFinite(point) ? point : 0));
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

function PerformanceAnalysisHero({
  focusDetail,
  focusLabel,
  focusValue,
  kpis,
  points,
  primaryLabel,
  periodSummaryLabel,
  secondaryLabel,
  summaryLabel,
  title,
}: {
  focusDetail: string;
  focusLabel: string;
  focusValue: string;
  kpis: Parameters<typeof PerformanceKpiGrid>[0]["items"];
  points: Parameters<typeof PerformanceAreaChart>[0]["points"];
  primaryLabel: string;
  periodSummaryLabel: string;
  secondaryLabel: string;
  summaryLabel: string;
  title: string;
}) {
  return (
    <div className="fuma-performance-analysis-hero">
      <div className="fuma-performance-analysis-hero__main">
        <PerformanceKpiGrid
          ariaLabel={summaryLabel}
          className="fuma-performance-kpi-grid--analysis"
          items={kpis}
        />
        <PerformanceAreaChart
          description="상위 성과 항목 기준 비교"
          points={points}
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
          title={title}
        />
      </div>
      <aside className="fuma-performance-analysis-hero__rail">
        <section className="fuma-performance-analysis-focus">
          <span>TOP PERFORMANCE</span>
          <div aria-hidden="true" className="fuma-performance-analysis-focus__ring"><b>1</b></div>
          <div aria-hidden="true" className="fuma-performance-analysis-focus__bars">
            {[38, 52, 46, 72, 61, 86, 68, 92].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
          </div>
          <strong>{focusValue}</strong>
          <p>{focusLabel}</p>
          <small>{focusDetail}</small>
        </section>
        <PerformancePeriodSummary
          change="+12.4%"
          label={periodSummaryLabel}
          points={[46, 58, 51, 68, 73]}
          value="1,399"
        />
      </aside>
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

const CONTENT_MEDIA: Record<string, { creatorImage: string; thumbnail: string }> = {
  "ct-001": { thumbnail: "creator-media/kr-cr-001-01.jpg", creatorImage: "creator-media/kr-cr-001-profile.jpg" },
  "ct-002": { thumbnail: "creator-media/kr-cr-002-02.jpg", creatorImage: "creator-media/kr-cr-002-profile.jpg" },
  "ct-003": { thumbnail: "creator-media/kr-cr-001-02.jpg", creatorImage: "creator-media/kr-cr-001-profile.jpg" },
  "ct-004": { thumbnail: "creator-media/kr-cr-003-01.jpg", creatorImage: "creator-media/kr-cr-003-profile.jpg" },
  "ct-005": { thumbnail: "creator-media/kr-cr-004-01.jpg", creatorImage: "creator-media/kr-cr-004-profile.jpg" },
};

const CREATOR_REPORT_MEDIA: Record<string, string> = {
  "cr-001": "creator-media/kr-cr-001-profile.jpg",
  "cr-002": "creator-media/kr-cr-002-profile.jpg",
  "cr-003": "creator-media/kr-cr-003-profile.jpg",
  "cr-004": "creator-media/kr-cr-004-profile.jpg",
};

function CreatorPerformanceReport({
  creators,
  points,
}: {
  creators: readonly CreatorInfluence[];
  points: Parameters<typeof PerformanceAreaChart>[0]["points"];
}) {
  const totalConversions = creators.reduce((total, creator) => total + creator.conversions, 0);
  const totalViews = creators.reduce((total, creator) => total + creator.views, 0);
  const topCreator = [...creators].sort((left, right) => right.conversions - left.conversions)[0];

  return (
    <section aria-label="크리에이터 성과 리포트" className="fuma-creator-performance-report">
      <header className="fuma-creator-performance-report__header">
        <div>
          <p>CREATOR ANALYSIS REPORT</p>
          <h2>크리에이터 분석 리포트</h2>
          <span>2026.08.01 — 2026.08.03 · 콘텐츠 반응과 구매 전환을 기준으로 집계</span>
        </div>
        <dl>
          <div><dt>분석 크리에이터</dt><dd>{creators.length}명</dd></div>
          <div><dt>총 조회수</dt><dd>{formatCount(totalViews)}</dd></div>
          <div><dt>구매 전환</dt><dd>{formatCount(totalConversions)}</dd></div>
        </dl>
      </header>
      <section className="fuma-creator-performance-report__summary">
        <div>
          <p>핵심 요약</p>
          <h3>{topCreator ? `${topCreator.name} 크리에이터가 전체 전환을 주도했습니다.` : "집계된 크리에이터 성과가 없습니다."}</h3>
          <span>{topCreator ? `${topCreator.campaign} 캠페인에서 ${formatCount(topCreator.conversions)}건의 구매 전환을 기록했습니다.` : ""}</span>
        </div>
        <dl>
          <div><dt>전환 1위</dt><dd>{topCreator?.name ?? "-"}</dd></div>
          <div><dt>상위 2인 전환 비중</dt><dd>{totalConversions === 0 ? "-" : `${(([...creators].sort((left, right) => right.conversions - left.conversions).slice(0, 2).reduce((total, creator) => total + creator.conversions, 0) / totalConversions) * 100).toFixed(1)}%`}</dd></div>
          <div><dt>평균 ER</dt><dd>{creators.length === 0 ? "-" : `${(creators.reduce((total, creator) => total + ((creator.likes + creator.comments) / creator.views) * 100, 0) / creators.length).toFixed(2)}%`}</dd></div>
        </dl>
      </section>
      <div className="fuma-creator-performance-report__list">
        {creators.map((creator, index) => {
          const engagementRate = formatRate(creator.likes + creator.comments, creator.views);
          const contribution = totalConversions === 0 ? 0 : (creator.conversions / totalConversions) * 100;
          return (
            <article className="fuma-creator-performance-report__entry" key={creator.id}>
              <span className="fuma-creator-performance-report__rank">{String(index + 1).padStart(2, "0")}</span>
              <img alt="" src={`${import.meta.env.BASE_URL}${CREATOR_REPORT_MEDIA[creator.id]}`} />
              <div className="fuma-creator-performance-report__identity">
                <h3>{creator.name}</h3>
                <p>{creator.platform} · {creator.cohort}</p>
                <span>{creator.campaign}</span>
              </div>
              <dl className="fuma-creator-performance-report__metrics">
                <div><dt>조회수</dt><dd>{formatCount(creator.views)}</dd></div>
                <div><dt>좋아요</dt><dd>{formatCount(creator.likes)}</dd></div>
                <div><dt>구매 전환</dt><dd>{formatCount(creator.conversions)}</dd></div>
                <div><dt>ER</dt><dd>{engagementRate}</dd></div>
              </dl>
              <div className="fuma-creator-performance-report__contribution">
                <span>전환 기여도 <b>{contribution.toFixed(1)}%</b></span>
                <i aria-hidden="true"><em style={{ width: `${contribution}%` }} /></i>
              </div>
            </article>
          );
        })}
      </div>
      <section className="fuma-creator-performance-report__evidence">
        <div className="fuma-creator-performance-report__note">
          <p>REPORT NOTE</p>
          <h3>콘텐츠 반응보다 전환 성과를 함께 확인하세요.</h3>
          <ul>
            <li>조회수는 도달 규모, 구매 전환은 실제 캠페인 기여를 의미합니다.</li>
            <li>ER은 좋아요와 댓글을 조회수 대비 비율로 계산했습니다.</li>
            <li>크리에이터별 캠페인·플랫폼 차이를 함께 고려해 비교하세요.</li>
          </ul>
        </div>
        <PerformanceAreaChart
          description="크리에이터별 비교"
          points={points}
          primaryLabel="조회 수"
          secondaryLabel="구매 전환"
          title="성과 근거"
        />
      </section>
    </section>
  );
}

function ContentPerformanceShowcase({ contents }: { contents: readonly ContentInfluence[] }) {
  return (
    <section aria-label="주요 콘텐츠 성과" className="fuma-content-performance-showcase">
      <div className="fuma-performance-section-heading">
        <div><p>TOP CONTENT</p><h2>주요 콘텐츠 성과</h2></div>
        <span>조회 및 전환 기준</span>
      </div>
      <div className="fuma-content-performance-showcase__grid">
        {contents.map((content) => {
          const media = CONTENT_MEDIA[content.id];
          return (
            <article className="fuma-content-performance-showcase__card" key={content.id}>
              <div className="fuma-content-performance-showcase__image">
                <img alt="" src={`${import.meta.env.BASE_URL}${media.thumbnail}`} />
                <span>{content.platform}</span>
              </div>
              <div className="fuma-content-performance-showcase__body">
                <h3>{content.title}</h3>
                <div className="fuma-content-performance-showcase__creator">
                  <img alt="" src={`${import.meta.env.BASE_URL}${media.creatorImage}`} />
                  <span>{creatorNameById(content.creatorId)}</span>
                  <em>{campaignNameById(content.campaignId)}</em>
                </div>
                <dl>
                  <div><dt>조회수</dt><dd>{formatCount(content.views)}</dd></div>
                  <div><dt>구매 전환</dt><dd>{formatCount(content.conversions)}</dd></div>
                  <div><dt>클릭수</dt><dd>{formatCount(content.clicks)}</dd></div>
                  <div><dt>ER</dt><dd>{formatRate(content.likes + content.comments, content.views)}</dd></div>
                </dl>
              </div>
            </article>
          );
        })}
      </div>
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

// eslint-disable-next-line react-refresh/only-export-components
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
              change="+12.4%"
              label="구매 전환"
              points={[410, 463, 526]}
              value="1,399"
            />
            <PerformanceRanking
              items={visualData.selectorItems}
              title="셀렉터스 성과 순위"
            />
            <PerformanceLiftCards
              items={[
                { label: "콘텐츠 조회 증가", value: "309,300" },
                { label: "구매 전환 증가", value: "1,399" },
                { label: "참여 셀렉터스", value: "4명" },
              ]}
            />
          </aside>
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
      <PageHeader screenCode="PF201" title="크리에이터 분석 리포트" />
      <div className="fuma-page__body">
        <PerformanceFilters
          keyword={{
            id: "performance-creator-name",
            label: "크리에이터명",
            placeholder: "이름 검색",
          }}
        />
        <CreatorPerformanceReport creators={CREATOR_INFLUENCE} points={visualData.areaPoints} />
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
        <ContentPerformanceShowcase contents={CONTENT_INFLUENCE} />
        <PerformanceAnalysisHero
          focusDetail="구매 전환 기준 1위"
          focusLabel="바캉스 푸드 스타일링"
          focusValue="711"
          kpis={visualData.kpis}
          points={visualData.areaPoints}
          primaryLabel="조회 수"
          periodSummaryLabel="콘텐츠 구매 전환"
          secondaryLabel="구매 전환"
          summaryLabel="콘텐츠 성과 요약"
          title="콘텐츠 반응 추이"
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
  const campaigns = buildCampaignBundles(CAMPAIGN_PERFORMANCE, PRODUCT_INFLUENCE);

  return (
    <section className="fuma-page fuma-performance-page">
      <PageHeader screenCode="PF203" title="캠페인 단위 성과 분석" />
      <div className="fuma-page__body">
        <CampaignProductList campaigns={campaigns} />
      </div>
    </section>
  );
}
