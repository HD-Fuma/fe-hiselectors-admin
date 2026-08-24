import { useEffect, useState } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
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

const PAGE_SIZE = 20;

function emptyPage(): SpringPage<TaskRun> {
  return {
    content: [],
    number: 0,
    size: PAGE_SIZE,
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
  const [historyPage, setHistoryPage] = useState<SpringPage<TaskRun>>(emptyPage);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const result = await getRecentTaskRuns(page, controller.signal);
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
  }, [page]);

  const changePage = (nextPage: number) => {
    setHistoryPage(emptyPage());
    setIsLoading(true);
    setHasError(false);
    setPage(nextPage);
  };

  const emptyMessage = isLoading ? (
    <span aria-live="polite" role="status">작업 실행 이력을 불러오는 중입니다.</span>
  ) : hasError ? (
    <span role="alert">작업 실행 이력 조회에 실패했습니다.</span>
  ) : "완료된 작업 실행 이력이 없습니다.";

  return (
    <section className="fuma-page">
      <PageHeader title="작업 실행 이력" />
      <div className="fuma-page__body">
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={<span>총 {historyPage.totalElements.toLocaleString("ko-KR")}건</span>}
          title="작업 실행 이력"
        />
        <section aria-label="작업 실행 이력">
          <DenseTable
            columns={columns}
            emptyMessage={emptyMessage}
            rowKey={(run) => run.runId}
            rows={historyPage.content}
          />
        </section>
        {!isLoading && !hasError && historyPage.totalPages > 0 ? (
          <Pagination
            onPageChange={changePage}
            page={historyPage.number + 1}
            pageSize={historyPage.size}
            totalPages={historyPage.totalPages}
          />
        ) : null}
      </div>
    </section>
  );
}
