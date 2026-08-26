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
  getSelectorSalesPerformance,
  SelectorDetailPanel,
  type Generation,
  type SelectorDetail,
  type SelectorSalesPerformance,
} from "../../entities/selectors";
import { CampaignPerformanceDashboard } from "./CampaignPerformanceDashboard";
import { paginate } from "../../lib/pagination";
import { ContentPerformanceDashboard } from "./ContentPerformanceDashboard";
import { SelectorPerformanceDashboard } from "./SelectorPerformanceDashboard";
import {
  buildSelectorTrend,
  enrichSelectorSales,
  filterSelectorUniverse,
  previousPerformanceRange,
  summarizeSelectorDashboard,
  withPreviousPeriodSales,
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
  const [selectors, setSelectors] = useState<SelectorSalesPerformance[]>([]);
  const [previousSelectors, setPreviousSelectors] = useState<SelectorSalesPerformance[] | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generationsLoading, setGenerationsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const {
    appliedFilters,
    applyFilters,
    draftFilters,
    resetFilters,
    updateDraftFilter,
  } = usePerformanceFilterState();
  const universeRows = generationsLoading
    ? []
    : withPreviousPeriodSales(
      filterSelectorUniverse(
        selectors,
        generations,
        appliedFilters.cohort,
      ).map(enrichSelectorSales),
      previousSelectors == null
        ? null
        : filterSelectorUniverse(previousSelectors, generations, appliedFilters.cohort),
    );
  const dashboardSummary = summarizeSelectorDashboard(
    universeRows,
    previousSelectors != null,
  );
  const dashboardTrend = buildSelectorTrend(
    universeRows,
    appliedFilters.periodStart,
    appliedFilters.periodEnd,
  );
  const cohortOptions = [
    { label: "전체", value: "" },
    ...Array.from(new Set(
      filterSelectorUniverse(selectors, generations, "").flatMap((selector) => (
        selector.generationName || []
      )),
    )).map((generationName) => ({ label: generationName, value: generationName })),
  ];
  const dashboardLoading = loading || generationsLoading;

  useEffect(() => {
    const controller = new AbortController();
    void getSelectorSalesPerformance({
      endDate: appliedFilters.periodEnd || undefined,
      startDate: appliedFilters.periodStart || undefined,
    }, controller.signal)
      .then((items) => {
        setSelectors(items);
        setErrorMessage("");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
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
    requestVersion,
  ]);

  useEffect(() => {
    if (generationsLoading) return;
    const range = previousPerformanceRange({
      generations,
      periodStart: appliedFilters.periodStart,
      selectedGenerationName: appliedFilters.cohort,
    });
    if (!range) {
      setPreviousSelectors(null);
      return;
    }

    const controller = new AbortController();
    setPreviousSelectors(null);
    void getSelectorSalesPerformance({
      endDate: range.endDate,
      startDate: range.startDate,
    }, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setPreviousSelectors(items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setPreviousSelectors(null);
      });

    return () => controller.abort();
  }, [
    appliedFilters.cohort,
    appliedFilters.periodStart,
    generations,
    generationsLoading,
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
      })
      .finally(() => {
        if (!controller.signal.aborted) setGenerationsLoading(false);
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

  const currentSelectorDetail = selectorDetailState?.id === selectedSelectorId
    ? selectorDetailState
    : null;
  const openSelectorDetail = (selector: SelectorSalesPerformance) => {
    setSelectorDetailState(null);
    setSelectedSelectorId(selector.selectorId);
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
            loading={dashboardLoading}
            onSelectSelector={(row) => openSelectorDetail(row.source)}
            onWatchlistChange={setWatchlist}
            summary={dashboardSummary}
            trend={dashboardTrend.points}
            watchlist={watchlist}
          />
        )}
      </div>
      {selectedSelectorId !== null ? (
        <SelectorDetailPanel
          onClose={() => {
            setSelectedSelectorId(null);
            setSelectorDetailState(null);
          }}
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

