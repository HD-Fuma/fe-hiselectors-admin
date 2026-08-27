import { useEffect, useState } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill } from "../../components/ui/StatusPill";
import {
  getRecentTaskRuns,
  type SpringPage,
  type TaskRun,
} from "../../entities/task-run";
import {
  STATUS_LABELS,
  STATUS_TONES,
  TASK_LABELS,
  terminalSummary,
  triggerLabel,
} from "./taskRunPresentation";

const DEFAULT_PAGE_SIZE = 20;
const TASK_OPTIONS = [
  { label: "전체", value: "" },
  ...Object.entries(TASK_LABELS).map(([value, label]) => ({ label, value })),
];
const STATUS_OPTIONS = [
  { label: "전체", value: "" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ label, value })),
];

function emptyPage(pageSize = DEFAULT_PAGE_SIZE): SpringPage<TaskRun> {
  return {
    content: [],
    number: 0,
    size: pageSize,
    totalElements: 0,
    totalPages: 0,
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const columns: DenseTableColumn<TaskRun>[] = [
  {
    header: "종료 시각",
    key: "finishedAt",
    width: "15%",
    render: (run) => formatDateTime(run.finishedAt),
  },
  {
    header: "시작 시각",
    key: "startedAt",
    width: "15%",
    render: (run) => formatDateTime(run.startedAt),
  },
  {
    header: "작업",
    key: "taskType",
    width: "17%",
    render: (run) => TASK_LABELS[run.taskType],
  },
  {
    align: "center",
    header: "상태",
    key: "status",
    width: "11%",
    render: (run) => (
      <StatusPill tone={STATUS_TONES[run.status]}>{STATUS_LABELS[run.status]}</StatusPill>
    ),
  },
  {
    header: "실행 주체",
    id: "trigger",
    width: "14%",
    render: triggerLabel,
  },
  {
    header: "처리 결과",
    id: "result",
    render: (run) => terminalSummary(run) ?? "-",
  },
];

export function TaskRunHistoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [historyPage, setHistoryPage] = useState<SpringPage<TaskRun>>(emptyPage);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [taskType, setTaskType] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({ keyword: "", status: "", taskType: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const result = await getRecentTaskRuns(page, pageSize, controller.signal);
        if (!controller.signal.aborted) setHistoryPage(result);
      } catch (error: unknown) {
        if (
          controller.signal.aborted
          || (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }
        setHistoryPage(emptyPage());
        setHasError(true);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();

    return () => controller.abort();
  }, [page, pageSize]);

  const changePage = (nextPage: number) => {
    setHistoryPage(emptyPage(pageSize));
    setIsLoading(true);
    setHasError(false);
    setPage(nextPage);
  };

  const changePageSize = (nextPageSize: number) => {
    setHistoryPage(emptyPage(nextPageSize));
    setIsLoading(true);
    setHasError(false);
    setPage(1);
    setPageSize(nextPageSize);
  };

  const applyFilters = () => {
    setFilters({ keyword: keyword.trim().toLowerCase(), status, taskType });
    setPage(1);
  };

  const resetFilters = () => {
    setKeyword("");
    setTaskType("");
    setStatus("");
    setFilters({ keyword: "", status: "", taskType: "" });
    setPage(1);
  };

  const filteredRuns = historyPage.content.filter((run) => (
    (!filters.taskType || run.taskType === filters.taskType)
    && (!filters.status || run.status === filters.status)
    && (!filters.keyword || [
      run.runId,
      TASK_LABELS[run.taskType],
      STATUS_LABELS[run.status],
      triggerLabel(run),
      terminalSummary(run) ?? "",
    ].join(" ").toLowerCase().includes(filters.keyword))
  ));
  const hasFilters = Boolean(filters.keyword || filters.status || filters.taskType);

  const emptyMessage = isLoading ? (
    <span aria-live="polite" role="status">작업 실행 이력을 불러오는 중입니다.</span>
  ) : hasError ? (
    <span role="alert">작업 실행 이력 조회에 실패했습니다.</span>
  ) : hasFilters ? "검색 조건에 맞는 작업 실행 이력이 없습니다." : "완료된 작업 실행 이력이 없습니다.";

  return (
    <section className="fuma-page">
      <PageHeader title="모니터링" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search">
          <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
            <FilterField htmlFor="task-run-keyword" label="검색어">
              <TextInput
                id="task-run-keyword"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="작업명 또는 처리 결과 검색"
                value={keyword}
              />
            </FilterField>
            <FilterField htmlFor="task-run-type" label="작업">
              <Select
                id="task-run-type"
                onChange={(event) => setTaskType(event.target.value)}
                options={TASK_OPTIONS}
                value={taskType}
              />
            </FilterField>
            <FilterField htmlFor="task-run-status" label="상태">
              <Select
                id="task-run-status"
                onChange={(event) => setStatus(event.target.value)}
                options={STATUS_OPTIONS}
                value={status}
              />
            </FilterField>
          </SearchPanel>
        </div>
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={<span>총 {(hasFilters ? filteredRuns.length : historyPage.totalElements).toLocaleString("ko-KR")}건</span>}
          title="모니터링"
        />
        <section aria-label="모니터링">
          <DenseTable
            columns={columns}
            emptyMessage={emptyMessage}
            rowKey={(run) => run.runId}
            rows={filteredRuns}
          />
        </section>
        {!isLoading && !hasError && historyPage.totalPages > 0 ? (
          <Pagination
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            page={historyPage.number + 1}
            pageSize={pageSize}
            totalPages={historyPage.totalPages}
          />
        ) : null}
      </div>
    </section>
  );
}
