import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { SegmentedControl, Select, TextInput } from "../../components/ui/Controls";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { CreatorProfilePhoto } from "../../components/ui/CreatorProfilePhoto";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { ListSearchPanel } from "../../components/ui/ListSearchPanel";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import {
  getCampaignPerformance,
  getCampaigns,
  type Campaign,
  type CampaignPerformanceDetail,
  type CampaignProductPerformance,
  type CampaignSelectorPerformance,
} from "../../entities/campaign";
import {
  getSelector,
  SelectorDetailPanel,
  type SelectorDetail,
} from "../../entities/selectors";
import { assetUrl } from "../../lib/assetUrl";
import { formatNumber, formatWon } from "../../lib/formatters";
import { paginate } from "../../lib/pagination";
import "../../styles/campaign-performance.css";
import {
  createCampaignPerformancePreview,
  createCampaignPerformancePreviewSelectorDetail,
  isEmptyCampaignPerformance,
} from "./campaignPerformancePreview";

const DETAIL_PAGE_SIZE = 20;
const CAMPAIGN_PERFORMANCE_PREVIEW_ENABLED = import.meta.env.DEV
  && import.meta.env.MODE !== "test"
  && import.meta.env.VITE_CAMPAIGN_PERFORMANCE_PREVIEW === "true";
type BreakdownMode = "products" | "selectors";
type TrendMetric = "confirmedSales" | "confirmedOrderCount" | "soldQuantity";
type TrendMode = "all" | TrendMetric;

const BREAKDOWN_OPTIONS: readonly { label: string; value: BreakdownMode }[] = [
  { label: "상품별", value: "products" },
  { label: "셀렉터스별", value: "selectors" },
];

const TREND_OPTIONS: readonly { label: string; value: TrendMode }[] = [
  { label: "종합", value: "all" },
  { label: "매출", value: "confirmedSales" },
  { label: "주문", value: "confirmedOrderCount" },
  { label: "판매 수량", value: "soldQuantity" },
];

const TREND_SERIES: readonly {
  label: string;
  styleClass: string;
  value: TrendMetric;
}[] = [
  { label: "확정 매출", styleClass: "is-contentCount", value: "confirmedSales" },
  { label: "확정 주문", styleClass: "is-views", value: "confirmedOrderCount" },
  { label: "판매 수량", styleClass: "is-likes", value: "soldQuantity" },
];

function sortCampaigns(campaigns: readonly Campaign[]) {
  const statusOrder: Record<Campaign["status"], number> = {
    ACTIVE: 0,
    ENDED: 1,
    SCHEDULED: 2,
  };

  return [...campaigns].sort((left, right) => (
    statusOrder[left.status] - statusOrder[right.status]
    || right.startDate.localeCompare(left.startDate)
    || right.id - left.id
  ));
}

function currentLocalDate() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function defaultCampaignPeriod(campaign: Campaign) {
  if (campaign.status !== "ACTIVE") {
    return { startDate: campaign.startDate, endDate: campaign.endDate };
  }

  const today = currentLocalDate();
  const endDate = today < campaign.startDate
    ? campaign.startDate
    : today > campaign.endDate
      ? campaign.endDate
      : today;
  return { startDate: campaign.startDate, endDate };
}

function dateLabel(date: string) {
  const [, month, day] = date.split("-");
  return month && day ? `${Number(month)}/${Number(day)}` : date;
}

function compactNumber(value: number) {
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(value % 100_000_000 === 0 ? 0 : 1)}억`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 10_000).toFixed(value % 10_000 === 0 ? 0 : 1)}만`;
  }
  return formatNumber(value);
}

function contribution(value: number, total: number) {
  return total === 0 ? "0.0%" : `${((value / total) * 100).toFixed(1)}%`;
}

