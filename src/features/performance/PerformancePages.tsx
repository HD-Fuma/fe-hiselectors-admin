import { useEffect, useState } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { Select, TextInput } from "../../components/ui/Controls";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { ListSearchPanel } from "../../components/ui/ListSearchPanel";
import { SearchActions } from "../../components/ui/SearchActions";
import "../../styles/content-inspection.css";
import "../../styles/performance-dashboard.css";
import {
  CAMPAIGN_PERFORMANCE,
  CONTENT_INFLUENCE,
  SELECTOR_PERFORMANCE,
  creatorNameById,
  adaptContentPerformance,
  getContentPerformance,
  getContentPerformanceSummary,
  selectorCohortById,
  type ContentInfluence,
  type ContentPerformanceSummaryApi,
} from "../../entities/performance";
import {
  getGenerations,
  getSelector,
  getSelectorPerformanceBreakdown,
  getSelectorPerformanceSummary,
  getSelectorPerformanceTrend,
  SelectorDetailPanel,
  type Generation,
  type SelectorDetail,
  type SelectorPerformanceBreakdown,
} from "../../entities/selectors";
import { ContentPerformanceDashboard } from "./ContentPerformanceDashboard";
import { SelectorPerformanceDashboard } from "./SelectorPerformanceDashboard";
import {
  adaptSelectorPerformanceSummary,
  adaptSelectorPerformanceTrend,
  EMPTY_SELECTOR_DASHBOARD_SUMMARY,
  type SelectorDashboardTrendPoint,
  type WatchlistKey,
} from "./selectorDashboard";

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

const PLATFORM_OPTIONS = [
  { label: "전체", value: "" },
  { label: "Instagram", value: "Instagram" },
  { label: "YouTube", value: "YouTube" },
];

interface PerformanceFilterValues {
  campaign: string;
  cohort: string;
  keyword: string;
  platform: string;
  periodEnd: string;
  periodStart: string;
}

const EMPTY_PERFORMANCE_FILTERS: PerformanceFilterValues = {
  campaign: "",
  cohort: "",
  keyword: "",
  platform: "",
  periodEnd: "",
  periodStart: "",
};

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

interface KeywordFilter {
  id: string;
  label: string;
  placeholder: string;
}

function PerformanceFilters({
  cohortOptions = COHORT_OPTIONS,
  keyword,
  onChange,
  onReset,
  onSearch,
  showCampaign = true,
  showCohort = true,
  showPeriod = true,
  showPlatform = false,
  values,
}: {
  cohortOptions?: readonly { label: string; value: string }[];
  keyword?: KeywordFilter;
  onChange: <Key extends keyof PerformanceFilterValues>(
    key: Key,
    value: PerformanceFilterValues[Key],
  ) => void;
  onReset: () => void;
  onSearch: () => void;
  showCampaign?: boolean;
  showCohort?: boolean;
  showPeriod?: boolean;
  showPlatform?: boolean;
  values: PerformanceFilterValues;
}) {
  return (
    <ListSearchPanel actions={<SearchActions onReset={onReset} onSearch={onSearch} />}>
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
      {showCohort ? (
        <FilterField htmlFor="performance-cohort" label="기수">
          <Select
            aria-label="기수"
            id="performance-cohort"
            onChange={(event) => onChange("cohort", event.target.value)}
            options={cohortOptions}
            value={values.cohort}
          />
        </FilterField>
      ) : null}
      {showCampaign ? (
        <FilterField htmlFor="performance-campaign" label="캠페인">
          <Select
            aria-label="캠페인"
            id="performance-campaign"
            onChange={(event) => onChange("campaign", event.target.value)}
            options={CAMPAIGN_OPTIONS}
            value={values.campaign}
          />
        </FilterField>
      ) : null}
      {showPlatform ? (
        <FilterField htmlFor="performance-platform" label="플랫폼">
          <Select
            aria-label="플랫폼"
            id="performance-platform"
            onChange={(event) => onChange("platform", event.target.value)}
            options={PLATFORM_OPTIONS}
            value={values.platform}
          />
        </FilterField>
      ) : null}
      {showPeriod ? (
        <FilterField
          className="fuma-performance-period-filter"
          htmlFor="performance-period-start"
          label="기간"
        >
          <div aria-label="집계 기간" role="group">
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
        </FilterField>
      ) : null}
    </ListSearchPanel>
  );
}


