import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getRecentTaskRuns, type SpringPage, type TaskRun } from "../../entities/task-run";
import { TaskRunHistoryPage } from "./TaskRunHistoryPage";

vi.mock("../../entities/task-run", () => ({ getRecentTaskRuns: vi.fn() }));

function taskRun(overrides: Partial<TaskRun> = {}): TaskRun {
  return {
    runId: "task-run-1",
    taskType: "CONTENT_SYNC",
    triggerType: "SCHEDULED",
    status: "SUCCEEDED",
    currentStep: null,
    progressMessage: null,
    totalCount: 2,
    processedCount: 2,
    succeededCount: 2,
    failedCount: 0,
    skippedCount: 0,
    progressPercent: 100,
    startedBy: { adminId: 6, name: "노출금지 스케줄러 관리자" },
    startedAt: null,
    finishedAt: "완료 시각",
    ...overrides,
  };
}

function page(
  content: TaskRun[],
  overrides: Partial<SpringPage<TaskRun>> = {},
): SpringPage<TaskRun> {
  return {
    content,
    number: 0,
    size: 20,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TaskRunHistoryPage />
    </MemoryRouter>,
  );
}

beforeEach(() => vi.mocked(getRecentTaskRuns).mockReset());

test("shows the exact loading and empty history states", async () => {
  let resolveRequest!: (value: SpringPage<TaskRun>) => void;
  vi.mocked(getRecentTaskRuns).mockReturnValue(new Promise((resolve) => {
    resolveRequest = resolve;
  }));

  renderPage();

  expect(screen.getByRole("heading", { name: "모니터링" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "작업 실행 이력을 불러오는 중입니다.",
  );
  await act(async () => resolveRequest(page([])));
  expect(screen.getByText("완료된 작업 실행 이력이 없습니다.")).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "페이지 이동" })).not.toBeInTheDocument();
});

test("renders the completed history contract and safe execution subjects", async () => {
  vi.mocked(getRecentTaskRuns).mockResolvedValue(page([
    taskRun(),
    taskRun({
      runId: "named-admin",
      taskType: "SETTLEMENT_CALCULATION",
      triggerType: "ADMIN_TRIGGERED",
      progressMessage: "  신규 1건 · 수정 1건  ",
      startedBy: { adminId: 7, name: "김관리자" },
      startedAt: "시작 시각",
    }),
    taskRun({
      runId: "deleted-admin",
      triggerType: "ADMIN_TRIGGERED",
      startedBy: { adminId: 8, name: null },
    }),
    taskRun({
      runId: "blank-admin",
      triggerType: "ADMIN_TRIGGERED",
      startedBy: { adminId: 9, name: "   " },
    }),
    taskRun({
      runId: "null-admin",
      triggerType: "ADMIN_TRIGGERED",
      startedBy: null,
    }),
  ]));

  renderPage();

  const history = await screen.findByRole("region", { name: "모니터링" });
  expect(within(history).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
    "종료 시각",
    "시작 시각",
    "작업",
    "상태",
    "실행 주체",
    "처리 결과",
  ]);
  expect(await within(history).findByText("스케줄러")).toBeInTheDocument();
  expect(within(history).getAllByText("수동 실행")).toHaveLength(4);
  expect(within(history).queryByText(/김관리자|노출금지/)).not.toBeInTheDocument();
  expect(within(history).getByText("신규 1건 · 수정 1건")).toBeInTheDocument();
  expect(within(history).getAllByText("2건 작업을 완료했습니다")).toHaveLength(4);
  expect(within(history).getByText("정산 계산")).toBeInTheDocument();
  expect(within(history).getAllByText("완료")).toHaveLength(5);
  expect(within(history).getAllByText("-").length).toBeGreaterThan(0);
});

test("falls back from a blank non-creator progress message to the count summary", async () => {
  vi.mocked(getRecentTaskRuns).mockResolvedValue(page([
    taskRun({
      taskType: "PROPOSAL_EMAIL_SEND",
      progressMessage: "   ",
      succeededCount: 7,
      totalCount: 7,
    }),
  ]));

  renderPage();

  expect(await screen.findByText("7건 작업을 완료했습니다")).toBeInTheDocument();
});

test("requests UI pages as one-based values and moves through Spring results", async () => {
  vi.mocked(getRecentTaskRuns)
    .mockResolvedValueOnce(page([taskRun()], {
      number: 0,
      totalElements: 21,
      totalPages: 2,
    }))
    .mockResolvedValueOnce(page([taskRun({ runId: "page-2" })], {
      number: 1,
      totalElements: 21,
      totalPages: 2,
    }));

  renderPage();

  expect(await screen.findByText("1 / 2 페이지")).toBeInTheDocument();
  expect(getRecentTaskRuns).toHaveBeenNthCalledWith(1, 1, expect.any(AbortSignal));

  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));

  expect(await screen.findByText("2 / 2 페이지")).toBeInTheDocument();
  expect(getRecentTaskRuns).toHaveBeenNthCalledWith(2, 2, expect.any(AbortSignal));
});