function smoothLinePath(points: readonly { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.slice(0, -1).reduce((path, point, index) => {
    const previous = points[index - 1] ?? point;
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;
    const control1X = point.x + (next.x - previous.x) / 6;
    const control1Y = point.y + (next.y - previous.y) / 6;
    const control2X = next.x - (afterNext.x - point.x) / 6;
    const control2Y = next.y - (afterNext.y - point.y) / 6;

    return `${path} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${next.x} ${next.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

function productColumns(totalSales: number): DenseTableColumn<CampaignProductPerformance>[] {
  return [
    {
      header: "상품",
      id: "product",
      width: "34%",
      render: (product) => (
        <div className="fuma-campaign-performance-product">
          {product.thumbnailUrl ? (
            <img alt="" src={assetUrl(product.thumbnailUrl)} />
          ) : <span aria-hidden="true" className="fuma-campaign-performance-product__placeholder" />}
          <span>
            <small>{product.brandName || "브랜드 정보 없음"}</small>
            <strong>{product.productName || product.productCode || `상품 ${product.productId}`}</strong>
          </span>
        </div>
      ),
    },
    {
      align: "right",
      header: "확정 매출",
      key: "confirmedSales",
      render: (product) => <strong>{formatWon(product.confirmedSales)}</strong>,
    },
    {
      align: "right",
      header: "주문 수",
      key: "confirmedOrderCount",
      render: (product) => `${formatNumber(product.confirmedOrderCount)}건`,
    },
    {
      align: "right",
      header: "판매 수량",
      key: "soldQuantity",
      render: (product) => `${formatNumber(product.soldQuantity)}개`,
    },
    {
      align: "right",
      header: "매출 비중",
      id: "contribution",
      render: (product) => contribution(product.confirmedSales, totalSales),
    },
    {
      align: "right",
      header: "매출 발생 셀렉터스",
      key: "contributingSelectorCount",
      render: (product) => `${formatNumber(product.contributingSelectorCount)}명`,
    },
  ];
}

function selectorColumns(totalSales: number): DenseTableColumn<CampaignSelectorPerformance>[] {
  return [
    {
      header: "셀렉터스",
      id: "selector",
      width: "30%",
      render: (selector) => {
        const nickname = selector.nickname || `셀렉터스 ${selector.selectorId}`;
        return (
          <div className="fuma-campaign-performance-selector">
            <span className="fuma-campaign-performance-selector__photo">
              <CreatorProfilePhoto
                creatorName={nickname}
                src={selector.profileImageUrl ?? ""}
              />
            </span>
            <span className="fuma-campaign-performance-selector__identity">
              <strong>{nickname}</strong>
              <small>{selector.selectorCode || `ID ${selector.selectorId}`}</small>
            </span>
          </div>
        );
      },
    },
    {
      align: "right",
      header: "확정 매출",
      key: "confirmedSales",
      render: (selector) => <strong>{formatWon(selector.confirmedSales)}</strong>,
    },
    {
      align: "right",
      header: "주문 수",
      key: "confirmedOrderCount",
      render: (selector) => `${formatNumber(selector.confirmedOrderCount)}건`,
    },
    {
      align: "right",
      header: "판매 수량",
      key: "soldQuantity",
      render: (selector) => `${formatNumber(selector.soldQuantity)}개`,
    },
    {
      align: "right",
      header: "판매 상품",
      key: "productCount",
      render: (selector) => `${formatNumber(selector.productCount)}개`,
    },
    {
      align: "right",
      header: "매출 기여율",
      id: "contribution",
      render: (selector) => contribution(selector.confirmedSales, totalSales),
    },
  ];
}

function CampaignPerformanceFilters({
  campaigns,
  draftEndDate,
  draftStartDate,
  onCampaignChange,
  onDraftEndDateChange,
  onDraftStartDateChange,
  onReset,
  onSearch,
  selectedCampaign,
}: {
  campaigns: readonly Campaign[];
  draftEndDate: string;
  draftStartDate: string;
  onCampaignChange: (campaignId: number) => void;
  onDraftEndDateChange: (date: string) => void;
  onDraftStartDateChange: (date: string) => void;
  onReset: () => void;
  onSearch: () => void;
  selectedCampaign: Campaign;
}) {
  const maximumQueryDate = defaultCampaignPeriod(selectedCampaign).endDate;

  return (
    <div className="fuma-campaign-performance-filter">
      <ListSearchPanel actions={<SearchActions onReset={onReset} onSearch={onSearch} />}>
        <FilterField htmlFor="campaign-performance-campaign" label="캠페인">
          <Select
            aria-label="성과 조회 캠페인"
            id="campaign-performance-campaign"
            onChange={(event) => onCampaignChange(Number(event.target.value))}
            options={campaigns.map((campaign) => ({
              label: campaign.title,
              value: String(campaign.id),
            }))}
            value={String(selectedCampaign.id)}
          />
        </FilterField>
        <FilterField
          className="fuma-performance-period-filter"
          htmlFor="campaign-performance-period-start"
          label="기간"
        >
          <div aria-label="캠페인 성과 조회 기간" role="group">
            <TextInput
              aria-label="캠페인 성과 시작일"
              id="campaign-performance-period-start"
              max={draftEndDate || maximumQueryDate}
              min={selectedCampaign.startDate}
              onChange={(event) => onDraftStartDateChange(event.target.value)}
              type="date"
              value={draftStartDate}
            />
            <span aria-hidden="true">~</span>
            <TextInput
              aria-label="캠페인 성과 종료일"
              id="campaign-performance-period-end"
              max={maximumQueryDate}
              min={draftStartDate || selectedCampaign.startDate}
              onChange={(event) => onDraftEndDateChange(event.target.value)}
              type="date"
              value={draftEndDate}
            />
          </div>
        </FilterField>
      </ListSearchPanel>
    </div>
  );
}

function CampaignSalesOverview({
  failed,
  loading,
  performance,
}: {
  failed: boolean;
  loading: boolean;
  performance: CampaignPerformanceDetail | null;
}) {
  const [trendMode, setTrendMode] = useState<TrendMode>("all");
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const chartDragRef = useRef({ pointerId: -1, startScrollLeft: 0, startX: 0 });
  const [isChartDragging, setIsChartDragging] = useState(false);
  const daily = [...(performance?.daily ?? [])].sort((left, right) => (
    left.date.localeCompare(right.date)
  ));
  const pointGap = 76;
  const chartWidth = Math.max(560, (daily.length - 1) * pointGap + 84);
  const visibleSeries = trendMode === "all"
    ? TREND_SERIES
    : TREND_SERIES.filter((series) => series.value === trendMode);
  const chartSeries = visibleSeries.map((series) => {
    const maximum = Math.max(1, ...daily.map((metric) => metric[series.value]));
    return {
      ...series,
      points: daily.map((metric, index) => ({
        x: 42 + index * pointGap,
        y: 25 + (1 - metric[series.value] / maximum) * 168,
      })),
    };
  });
  const summary = performance?.summary;

  const startChartDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !chartScrollRef.current) return;
    chartDragRef.current = {
      pointerId: event.pointerId,
      startScrollLeft: chartScrollRef.current.scrollLeft,
      startX: event.clientX,
    };
    chartScrollRef.current.setPointerCapture(event.pointerId);
    setIsChartDragging(true);
  };

  const moveChartDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const scrollArea = chartScrollRef.current;
    if (!scrollArea || chartDragRef.current.pointerId !== event.pointerId) return;
    scrollArea.scrollLeft = chartDragRef.current.startScrollLeft
      - (event.clientX - chartDragRef.current.startX);
  };

  const endChartDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const scrollArea = chartScrollRef.current;
    if (!scrollArea || chartDragRef.current.pointerId !== event.pointerId) return;
    if (scrollArea.hasPointerCapture(event.pointerId)) {
      scrollArea.releasePointerCapture(event.pointerId);
    }
    chartDragRef.current.pointerId = -1;
    setIsChartDragging(false);
  };

  return (
    <section aria-label="캠페인 성과 요약" className="fuma-content-performance-overview">
      <article className="fuma-content-performance-panel fuma-content-upload-status fuma-campaign-sales-status">
        <header>
          <span>SALES</span>
          <h2>매출 현황</h2>
        </header>
        <dl aria-busy={loading}>
          <div><dt>확정 매출</dt><dd>{summary ? formatWon(summary.confirmedSales) : "-"}</dd></div>
          <div><dt>확정 주문</dt><dd>{summary ? `${formatNumber(summary.confirmedOrderCount)}건` : "-"}</dd></div>
          <div><dt>판매 수량</dt><dd>{summary ? `${formatNumber(summary.soldQuantity)}개` : "-"}</dd></div>
          <div><dt>매출 발생 셀렉터스</dt><dd>{summary ? `${formatNumber(summary.contributingSelectorCount)}명` : "-"}</dd></div>
        </dl>
      </article>

      <article aria-label="기간별 캠페인 매출" className="fuma-content-performance-panel fuma-content-cohort-chart">
        <header>
          <div>
            <span>TREND</span>
            <h2>기간별 캠페인 성과</h2>
          </div>
        </header>
        <div className="fuma-content-period-chart__toolbar">
          <SegmentedControl
            ariaLabel="기간별 캠페인 성과 지표"
            onChange={setTrendMode}
            options={TREND_OPTIONS}
            value={trendMode}
          />
          <ul aria-label="캠페인 성과 차트 범례" className="fuma-content-cohort-chart__legend">
            {visibleSeries.map((series) => (
              <li className={series.styleClass} key={series.value}><i />{series.label}</li>
            ))}
          </ul>
        </div>
        {loading ? (
          <p>캠페인 성과를 불러오는 중입니다.</p>
        ) : failed ? (
          <p>캠페인 성과를 불러오지 못했습니다.</p>
        ) : daily.length > 0 ? (
          <div
            aria-label="기간별 캠페인 성과 그래프 좌우 이동"
            className={`fuma-content-cohort-chart__scroll fuma-content-cohort-chart__scroll--draggable${isChartDragging ? " is-dragging" : ""}`}
            onPointerCancel={endChartDrag}
            onPointerDown={startChartDrag}
            onPointerMove={moveChartDrag}
            onPointerUp={endChartDrag}
            ref={chartScrollRef}
            role="region"
          >
            <svg
              aria-label={trendMode === "all"
                ? "기간별 전체 캠페인 성과 추이"
                : `기간별 ${visibleSeries[0].label} 추이`}
              className={`fuma-content-cohort-chart__plot fuma-content-period-chart__plot is-${trendMode}`}
              role="img"
              style={{ width: `${chartWidth}px` }}
              viewBox={`0 0 ${chartWidth} 246`}
            >
              <line className="fuma-content-cohort-chart__grid" x1="18" x2={chartWidth - 18} y1="25" y2="25" />
              <line className="fuma-content-cohort-chart__grid" x1="18" x2={chartWidth - 18} y1="109" y2="109" />
              <line className="fuma-content-cohort-chart__grid" x1="18" x2={chartWidth - 18} y1="193" y2="193" />
              {chartSeries.map((series) => (
                <g
                  className={`fuma-content-cohort-chart__series ${series.styleClass}`}
                  data-series={series.value}
                  key={series.value}
                >
                  <path
                    className="fuma-content-cohort-chart__line"
                    d={smoothLinePath(series.points)}
                  />
                  {daily.map((metric, index) => {
                    const point = series.points[index];
                    return (
                      <g data-metric-date={metric.date} data-metric-value={metric[series.value]} key={metric.date}>
                        <circle className="fuma-content-cohort-chart__point" cx={point.x} cy={point.y} r="3.5" />
                        {trendMode !== "all" ? (
                          <text className="fuma-content-cohort-chart__value" textAnchor="middle" x={point.x} y={point.y - 11}>
                            {compactNumber(metric[series.value])}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </g>
              ))}
              {daily.map((metric, index) => (
                <g data-period-date={metric.date} key={metric.date}>
                  <text
                    className="fuma-content-cohort-chart__label"
                    textAnchor="middle"
                    x={42 + index * pointGap}
                    y="228"
                  >
                    {dateLabel(metric.date)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : <p>조회 기간에 표시할 매출 성과가 없습니다.</p>}
      </article>
    </section>
  );
}

function CampaignPerformanceResults({
  errorMessage,
  loading,
  onSelectorClick,
  performance,
}: {
  errorMessage: string;
  loading: boolean;
  onSelectorClick: (selector: CampaignSelectorPerformance) => void;
  performance: CampaignPerformanceDetail | null;
}) {
  const [mode, setMode] = useState<BreakdownMode>("products");
  const [page, setPage] = useState(1);
  const products = [...(performance?.products ?? [])].sort((left, right) => (
    right.confirmedSales - left.confirmedSales || right.confirmedOrderCount - left.confirmedOrderCount
  ));
  const selectors = [...(performance?.selectors ?? [])].sort((left, right) => (
    right.confirmedSales - left.confirmedSales || right.confirmedOrderCount - left.confirmedOrderCount
  ));
  const rows = mode === "products" ? products : selectors;
  const productPage = paginate(products, page, DETAIL_PAGE_SIZE);
  const selectorPage = paginate(selectors, page, DETAIL_PAGE_SIZE);
  const currentPage = mode === "products" ? productPage.currentPage : selectorPage.currentPage;
  const totalPages = mode === "products" ? productPage.totalPages : selectorPage.totalPages;
  const totalSales = performance?.summary.confirmedSales ?? 0;
  const hasDetailRows = products.length > 0 || selectors.length > 0;

  return (
    <section
      aria-label="캠페인 매출 상세"
      className="fuma-content-collection fuma-content-performance-results fuma-campaign-performance-results"
      role="region"
    >
      {!loading && !errorMessage && hasDetailRows ? (
        <>
          <ChoiceTabs
            ariaLabel="캠페인 매출 상세 기준"
            className="fuma-list-action-toolbar"
            onChange={(nextMode) => {
              setMode(nextMode);
              setPage(1);
            }}
            options={BREAKDOWN_OPTIONS}
            value={mode}
          />
          <ResultToolbar
            className="fuma-simple-result-toolbar fuma-campaign-result-toolbar"
            meta={rows.length > 0 ? (
              <span>{mode === "products" ? "상품" : "셀렉터스"} {formatNumber(rows.length)}{mode === "products" ? "개" : "명"}</span>
            ) : undefined}
            title="매출 상세"
          />
        </>
      ) : null}
      {loading ? (
        <EmptyState description="잠시만 기다려 주세요." title="캠페인 매출 상세를 불러오는 중입니다." />
      ) : errorMessage ? (
        <EmptyState title="캠페인 매출 상세를 불러오지 못했습니다." />
      ) : rows.length === 0 ? (
        <EmptyState
          description="캠페인 또는 조회 기간을 변경해 보세요."
          title="선택한 캠페인·기간에 확정 매출이 없습니다."
        />
      ) : (
        <div
          aria-label={mode === "products" ? "상품별 캠페인 매출" : "셀렉터스별 캠페인 매출"}
          className="fuma-wide-table fuma-content-collection__list fuma-campaign-performance-table"
          role="region"
        >
          {mode === "products" ? (
            <DenseTable
              columns={productColumns(totalSales)}
              rowKey={(product) => product.productId}
              rows={productPage.pagedItems}
            />
          ) : (
            <DenseTable
              columns={selectorColumns(totalSales)}
              onRowClick={onSelectorClick}
              rowKey={(selector) => selector.selectorId}
              rows={selectorPage.pagedItems}
            />
          )}
        </div>
      )}
      {!loading && !errorMessage && rows.length > DETAIL_PAGE_SIZE ? (
        <Pagination
          onPageChange={setPage}
          page={currentPage}
          pageSize={DETAIL_PAGE_SIZE}
          totalPages={totalPages}
        />
      ) : null}
    </section>
  );
}

export function CampaignPerformanceDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState("");
  const [draftCampaignId, setDraftCampaignId] = useState<number | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [draftPeriod, setDraftPeriod] = useState({ startDate: "", endDate: "" });
  const [appliedPeriod, setAppliedPeriod] = useState({ startDate: "", endDate: "" });
  const [performance, setPerformance] = useState<CampaignPerformanceDetail | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState("");
  const [usingPreviewData, setUsingPreviewData] = useState(false);
  const [selectedSelectorId, setSelectedSelectorId] = useState<number | null>(null);
  const [selectorDetailState, setSelectorDetailState] = useState<{
    id: number;
    detail: SelectorDetail | null;
    error: string;
  } | null>(null);
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId);
  const draftCampaign = campaigns.find((campaign) => campaign.id === draftCampaignId);

  useEffect(() => {
    const controller = new AbortController();
    void getCampaigns({ page: 0, size: 100 }, controller.signal)
      .then((result) => {
        const sorted = sortCampaigns(result.content);
        setCampaigns(sorted);
        setCampaignsError("");
        const initialCampaign = sorted[0];
        if (initialCampaign) {
          setPerformanceLoading(true);
          setPerformanceError("");
          setDraftCampaignId(initialCampaign.id);
          setSelectedCampaignId(initialCampaign.id);
          const period = defaultCampaignPeriod(initialCampaign);
          setDraftPeriod(period);
          setAppliedPeriod(period);
        }
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setCampaignsError(reason instanceof Error
          ? reason.message
          : "캠페인 목록 조회에 실패했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCampaignsLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (selectedCampaignId === null || !appliedPeriod.startDate || !appliedPeriod.endDate) return;
    const controller = new AbortController();
    void getCampaignPerformance(selectedCampaignId, appliedPeriod, controller.signal)
      .then((result) => {
        const shouldUsePreview = CAMPAIGN_PERFORMANCE_PREVIEW_ENABLED
          && isEmptyCampaignPerformance(result);
        setPerformance(shouldUsePreview ? createCampaignPerformancePreview(result) : result);
        setUsingPreviewData(shouldUsePreview);
        setPerformanceError("");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setPerformance(null);
        setUsingPreviewData(false);
        setPerformanceError(reason instanceof Error
          ? reason.message
          : "캠페인 성과 조회에 실패했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setPerformanceLoading(false);
      });

    return () => controller.abort();
  }, [appliedPeriod, selectedCampaignId]);

  useEffect(() => {
    if (selectedSelectorId === null || usingPreviewData) return;

    const controller = new AbortController();
    const id = selectedSelectorId;
    void getSelector(id, controller.signal)
      .then((detail) => setSelectorDetailState({ id, detail, error: "" }))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setSelectorDetailState({
          id,
          detail: null,
          error: reason instanceof Error
            ? reason.message
            : "셀렉터스 상세 조회에 실패했습니다.",
        });
      });

    return () => controller.abort();
  }, [selectedSelectorId, usingPreviewData]);

  if (campaignsLoading) {
    return <EmptyState description="잠시만 기다려 주세요." title="캠페인을 불러오는 중입니다." />;
  }
  if (campaignsError) {
    return <EmptyState description={campaignsError} title="캠페인을 불러오지 못했습니다." />;
  }
  if (!selectedCampaign || !draftCampaign) {
    return <EmptyState title="조회할 캠페인이 없습니다." />;
  }

  const applyFilters = () => {
    setSelectedSelectorId(null);
    setSelectorDetailState(null);
    setPerformance(null);
    setUsingPreviewData(false);
    setPerformanceLoading(true);
    setPerformanceError("");
    setSelectedCampaignId(draftCampaign.id);
    setAppliedPeriod({ ...draftPeriod });
  };

  const resetFilters = () => {
    const initialCampaign = campaigns[0];
    if (!initialCampaign) return;
    setSelectedSelectorId(null);
    setSelectorDetailState(null);
    const period = defaultCampaignPeriod(initialCampaign);
    setDraftCampaignId(initialCampaign.id);
    setSelectedCampaignId(initialCampaign.id);
    setDraftPeriod(period);
    setAppliedPeriod(period);
    setPerformance(null);
    setUsingPreviewData(false);
    setPerformanceLoading(true);
    setPerformanceError("");
  };

  return (
    <>
      <CampaignPerformanceFilters
        campaigns={campaigns}
        draftEndDate={draftPeriod.endDate}
        draftStartDate={draftPeriod.startDate}
        onCampaignChange={(campaignId) => {
          const campaign = campaigns.find((item) => item.id === campaignId);
          if (!campaign) return;
          setDraftCampaignId(campaign.id);
          setDraftPeriod(defaultCampaignPeriod(campaign));
        }}
        onDraftEndDateChange={(endDate) => setDraftPeriod((current) => ({ ...current, endDate }))}
        onDraftStartDateChange={(startDate) => setDraftPeriod((current) => ({ ...current, startDate }))}
        onReset={resetFilters}
        onSearch={applyFilters}
        selectedCampaign={draftCampaign}
      />
      {usingPreviewData ? (
        <div className="fuma-campaign-performance-preview" role="status">
          <strong>프리뷰 데이터</strong>
          <span>실제 확정 매출이 없어 로컬 더미 데이터로 화면을 표시하고 있습니다.</span>
        </div>
      ) : null}
      <CampaignSalesOverview
        failed={Boolean(performanceError)}
        loading={performanceLoading}
        performance={performance}
      />
      <CampaignPerformanceResults
        errorMessage={performanceError}
        loading={performanceLoading}
        onSelectorClick={(selector) => {
          setSelectedSelectorId(selector.selectorId);
          setSelectorDetailState(usingPreviewData
            ? {
                id: selector.selectorId,
                detail: createCampaignPerformancePreviewSelectorDetail(selector),
                error: "",
              }
            : null);
        }}
        performance={performance}
      />
      {selectedSelectorId !== null ? (
        <SelectorDetailPanel
          onClose={() => {
            setSelectedSelectorId(null);
            setSelectorDetailState(null);
          }}
          selectorDetail={selectorDetailState?.id === selectedSelectorId
            ? selectorDetailState.detail
            : null}
          selectorDetailError={selectorDetailState?.id === selectedSelectorId
            ? selectorDetailState.error
            : ""}
          selectorDetailLoading={selectorDetailState?.id !== selectedSelectorId}
        />
      ) : null}
    </>
  );
}
