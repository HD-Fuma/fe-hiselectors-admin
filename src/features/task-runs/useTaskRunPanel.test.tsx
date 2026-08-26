import { act, render, screen } from "@testing-library/react";
import { getTaskRunPanel, streamTaskRunProgress } from "../../entities/task-run";
import type {
  TaskRun,
  TaskRunPanel,
  TaskRunProgressEvent,
} from "../../entities/task-run";
import { useTaskRunPanel } from "./useTaskRunPanel";

vi.mock("../../entities/task-run", () => ({
  getTaskRunPanel: vi.fn(),
  streamTaskRunProgress: vi.fn(),
}));

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

function contentRun(
  runId: string,
  overrides: Partial<TaskRun> = {},
): TaskRun {
  return {
    ...taskRun(runId),
    taskType: "CONTENT_SYNC",
    currentStep: "NEW_CONTENT_SYNC",
    stepProgress: {
      NEW_CONTENT_SYNC: { totalCount: 3, processedCount: 0 },
      STORED_CONTENT_SYNC: { totalCount: null, processedCount: 0 },
    },
    ...overrides,
  };
}

function progressEvent(
  processedCount: number,
  overrides: Partial<TaskRunProgressEvent> = {},
): TaskRunProgressEvent {
  return {
    runId: "11111111-1111-4111-8111-111111111111",
    stepKey: "NEW_CONTENT_SYNC",
    totalCount: 3,
    processedCount,
    ...overrides,
  };
}

interface ProgressProbeProps {
  onRender?: (processedCount: number | undefined) => void;
}

function ProgressProbe({ onRender }: ProgressProbeProps) {
  const runs = useTaskRunPanel();
  const processedCount = runs[0]?.stepProgress?.NEW_CONTENT_SYNC?.processedCount;
  onRender?.(processedCount);
  return <output role="status">{processedCount}</output>;
}

function DualProgressProbe() {
  const runs = useTaskRunPanel();
  const run = runs[0];
  const newCount = run?.stepProgress?.NEW_CONTENT_SYNC?.processedCount;
  const storedCount = run?.stepProgress?.STORED_CONTENT_SYNC?.processedCount;
  return (
    <output role="status">
      {run?.status ?? "empty"}:{newCount ?? "-"}:{storedCount ?? "-"}
    </output>
  );
}

function ProgressListProbe() {
  const runs = useTaskRunPanel();
  return (
    <output role="status">
      {runs.map((run) => (
        `${run.runId}:${run.status}:${run.stepProgress?.NEW_CONTENT_SYNC?.processedCount ?? "-"}`
      )).join("|")}
    </output>
  );
}

