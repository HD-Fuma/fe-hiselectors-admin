import { act, fireEvent, render, screen } from "@testing-library/react";
import type { TaskRun } from "../../entities/task-run";
import { TaskRunPanelHost } from "./TaskRunPanelHost";

const liveRun: TaskRun = {
  runId: "live-settlement-run",
  taskType: "SETTLEMENT_CALCULATION",
  triggerType: "SCHEDULED",
  status: "RUNNING",
  currentStep: "실시간 작업",
  progressMessage: null,
  totalCount: 10,
  processedCount: 4,
  succeededCount: 4,
  failedCount: 0,
  skippedCount: 0,
  progressPercent: 40,
  startedBy: null,
};

const useTaskRunPanelMock = vi.hoisted(() => ({
  useTaskRunPanel: vi.fn(),
}));

vi.mock("./useTaskRunPanel", () => useTaskRunPanelMock);

beforeEach(() => {
  useTaskRunPanelMock.useTaskRunPanel.mockReset();
  useTaskRunPanelMock.useTaskRunPanel.mockReturnValue([liveRun]);
});

test("uses live runs in production even when the preview query is present", () => {
  render(
    <TaskRunPanelHost
      fallbackFocusId="admin-main-content"
      isDevelopment={false}
      pathname="/creators"
      search="?taskRunPreview=mixed"
    />,
  );

  expect(useTaskRunPanelMock.useTaskRunPanel).toHaveBeenCalledWith({ enabled: true });
  expect(screen.getByText("실시간 작업")).toBeInTheDocument();
  expect(screen.queryByText("120건 처리에 실패했습니다")).not.toBeInTheDocument();
});

test("disables live polling and renders fixtures for a real preview", () => {
  render(
    <TaskRunPanelHost
      fallbackFocusId="admin-main-content"
      isDevelopment
      pathname="/creators"
      search="?taskRunPreview=mixed"
    />,
  );

  expect(useTaskRunPanelMock.useTaskRunPanel).toHaveBeenCalledWith({ enabled: false });
  expect(screen.getByText("120건 처리에 실패했습니다")).toBeInTheDocument();
  expect(screen.queryByText("실시간 작업")).not.toBeInTheDocument();
});

test("resets dismissal and collapse state across preview and live sources", () => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  const performanceNow = vi
    .spyOn(performance, "now")
    .mockImplementation(() => Date.now());
  const { rerender } = render(
    <TaskRunPanelHost
      fallbackFocusId="admin-main-content"
      isDevelopment
      pathname="/creators"
      search="?taskRunPreview=mixed"
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "카카오 메시지 발송 기록 닫기" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "작업 패널 접기" }));
  act(() => vi.advanceTimersByTime(419));
  expect(screen.getByText("120건 처리에 실패했습니다")).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByText("120건 처리에 실패했습니다")).not.toBeInTheDocument();

  rerender(
    <TaskRunPanelHost
      fallbackFocusId="admin-main-content"
      isDevelopment
      pathname="/settlements"
      search=""
    />,
  );

  const livePanel = screen.getByRole("region", { name: "작업 진행상황" });
  expect(livePanel).toHaveClass("fuma-task-run-panel");
  expect(livePanel.className).not.toMatch(/--(?:dark|light)/);
  expect(livePanel).toHaveAttribute("data-expanded", "true");
  expect(screen.getByText("실시간 작업")).toBeInTheDocument();
  expect(screen.getByRole("listitem")).toBeInTheDocument();

  rerender(
    <TaskRunPanelHost
      fallbackFocusId="admin-main-content"
      isDevelopment
      pathname="/creators"
      search="?taskRunPreview=mixed"
    />,
  );

  const previewPanel = screen.getByRole("region", { name: "작업 진행상황" });
  expect(previewPanel).toHaveClass("fuma-task-run-panel");
  expect(previewPanel.className).not.toMatch(/--(?:dark|light)/);
  expect(previewPanel).toHaveAttribute("data-expanded", "true");
  expect(screen.getByText("120건 처리에 실패했습니다")).toBeInTheDocument();

  performanceNow.mockRestore();
  vi.useRealTimers();
});