export function SelectorPerformancePage() {
  const [watchlist, setWatchlist] = useState<WatchlistKey | null>(null);
  const [selectedSelectorId, setSelectedSelectorId] = useState<number | null>(null);
  const [selectorDetailState, setSelectorDetailState] = useState<{
    id: number;
    detail: SelectorDetail | null;
    error: string;
  } | null>(null);
  const [breakdownState, setBreakdownState] = useState<{
    id: number;
    breakdown: SelectorPerformanceBreakdown | null;
    error: string;
  } | null>(null);
  const [summary, setSummary] = useState(EMPTY_SELECTOR_DASHBOARD_SUMMARY);
  const [trend, setTrend] = useState<SelectorDashboardTrendPoint[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const {
    appliedFilters,
    applyFilters,
    draftFilters,
    resetFilters,
    updateDraftFilter,
  } = usePerformanceFilterState();
  const generationId = appliedFilters.cohort === ""
    ? undefined
    : Number(appliedFilters.cohort);
  const cohortOptions = [
    { label: "전체", value: "" },
    ...generations.map((generation) => ({
      label: generation.generationName,
      value: String(generation.id),
    })),
  ];

  useEffect(() => {
    const controller = new AbortController();
    const query = {
      endDate: appliedFilters.periodEnd || undefined,
      generationId: Number.isFinite(generationId) ? generationId : undefined,
      startDate: appliedFilters.periodStart || undefined,
    };
    void Promise.all([
      getSelectorPerformanceSummary(query, controller.signal),
      getSelectorPerformanceTrend(query, controller.signal),
    ])
      .then(([summaryResponse, trendResponse]) => {
        setSummary(adaptSelectorPerformanceSummary(summaryResponse));
        setTrend(adaptSelectorPerformanceTrend(trendResponse));
        setErrorMessage("");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setSummary(EMPTY_SELECTOR_DASHBOARD_SUMMARY);
        setTrend([]);
        setErrorMessage(reason instanceof Error
          ? reason.message
          : "셀렉터스 성과 조회에 실패했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    appliedFilters.periodEnd,
    appliedFilters.periodStart,
    generationId,
    requestVersion,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    void getGenerations(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setGenerations(items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setGenerations([]);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (selectedSelectorId === null) return;

    const controller = new AbortController();
    const id = selectedSelectorId;
    void getSelector(id, controller.signal)
      .then((detail) => {
        setSelectorDetailState({ id, detail, error: "" });
      })
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
  }, [selectedSelectorId]);

  useEffect(() => {
    if (selectedSelectorId === null) return;

    const controller = new AbortController();
    const id = selectedSelectorId;
    const range = {
      endDate: appliedFilters.periodEnd || undefined,
      startDate: appliedFilters.periodStart || undefined,
    };
    void getSelectorPerformanceBreakdown(id, range, controller.signal)
      .then((breakdown) => {
        setBreakdownState({ id, breakdown, error: "" });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setBreakdownState({
          id,
          breakdown: null,
          error: reason instanceof Error
            ? reason.message
            : "상품·캠페인 성과 조회에 실패했습니다.",
        });
      });

    return () => controller.abort();
  }, [appliedFilters.periodEnd, appliedFilters.periodStart, selectedSelectorId]);

  const currentSelectorDetail = selectorDetailState?.id === selectedSelectorId
    ? selectorDetailState
    : null;
  const currentBreakdown = breakdownState?.id === selectedSelectorId ? breakdownState : null;
  const openSelectorDetail = (selectorId: number) => {
    setSelectorDetailState(null);
    setBreakdownState(null);
    setSelectedSelectorId(selectorId);
  };

  const applyAndResetPage = () => {
    setLoading(true);
    applyFilters();
    setWatchlist(null);
    setRequestVersion((current) => current + 1);
  };

  const resetAndResetPage = () => {
    setLoading(true);
    resetFilters();
    setWatchlist(null);
    setRequestVersion((current) => current + 1);
  };

  return (
    <section className="fuma-page fuma-performance-page">
      <PageHeader title="셀렉터스 성과" />
      <div className="fuma-page__body">
        <div className="fuma-performance-top-filter">
          <PerformanceFilters
            cohortOptions={cohortOptions}
            onChange={updateDraftFilter}
            onReset={resetAndResetPage}
            onSearch={applyAndResetPage}
            showCampaign={false}
            values={draftFilters}
          />
        </div>
        {errorMessage ? (
          <EmptyState description={errorMessage} title="셀렉터스 성과를 불러오지 못했습니다." />
        ) : (
          <SelectorPerformanceDashboard
            loading={loading}
            onSelectSelector={(row) => openSelectorDetail(row.selectorId)}
            onWatchlistChange={setWatchlist}
            summary={summary}
            trend={trend}
            watchlist={watchlist}
          />
        )}
      </div>
      {selectedSelectorId !== null ? (
        <SelectorDetailPanel
          onClose={() => {
            setSelectedSelectorId(null);
            setSelectorDetailState(null);
            setBreakdownState(null);
          }}
          performanceBreakdown={currentBreakdown?.breakdown ?? null}
          performanceBreakdownError={currentBreakdown?.error}
          selectorDetail={currentSelectorDetail?.detail}
          selectorDetailError={currentSelectorDetail?.error}
          selectorDetailLoading={currentSelectorDetail === null}
        />
      ) : null}
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

function contentPerformanceForFilters(filters: PerformanceFilterValues) {
  return CONTENT_INFLUENCE.filter((content) => (
    (!filters.campaign || content.campaignId === filters.campaign)
    && (!filters.cohort || selectorCohortById(content.selectorId) === filters.cohort)
    && (!filters.platform || content.platform === filters.platform)
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
    && (!filters.platform || content.platform === filters.platform)
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
    <section className="fuma-page fuma-performance-page fuma-content-performance-page">
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
              showCampaign={false}
              showCohort={false}
              showPeriod={false}
              showPlatform
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

