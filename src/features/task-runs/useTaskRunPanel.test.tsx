import { act, render, screen } from "@testing-library/react";
import { getTaskRunPanel } from "../../entities/task-run";
import type { TaskRun, TaskRunPanel } from "../../entities/task-run";
import { useTaskRunPanel } from "./useTaskRunPanel";

vi.mock("../../entities/task-run", () => ({ getTaskRunPanel: vi.fn() }));

interface ProbeProps {
  enabled?: boolean;
  onRender?: (runIds: readonly string[]) => void;
}

function Probe({ enabled = true, onRender }: ProbeProps) {
  const runs = useTaskRunPanel({ enabled });
  const runIds = runs.map((run) => run.runId);
  onRender?.(runIds);
  return <output role="status">{runIds.join(",")}</output>;
}

function taskRun(runId: string): TaskRun {
  return {
    runId,
    taskType: "CREATOR_SYNC",
    triggerType: "ADMIN_TRIGGERED",
    status: "RUNNING",
    currentStep: "진행 중",
    progressMessage: null,
    totalCount: 1,
    processedCount: 0,
    succeededCount: 0,
    failedCount: 0,
    skippedCount: 0,
    progressPercent: 0,
    startedBy: { adminId: 1, name: "김관리자" },
    startedAt: "2026-08-23T00:00:00Z",
    finishedAt: null,
  };
}

function panel(runId: string): TaskRunPanel {
  return { items: [taskRun(runId)], serverTime: "now" };
}

describe("useTaskRunPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getTaskRunPanel).mockReset();
  });
  afterEach(() => vi.useRealTimers());

  test("does not poll or own a timer while disabled", () => {
    const { unmount } = render(<Probe enabled={false} />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(getTaskRunPanel).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);

    unmount();
  });

  test("waits for each request before scheduling the next one-second poll", async () => {
    let resolveFirst!: (value: TaskRunPanel) => void;
    const first = new Promise<TaskRunPanel>((resolve) => {
      resolveFirst = resolve;
    });
    vi.mocked(getTaskRunPanel).mockReturnValueOnce(first).mockResolvedValue({
      items: [], serverTime: "now",
    });
    const { unmount } = render(<Probe />);

    expect(getTaskRunPanel).toHaveBeenCalledTimes(1);
    await act(async () => resolveFirst({ items: [], serverTime: "now" }));
    await act(async () => vi.advanceTimersByTime(999));
    expect(getTaskRunPanel).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTime(1));
    expect(getTaskRunPanel).toHaveBeenCalledTimes(2);
    unmount();
  });

  test("keeps the last successful result after an error and retries after one second", async () => {
    vi.mocked(getTaskRunPanel)
      .mockResolvedValueOnce(panel("successful-run"))
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce(panel("retried-run"));
    const { unmount } = render(<Probe />);

    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("successful-run");

    await act(async () => vi.advanceTimersByTime(1000));
    expect(getTaskRunPanel).toHaveBeenCalledTimes(2);
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("successful-run");

    await act(async () => vi.advanceTimersByTime(1000));
    expect(getTaskRunPanel).toHaveBeenCalledTimes(3);
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("retried-run");

    unmount();
  });

  test("clears a scheduled poll when disabled", async () => {
    vi.mocked(getTaskRunPanel).mockResolvedValue(panel("successful-run"));
    const { rerender, unmount } = render(<Probe />);

    await act(async () => undefined);
    expect(vi.getTimerCount()).toBe(1);

    rerender(<Probe enabled={false} />);
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => vi.advanceTimersByTime(1000));
    expect(getTaskRunPanel).toHaveBeenCalledTimes(1);

    unmount();
  });

  test("exposes an empty state synchronously while published results transition between enabled cycles", async () => {
    let resolveFresh!: (value: TaskRunPanel) => void;
    const fresh = new Promise<TaskRunPanel>((resolve) => {
      resolveFresh = resolve;
    });
    const renderLog: string[][] = [];
    vi.mocked(getTaskRunPanel)
      .mockResolvedValueOnce(panel("published-old-run"))
      .mockReturnValueOnce(fresh);
    const { rerender, unmount } = render(
      <Probe onRender={(runIds) => renderLog.push([...runIds])} />,
    );

    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("published-old-run");

    const disabledTransitionRenderIndex = renderLog.length;
    rerender(
      <Probe enabled={false} onRender={(runIds) => renderLog.push([...runIds])} />,
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(renderLog[disabledTransitionRenderIndex]).toEqual([]);

    rerender(
      <Probe enabled onRender={(runIds) => renderLog.push([...runIds])} />,
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(getTaskRunPanel).toHaveBeenCalledTimes(2);

    await act(async () => resolveFresh(panel("fresh-run")));
    expect(screen.getByRole("status")).toHaveTextContent("fresh-run");

    unmount();
  });

  test("aborts an in-flight request and ignores its late result after re-enabling", async () => {
    let resolveOld!: (value: TaskRunPanel) => void;
    let resolveNew!: (value: TaskRunPanel) => void;
    const oldRequest = new Promise<TaskRunPanel>((resolve) => {
      resolveOld = resolve;
    });
    const newRequest = new Promise<TaskRunPanel>((resolve) => {
      resolveNew = resolve;
    });
    vi.mocked(getTaskRunPanel)
      .mockReturnValueOnce(oldRequest)
      .mockReturnValueOnce(newRequest);
    const { rerender, unmount } = render(<Probe />);
    const firstSignal = vi.mocked(getTaskRunPanel).mock.calls[0][0];

    rerender(<Probe enabled={false} />);
    expect(firstSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);

    rerender(<Probe enabled />);
    expect(getTaskRunPanel).toHaveBeenCalledTimes(2);

    await act(async () => resolveOld(panel("old-run")));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    await act(async () => resolveNew(panel("new-run")));
    expect(screen.getByRole("status")).toHaveTextContent("new-run");

    unmount();
  });

  test("aborts the in-flight request on cleanup", () => {
    vi.mocked(getTaskRunPanel).mockReturnValue(new Promise(() => undefined));
    const { unmount } = render(<Probe />);
    const signal = vi.mocked(getTaskRunPanel).mock.calls[0][0];

    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
