import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "../../components/shell/PageHeader";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { Select, TextInput } from "../../components/ui/Controls";
import { FilterField } from "../../components/ui/FilterField";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import "../../styles/content-inspection.css";
import "../../styles/performance-dashboard.css";
import {
  CAMPAIGN_PERFORMANCE,
  CONTENT_INFLUENCE,
  PRODUCT_INFLUENCE,
  SELECTOR_PERFORMANCE,
  creatorNameById,
  adaptContentPerformance,
  formatCount,
  formatRate,
  getContentPerformance,
  getContentPerformanceSummary,
  selectorCohortById,
  type CampaignPerformance,
  type ContentInfluence,
  type ContentPerformanceSummaryApi,
  type SelectorPerformance,
} from "../../entities/performance";
import { ContentPerformanceDashboard } from "./ContentPerformanceDashboard";

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
  showPeriod = true,
  values,
}: {
  keyword?: KeywordFilter;
  onChange: <Key extends keyof PerformanceFilterValues>(
    key: Key,
    value: PerformanceFilterValues[Key],
  ) => void;
  onReset: () => void;
  onSearch: () => void;
  showPeriod?: boolean;
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
        {showPeriod ? (
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
        ) : null}
      </SearchPanel>
    </div>
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

interface CampaignBundlePerformance extends CampaignPerformance {
  contentCount: number;
  productBundle: string;
  productCount: number;
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
      <PageHeader title="셀렉터스 성과" />
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

function apiContentPerformanceForFilters(
  contents: readonly ContentInfluence[],
  filters: PerformanceFilterValues,
) {
  return contents.filter((content) => (
    !filters.campaign
    && (!filters.cohort || content.cohort === filters.cohort)
    && includesKeyword(
      [content.id, content.title, content.authorName ?? ""],
      filters.keyword,
    )
  ));
}

export function ContentPerformancePage() {
  const [page, setPage] = useState(1);
  const [apiContents, setApiContents] = useState<ContentInfluence[]>([]);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [apiLoading, setApiLoading] = useState(true);
  const [uploadSummary, setUploadSummary] = useState<ContentPerformanceSummaryApi>();
  const [uploadSummaryError, setUploadSummaryError] = useState("");
  const [uploadSummaryLoading, setUploadSummaryLoading] = useState(true);
  const {
    appliedFilters,
    applyFilters,
    draftFilters,
    resetFilters,
    updateDraftFilter,
  } = usePerformanceFilterState();
  const contents = contentPerformanceForFilters(appliedFilters);
  const resultContents = apiContentPerformanceForFilters(apiContents, appliedFilters);

  useEffect(() => {
    const controller = new AbortController();
    void getContentPerformance(controller.signal)
      .then((items) => setApiContents(items.map(adaptContentPerformance)))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setApiErrorMessage(error instanceof Error
          ? error.message
          : "콘텐츠 성과 목록 조회에 실패했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setApiLoading(false);
      });
    void getContentPerformanceSummary(controller.signal)
      .then(setUploadSummary)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setUploadSummaryError(error instanceof Error
          ? error.message
          : "콘텐츠 업로드 요약 조회에 실패했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setUploadSummaryLoading(false);
      });

    return () => controller.abort();
  }, []);

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
      <PageHeader title="콘텐츠 성과" />
      <div className="fuma-page__body">
        <ContentPerformanceDashboard
          contents={contents}
          filters={(
            <PerformanceFilters
              keyword={{
                id: "performance-content-keyword",
                label: "콘텐츠/작성자",
                placeholder: "콘텐츠 ID, 제목 또는 작성자 검색",
              }}
              onChange={updateDraftFilter}
              onReset={resetAndResetPage}
              onSearch={applyAndResetPage}
              showPeriod={false}
              values={draftFilters}
            />
          )}
          key={JSON.stringify(appliedFilters)}
          onPageChange={setPage}
          page={page}
          resultContents={resultContents}
          resultErrorMessage={apiErrorMessage}
          resultLoading={apiLoading}
          uploadSummary={uploadSummary}
          uploadSummaryError={uploadSummaryError}
          uploadSummaryLoading={uploadSummaryLoading}
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
      <PageHeader title="캠페인 성과" />
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
