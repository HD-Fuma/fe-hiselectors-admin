import { useEffect, useState } from "react";
import {
  getTaskRunPanel,
  streamTaskRunProgress,
  type TaskRun,
  type TaskRunProgressEvent,
} from "../../entities/task-run";

interface PanelState {
  readonly enabled: boolean;
  readonly generation: number;
  readonly runs: readonly TaskRun[];
}

interface UseTaskRunPanelOptions {
  enabled?: boolean;
}

const ACTIVE_STATUSES = new Set(["QUEUED", "RUNNING"]);
const BUFFER_CAPACITY = 1024;
const EARLY_BUFFER_KEY_CAPACITY = 256;
const RENDER_YIELD_MS = 16;
const RETRY_BASE_MS = 250;
const RETRY_MAX_MS = 4000;
const STABLE_CONNECTION_MS = 30_000;
const CONTENT_SYNC_STEPS = ["NEW_CONTENT_SYNC", "STORED_CONTENT_SYNC"] as const;

function progressKey(runId: string, stepKey: string) {
  return `${runId}:${stepKey}`;
}

export function useTaskRunPanel({ enabled = true }: UseTaskRunPanelOptions = {}) {
  const [state, setState] = useState<PanelState>({ enabled, generation: 0, runs: [] });
  const isTransitionRender = state.enabled !== enabled;
  const generation = isTransitionRender ? state.generation + 1 : state.generation;

  if (isTransitionRender) setState({ enabled, generation, runs: [] });

  useEffect(() => {
    if (!enabled || isTransitionRender) return;

    const controller = new AbortController();
    let pollTimeout: number | undefined;
    let retryTimeout: number | undefined;
    let stopped = false;
    let publishedRuns: readonly TaskRun[] = [];
    const yieldTimers = new Map<number, () => void>();
    const bufferedEvents = new Map<string, TaskRunProgressEvent[]>();
    const progressFloors = new Map<string, TaskRunProgressEvent>();
    const terminalRuns = new Map<string, TaskRun>();
    let progressQueue = Promise.resolve();
    let overflowReconciliation: Promise<void> | undefined;
    let panelRequestSequence = 0;
    let latestPanelSequence = 0;
    let retryAttempt = 0;

    const publishRuns = (runs: readonly TaskRun[]) => {
      if (stopped) return;
      publishedRuns = runs;
      setState((current) => (
        current.enabled && current.generation === generation
          ? { ...current, runs }
          : current
      ));
    };

    const renderYield = () => new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => {
        yieldTimers.delete(timer);
        resolve();
      }, RENDER_YIELD_MS);
      yieldTimers.set(timer, resolve);
    });

    const bufferProgress = (event: TaskRunProgressEvent) => {
      const key = progressKey(event.runId, event.stepKey);
      let events = bufferedEvents.get(key);
      if (!events) {
        if (bufferedEvents.size >= EARLY_BUFFER_KEY_CAPACITY) {
          const oldestKey = bufferedEvents.keys().next().value;
          if (oldestKey !== undefined) bufferedEvents.delete(oldestKey);
          reconcileOverflow();
        }
        events = [];
      }
      if (events.length >= BUFFER_CAPACITY) {
        events.shift();
        reconcileOverflow();
      }
      events.push(event);
      bufferedEvents.set(key, events);
    };

    const applyProgress = async (event: TaskRunProgressEvent) => {
      if (stopped) return;
      const index = publishedRuns.findIndex((run) => run.runId === event.runId);
      if (index === -1) {
        bufferProgress(event);
        return;
      }
      const run = publishedRuns[index];
      if (
        run.taskType !== "CONTENT_SYNC"
        || !ACTIVE_STATUSES.has(run.status)
      ) return;
      const key = progressKey(event.runId, event.stepKey);
      const previousFloor = progressFloors.get(key);
      if (previousFloor && event.processedCount < previousFloor.processedCount) return;
      progressFloors.set(key, event);
      const nextRuns = [...publishedRuns];
      nextRuns[index] = {
        ...run,
        stepProgress: {
          ...run.stepProgress,
          [event.stepKey]: {
            totalCount: event.totalCount,
            processedCount: event.processedCount,
          },
        },
      };
      publishRuns(nextRuns);
      await renderYield();
    };

    const enqueueProgressWork = (work: () => Promise<void>) => {
      const result = progressQueue.then(work);
      progressQueue = result.catch(() => undefined);
      return result;
    };

    const replayBufferedProgress = async () => {
      const replay: TaskRunProgressEvent[] = [];
      publishedRuns.forEach((run) => {
        CONTENT_SYNC_STEPS.forEach((stepKey) => {
          const key = progressKey(run.runId, stepKey);
          const events = bufferedEvents.get(key);
          if (!events?.length) return;
          bufferedEvents.delete(key);
          replay.push(...events);
        });
      });
      if (replay.length === 0) return;
      await enqueueProgressWork(async () => {
        for (const event of replay) await applyProgress(event);
      });
    };

    const rememberTerminalRun = (run: TaskRun) => {
      terminalRuns.set(run.runId, run);
      if (run.taskType === "CONTENT_SYNC") {
        CONTENT_SYNC_STEPS.forEach((stepKey) => {
          const key = progressKey(run.runId, stepKey);
          progressFloors.delete(key);
          bufferedEvents.delete(key);
        });
      }
    };

    const mergePanelItems = (items: readonly TaskRun[]) => items.map((run) => {
      const terminalRun = terminalRuns.get(run.runId);
      if (terminalRun && ACTIVE_STATUSES.has(run.status)) return terminalRun;
      if (!ACTIVE_STATUSES.has(run.status)) {
        rememberTerminalRun(run);
        return run;
      }
      if (run.taskType !== "CONTENT_SYNC") return run;

      let stepProgress = run.stepProgress;
      CONTENT_SYNC_STEPS.forEach((stepKey) => {
        const key = progressKey(run.runId, stepKey);
        const floor = progressFloors.get(key);
        const polled = stepProgress?.[stepKey];
        if (!floor) return;
        if (polled && polled.processedCount >= floor.processedCount) {
          progressFloors.set(key, {
            runId: run.runId,
            stepKey,
            totalCount: polled.totalCount,
            processedCount: polled.processedCount,
          });
          return;
        }
        stepProgress = {
          ...stepProgress,
          [stepKey]: {
            totalCount: floor.totalCount,
            processedCount: floor.processedCount,
          },
        };
      });
      return stepProgress === run.stepProgress ? run : { ...run, stepProgress };
    });

    const prunePanelMemory = (items: readonly TaskRun[]) => {
      const panelRuns = new Map(items.map((run) => [run.runId, run] as const));
      progressFloors.forEach((event, key) => {
        const run = panelRuns.get(event.runId);
        if (
          !run
          || run.taskType !== "CONTENT_SYNC"
          || !ACTIVE_STATUSES.has(run.status)
        ) progressFloors.delete(key);
      });
      terminalRuns.forEach((_run, runId) => {
        if (!panelRuns.has(runId)) terminalRuns.delete(runId);
      });
      bufferedEvents.forEach((events, key) => {
        const run = events[0] ? panelRuns.get(events[0].runId) : undefined;
        if (
          run
          && (
            run.taskType !== "CONTENT_SYNC"
            || !ACTIVE_STATUSES.has(run.status)
          )
        ) bufferedEvents.delete(key);
      });
    };

    const fetchAndPublishPanel = async () => {
      const requestSequence = ++panelRequestSequence;
      try {
        const panel = await getTaskRunPanel(controller.signal);
        if (stopped) return;
        if (requestSequence < latestPanelSequence) {
          const terminalById = new Map(
            panel.items
              .filter((run) => !ACTIVE_STATUSES.has(run.status))
              .map((run) => [run.runId, run] as const),
          );
          if (terminalById.size > 0) {
            terminalById.forEach(rememberTerminalRun);
            let changed = false;
            const nextRuns = publishedRuns.map((run) => {
              const terminalRun = terminalById.get(run.runId);
              if (!terminalRun) return run;
              changed = true;
              return terminalRun;
            });
            if (changed) publishRuns(nextRuns);
          }
          return;
        }
        latestPanelSequence = requestSequence;
        const nextRuns = mergePanelItems(panel.items);
        prunePanelMemory(panel.items);
        publishRuns(nextRuns);
        void replayBufferedProgress();
      } catch {
        if (controller.signal.aborted) return;
      }
    };

    async function reconcilePanel() {
      await fetchAndPublishPanel();
    }

    function reconcileOverflow() {
      if (overflowReconciliation) return;
      const reconciliation = reconcilePanel();
      overflowReconciliation = reconciliation;
      void reconciliation.then(() => {
        if (overflowReconciliation === reconciliation) {
          overflowReconciliation = undefined;
        }
      });
    }

    const poll = async () => {
      await fetchAndPublishPanel();
      if (!stopped) pollTimeout = window.setTimeout(poll, 1000);
    };

    const connectStream = async () => {
      const connectionStartedAt = Date.now();
      let outcome;
      try {
        outcome = await streamTaskRunProgress(
          (event) => enqueueProgressWork(() => applyProgress(event)),
          controller.signal,
        );
      } catch {
        outcome = { type: "retryable" as const, reason: "network" as const };
      }
      if (stopped || outcome.type === "terminal") return;
      const wasStable = Date.now() - connectionStartedAt >= STABLE_CONNECTION_MS;
      await reconcilePanel();
      if (stopped) return;
      if (wasStable) retryAttempt = 0;
      const retryDelay = Math.min(
        RETRY_BASE_MS * (2 ** retryAttempt),
        RETRY_MAX_MS,
      );
      retryAttempt = Math.min(retryAttempt + 1, 16);
      retryTimeout = window.setTimeout(() => {
        retryTimeout = undefined;
        void connectStream();
      }, retryDelay);
    };

    void connectStream();
    void poll();
    return () => {
      stopped = true;
      controller.abort();
      if (pollTimeout !== undefined) window.clearTimeout(pollTimeout);
      if (retryTimeout !== undefined) window.clearTimeout(retryTimeout);
      yieldTimers.forEach((resolve, timer) => {
        window.clearTimeout(timer);
        resolve();
      });
      yieldTimers.clear();
    };
  }, [enabled, generation, isTransitionRender]);

  return enabled && !isTransitionRender ? state.runs : [];
}