describe("useTaskRunPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getTaskRunPanel).mockReset();
    vi.mocked(streamTaskRunProgress).mockReset();
    vi.mocked(streamTaskRunProgress).mockReturnValue(new Promise(() => undefined));
  });
  afterEach(() => vi.useRealTimers());

  test("does not poll or own a timer while disabled", () => {
    const { unmount } = render(<Probe enabled={false} />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(getTaskRunPanel).not.toHaveBeenCalled();
    expect(streamTaskRunProgress).not.toHaveBeenCalled();
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

  test("opens the stream immediately and visibly renders a same-burst 1 to 2 to 3", async () => {
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    vi.mocked(getTaskRunPanel).mockResolvedValue({
      items: [contentRun("11111111-1111-4111-8111-111111111111")],
      serverTime: "now",
    });
    const renderLog: Array<number | undefined> = [];
    const { unmount } = render(
      <ProgressProbe onRender={(value) => renderLog.push(value)} />,
    );

    expect(streamTaskRunProgress).toHaveBeenCalledTimes(1);
    await act(async () => undefined);
    renderLog.length = 0;

    let burst!: Promise<void>;
    act(() => {
      burst = (async () => {
        await onProgress(progressEvent(1));
        await onProgress(progressEvent(2));
        await onProgress(progressEvent(3));
      })();
    });
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("1");

    await act(async () => vi.advanceTimersByTime(16));
    expect(screen.getByRole("status")).toHaveTextContent("2");
    await act(async () => vi.advanceTimersByTime(16));
    expect(screen.getByRole("status")).toHaveTextContent("3");
    await act(async () => vi.advanceTimersByTime(16));
    await burst;
    expect(renderLog.filter((value) => value !== undefined)).toEqual([1, 2, 3]);

    unmount();
  });

  test("keeps direct same-step progress monotonic when 3 is followed by 1", async () => {
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    vi.mocked(getTaskRunPanel).mockResolvedValue({
      items: [contentRun("11111111-1111-4111-8111-111111111111")],
      serverTime: "now",
    });
    const { unmount } = render(<ProgressProbe />);
    await act(async () => undefined);

    const higher = onProgress(progressEvent(3));
    await act(async () => undefined);
    await act(async () => vi.advanceTimersByTime(16));
    await higher;
    expect(screen.getByRole("status")).toHaveTextContent("3");

    const lower = onProgress(progressEvent(1));
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("3");
    await act(async () => vi.advanceTimersByTime(16));
    await lower;
    unmount();
  });

  test("keeps buffered replay monotonic when retained 3 is followed by 1", async () => {
    let resolvePanel!: (value: TaskRunPanel) => void;
    const initialPanel = new Promise<TaskRunPanel>((resolve) => {
      resolvePanel = resolve;
    });
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    vi.mocked(getTaskRunPanel).mockReturnValue(initialPanel);
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    const runId = "11111111-1111-4111-8111-111111111111";
    const { unmount } = render(<ProgressProbe />);
    await onProgress(progressEvent(3));
    await onProgress(progressEvent(1));

    await act(async () => resolvePanel({
      items: [contentRun(runId)], serverTime: "now",
    }));
    expect(screen.getByRole("status")).toHaveTextContent("3");
    await act(async () => vi.advanceTimersByTime(16));
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("3");
    unmount();
  });

  test("buffers progress for both steps until the initial panel introduces the run", async () => {
    let resolvePanel!: (value: TaskRunPanel) => void;
    const initialPanel = new Promise<TaskRunPanel>((resolve) => {
      resolvePanel = resolve;
    });
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    vi.mocked(getTaskRunPanel).mockReturnValue(initialPanel);
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    const runId = "11111111-1111-4111-8111-111111111111";
    const { unmount } = render(<DualProgressProbe />);

    await onProgress(progressEvent(2));
    await onProgress(progressEvent(1, {
      stepKey: "STORED_CONTENT_SYNC",
      totalCount: 4,
    }));
    expect(screen.getByRole("status")).toHaveTextContent("empty");

    await act(async () => resolvePanel({
      items: [contentRun(runId, {
        currentStep: "STORED_CONTENT_SYNC",
        stepProgress: {
          NEW_CONTENT_SYNC: { totalCount: 3, processedCount: 0 },
          STORED_CONTENT_SYNC: { totalCount: 4, processedCount: 0 },
        },
      })],
      serverTime: "now",
    }));
    expect(screen.getByRole("status")).toHaveTextContent("RUNNING:2:0");
    await act(async () => vi.advanceTimersByTime(16));
    expect(screen.getByRole("status")).toHaveTextContent("RUNNING:2:1");
    await act(async () => vi.advanceTimersByTime(16));

    unmount();
  });

  test("drops the oldest buffered frame per key and reconciles immediately on overflow", async () => {
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    vi.mocked(getTaskRunPanel)
      .mockReturnValueOnce(new Promise(() => undefined))
      .mockResolvedValueOnce({
        items: [contentRun("11111111-1111-4111-8111-111111111111", {
          stepProgress: {
            NEW_CONTENT_SYNC: { totalCount: null, processedCount: 0 },
            STORED_CONTENT_SYNC: { totalCount: null, processedCount: 0 },
          },
        })],
        serverTime: "now",
      });
    const { unmount } = render(<DualProgressProbe />);

    for (let processedCount = 1; processedCount <= 1025; processedCount += 1) {
      await onProgress(progressEvent(processedCount, { totalCount: null }));
    }
    await act(async () => undefined);

    expect(getTaskRunPanel).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent("RUNNING:2:0");
    unmount();
  });

  test("coalesces overflow reconciliation while the first request remains in flight", async () => {
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    const pendingPanel = new Promise<TaskRunPanel>(() => undefined);
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    vi.mocked(getTaskRunPanel)
      .mockReturnValueOnce(pendingPanel)
      .mockReturnValue(pendingPanel);
    const { unmount } = render(<DualProgressProbe />);

    for (let processedCount = 1; processedCount <= 2048; processedCount += 1) {
      await onProgress(progressEvent(processedCount, { totalCount: null }));
    }

    expect(getTaskRunPanel).toHaveBeenCalledTimes(2);
    unmount();
  });

  test("bounds rotating absent progress keys and evicts the oldest key before replay", async () => {
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    const runId = (index: number) => (
      `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`
    );
    const firstRunId = runId(1);
    const newestRunId = runId(257);
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    vi.mocked(getTaskRunPanel)
      .mockReturnValueOnce(new Promise(() => undefined))
      .mockResolvedValueOnce({
        items: [
          contentRun(firstRunId, {
            stepProgress: {
              NEW_CONTENT_SYNC: { totalCount: null, processedCount: 0 },
              STORED_CONTENT_SYNC: { totalCount: null, processedCount: 0 },
            },
          }),
          contentRun(newestRunId, {
            stepProgress: {
              NEW_CONTENT_SYNC: { totalCount: null, processedCount: 0 },
              STORED_CONTENT_SYNC: { totalCount: null, processedCount: 0 },
            },
          }),
        ],
        serverTime: "now",
      });
    const { unmount } = render(<ProgressListProbe />);

    for (let index = 1; index <= 257; index += 1) {
      await onProgress(progressEvent(index, {
        runId: runId(index),
        totalCount: null,
      }));
    }
    await act(async () => undefined);

    expect(getTaskRunPanel).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent(`${firstRunId}:RUNNING:0`);
    expect(screen.getByRole("status")).toHaveTextContent(`${newestRunId}:RUNNING:257`);
    unmount();
  });

  test("keeps one-second polling active while a retained burst is replaying", async () => {
    let resolveInitial!: (value: TaskRunPanel) => void;
    const initial = new Promise<TaskRunPanel>((resolve) => {
      resolveInitial = resolve;
    });
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    const runId = "11111111-1111-4111-8111-111111111111";
    vi.mocked(getTaskRunPanel)
      .mockReturnValueOnce(initial)
      .mockResolvedValue({ items: [contentRun(runId)], serverTime: "now" });
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    const { unmount } = render(<DualProgressProbe />);
    for (let processedCount = 1; processedCount <= 100; processedCount += 1) {
      await onProgress(progressEvent(processedCount, { totalCount: null }));
    }

    await act(async () => resolveInitial({
      items: [contentRun(runId)],
      serverTime: "now",
    }));
    await act(async () => vi.advanceTimersByTime(1000));

    expect(getTaskRunPanel).toHaveBeenCalledTimes(2);
    unmount();
  });

  test("keeps live same-step progress when an in-flight active poll resolves stale", async () => {
    let resolveStale!: (value: TaskRunPanel) => void;
    const stalePanel = new Promise<TaskRunPanel>((resolve) => {
      resolveStale = resolve;
    });
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    const runId = "11111111-1111-4111-8111-111111111111";
    vi.mocked(getTaskRunPanel)
      .mockResolvedValueOnce({ items: [contentRun(runId)], serverTime: "now" })
      .mockReturnValueOnce(stalePanel);
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    const { unmount } = render(<DualProgressProbe />);
    await act(async () => undefined);
    await act(async () => vi.advanceTimersByTime(1000));

    const liveUpdate = onProgress(progressEvent(3));
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("RUNNING:3:0");
    await act(async () => vi.advanceTimersByTime(16));
    await liveUpdate;

    await act(async () => resolveStale({
      items: [contentRun(runId, {
        stepProgress: {
          NEW_CONTENT_SYNC: { totalCount: 3, processedCount: 1 },
          STORED_CONTENT_SYNC: { totalCount: null, processedCount: 0 },
        },
      })],
      serverTime: "now",
    }));
    expect(screen.getByRole("status")).toHaveTextContent("RUNNING:3:0");

    unmount();
  });

  test("releases a live floor after the authoritative panel drops that run", async () => {
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    const firstRunId = "11111111-1111-4111-8111-111111111111";
    const secondRunId = "22222222-2222-4222-8222-222222222222";
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    vi.mocked(getTaskRunPanel)
      .mockResolvedValueOnce({ items: [contentRun(firstRunId)], serverTime: "first" })
      .mockResolvedValueOnce({ items: [contentRun(secondRunId)], serverTime: "second" })
      .mockResolvedValueOnce({
        items: [contentRun(firstRunId, {
          stepProgress: {
            NEW_CONTENT_SYNC: { totalCount: 3, processedCount: 1 },
            STORED_CONTENT_SYNC: { totalCount: null, processedCount: 0 },
          },
        })],
        serverTime: "third",
      });
    const { unmount } = render(<DualProgressProbe />);
    await act(async () => undefined);
    const liveUpdate = onProgress(progressEvent(3));
    await act(async () => undefined);
    await act(async () => vi.advanceTimersByTime(16));
    await liveUpdate;

    await act(async () => vi.advanceTimersByTime(1000));
    await act(async () => undefined);
    await act(async () => vi.advanceTimersByTime(1000));
    await act(async () => undefined);

    expect(screen.getByRole("status")).toHaveTextContent("RUNNING:1:0");
    unmount();
  });

  test("lets a terminal poll replace the entire live-progress run", async () => {
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    const runId = "11111111-1111-4111-8111-111111111111";
    vi.mocked(getTaskRunPanel)
      .mockResolvedValueOnce({ items: [contentRun(runId)], serverTime: "now" })
      .mockResolvedValueOnce({
        items: [contentRun(runId, {
          status: "SUCCEEDED",
          currentStep: null,
          stepProgress: {
            NEW_CONTENT_SYNC: { totalCount: 3, processedCount: 1 },
            STORED_CONTENT_SYNC: { totalCount: 4, processedCount: 4 },
          },
        })],
        serverTime: "now",
      });
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return new Promise(() => undefined);
    });
    const { unmount } = render(<DualProgressProbe />);
    await act(async () => undefined);
    const liveUpdate = onProgress(progressEvent(3));
    await act(async () => undefined);
    await act(async () => vi.advanceTimersByTime(16));
    await liveUpdate;

    await act(async () => vi.advanceTimersByTime(1000));
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("SUCCEEDED:1:4");

    unmount();
  });

  test("retains a terminal snapshot when a later poll returns stale active state", async () => {
    const runId = "11111111-1111-4111-8111-111111111111";
    const terminalRun = contentRun(runId, {
      status: "SUCCEEDED",
      currentStep: null,
      stepProgress: {
        NEW_CONTENT_SYNC: { totalCount: 3, processedCount: 3 },
        STORED_CONTENT_SYNC: { totalCount: 4, processedCount: 4 },
      },
    });
    vi.mocked(getTaskRunPanel)
      .mockResolvedValueOnce({ items: [contentRun(runId)], serverTime: "now" })
      .mockResolvedValueOnce({ items: [terminalRun], serverTime: "now" })
      .mockResolvedValueOnce({
        items: [contentRun(runId, {
          stepProgress: {
            NEW_CONTENT_SYNC: { totalCount: 3, processedCount: 1 },
            STORED_CONTENT_SYNC: { totalCount: 4, processedCount: 0 },
          },
        })],
        serverTime: "now",
      });
    const { unmount } = render(<DualProgressProbe />);
    await act(async () => undefined);

    await act(async () => vi.advanceTimersByTime(1000));
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("SUCCEEDED:3:4");

    await act(async () => vi.advanceTimersByTime(1000));
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("SUCCEEDED:3:4");
    unmount();
  });

  test("releases a terminal marker after the authoritative panel drops that run", async () => {
    const firstRunId = "11111111-1111-4111-8111-111111111111";
    const secondRunId = "22222222-2222-4222-8222-222222222222";
    vi.mocked(getTaskRunPanel)
      .mockResolvedValueOnce({
        items: [contentRun(firstRunId, { status: "SUCCEEDED", currentStep: null })],
        serverTime: "first",
      })
      .mockResolvedValueOnce({
        items: [contentRun(secondRunId, { status: "SUCCEEDED", currentStep: null })],
        serverTime: "second",
      })
      .mockResolvedValueOnce({
        items: [contentRun(firstRunId)],
        serverTime: "third",
      });
    const { unmount } = render(<DualProgressProbe />);
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("SUCCEEDED");

    await act(async () => vi.advanceTimersByTime(1000));
    await act(async () => undefined);
    await act(async () => vi.advanceTimersByTime(1000));
    await act(async () => undefined);

    expect(screen.getByRole("status")).toHaveTextContent("RUNNING:0:0");
    unmount();
  });

  test("applies an earlier terminal response after a later active response wins the request race", async () => {
    let resolveTerminal!: (value: TaskRunPanel) => void;
    let resolveActive!: (value: TaskRunPanel) => void;
    let resolveStream!: (value: { type: "retryable"; reason: "eof" }) => void;
    const terminalPanel = new Promise<TaskRunPanel>((resolve) => {
      resolveTerminal = resolve;
    });
    const activePanel = new Promise<TaskRunPanel>((resolve) => {
      resolveActive = resolve;
    });
    const stream = new Promise<{ type: "retryable"; reason: "eof" }>((resolve) => {
      resolveStream = resolve;
    });
    const runId = "11111111-1111-4111-8111-111111111111";
    vi.mocked(getTaskRunPanel)
      .mockResolvedValueOnce({ items: [contentRun(runId)], serverTime: "now" })
      .mockReturnValueOnce(terminalPanel)
      .mockReturnValueOnce(activePanel);
    vi.mocked(streamTaskRunProgress).mockReturnValue(stream);
    const { unmount } = render(<DualProgressProbe />);
    await act(async () => undefined);
    await act(async () => vi.advanceTimersByTime(1000));
    resolveStream({ type: "retryable", reason: "eof" });
    await act(async () => undefined);

    await act(async () => resolveActive({
      items: [contentRun(runId)], serverTime: "later-active",
    }));
    await act(async () => resolveTerminal({
      items: [contentRun(runId, {
        status: "SUCCEEDED",
        currentStep: null,
      })],
      serverTime: "earlier-terminal",
    }));

    expect(screen.getByRole("status")).toHaveTextContent("SUCCEEDED");
    unmount();
  });

  test("reconciles before retrying and uses increasing bounded reconnect delays", async () => {
    let resolveFirstReconcile!: (value: TaskRunPanel) => void;
    const firstReconcile = new Promise<TaskRunPanel>((resolve) => {
      resolveFirstReconcile = resolve;
    });
    vi.mocked(getTaskRunPanel)
      .mockResolvedValueOnce({ items: [], serverTime: "now" })
      .mockReturnValueOnce(firstReconcile)
      .mockResolvedValue({ items: [], serverTime: "now" });
    vi.mocked(streamTaskRunProgress)
      .mockResolvedValueOnce({ type: "retryable", reason: "eof" })
      .mockResolvedValueOnce({ type: "retryable", reason: "network" })
      .mockReturnValue(new Promise(() => undefined));
    const { unmount } = render(<Probe />);

    await act(async () => undefined);
    expect(getTaskRunPanel).toHaveBeenCalledTimes(2);
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTime(1000));
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(1);

    await act(async () => resolveFirstReconcile({ items: [], serverTime: "now" }));
    await act(async () => vi.advanceTimersByTime(249));
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTime(1));
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(2);
    await act(async () => undefined);
    const callsAfterSecondReconcile = vi.mocked(getTaskRunPanel).mock.calls.length;
    await act(async () => vi.advanceTimersByTime(499));
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTime(1));
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(3);
    expect(vi.mocked(getTaskRunPanel).mock.calls.length).toBeGreaterThanOrEqual(
      callsAfterSecondReconcile,
    );

    unmount();
  });

  test("advances one-event EOF reconnects through the four-second cap", async () => {
    let connectionCount = 0;
    vi.mocked(getTaskRunPanel).mockResolvedValue({ items: [], serverTime: "now" });
    vi.mocked(streamTaskRunProgress).mockImplementation(async (onEvent) => {
      connectionCount += 1;
      await onEvent(progressEvent(connectionCount, {
        runId: "99999999-9999-4999-8999-999999999999",
        totalCount: null,
      }));
      return { type: "retryable", reason: "eof" };
    });
    const { unmount } = render(<Probe />);
    await act(async () => undefined);
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(1);

    for (const delay of [250, 500, 1000, 2000, 4000, 4000]) {
      const callsBeforeDelay = vi.mocked(streamTaskRunProgress).mock.calls.length;
      await act(async () => vi.advanceTimersByTime(delay - 1));
      expect(streamTaskRunProgress).toHaveBeenCalledTimes(callsBeforeDelay);
      await act(async () => vi.advanceTimersByTime(1));
      expect(streamTaskRunProgress).toHaveBeenCalledTimes(callsBeforeDelay + 1);
      await act(async () => undefined);
    }
    unmount();
  });

  test("resets reconnect backoff after a connection stays open for thirty seconds", async () => {
    let resolveStable!: (value: { type: "retryable"; reason: "eof" }) => void;
    const stableConnection = new Promise<{ type: "retryable"; reason: "eof" }>(
      (resolve) => {
        resolveStable = resolve;
      },
    );
    vi.mocked(getTaskRunPanel).mockResolvedValue({ items: [], serverTime: "now" });
    vi.mocked(streamTaskRunProgress)
      .mockResolvedValueOnce({ type: "retryable", reason: "eof" })
      .mockReturnValueOnce(stableConnection)
      .mockReturnValue(new Promise(() => undefined));
    const { unmount } = render(<Probe />);
    await act(async () => undefined);

    await act(async () => vi.advanceTimersByTime(250));
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTime(30_000));
    resolveStable({ type: "retryable", reason: "eof" });
    await act(async () => undefined);

    await act(async () => vi.advanceTimersByTime(249));
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTime(1));
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(3);
    unmount();
  });

  test.each([
    { type: "terminal", reason: "unauthorized", status: 401 } as const,
    { type: "terminal", reason: "forbidden", status: 403 } as const,
  ])("suppresses reconnect after $status", async (outcome) => {
    vi.mocked(getTaskRunPanel).mockResolvedValue({ items: [], serverTime: "now" });
    vi.mocked(streamTaskRunProgress).mockResolvedValue(outcome);
    const { unmount } = render(<Probe />);

    await act(async () => undefined);
    await act(async () => vi.advanceTimersByTime(10_000));
    expect(streamTaskRunProgress).toHaveBeenCalledTimes(1);

    unmount();
  });

  test("cleanup aborts stream and panel work and clears retry and render-yield timers", async () => {
    let onProgress!: (event: TaskRunProgressEvent) => void | Promise<void>;
    let resolveStream!: (value: { type: "retryable"; reason: "eof" }) => void;
    const stream = new Promise<{ type: "retryable"; reason: "eof" }>((resolve) => {
      resolveStream = resolve;
    });
    const runId = "11111111-1111-4111-8111-111111111111";
    vi.mocked(getTaskRunPanel).mockResolvedValue({
      items: [contentRun(runId)], serverTime: "now",
    });
    vi.mocked(streamTaskRunProgress).mockImplementation((onEvent) => {
      onProgress = onEvent;
      return stream;
    });
    const { unmount } = render(<DualProgressProbe />);
    await act(async () => undefined);
    const streamSignal = vi.mocked(streamTaskRunProgress).mock.calls[0][1];
    const panelSignal = vi.mocked(getTaskRunPanel).mock.calls[0][0];
    const liveUpdate = onProgress(progressEvent(1));
    await act(async () => undefined);
    resolveStream({ type: "retryable", reason: "eof" });
    await act(async () => undefined);

    unmount();
    await liveUpdate;
    expect(streamSignal.aborted).toBe(true);
    expect(panelSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
