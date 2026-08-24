import { useEffect, useState } from "react";
import { getTaskRunPanel, type TaskRun } from "../../entities/task-run";

interface PanelState {
  readonly enabled: boolean;
  readonly generation: number;
  readonly runs: readonly TaskRun[];
}

interface UseTaskRunPanelOptions {
  enabled?: boolean;
}

export function useTaskRunPanel({ enabled = true }: UseTaskRunPanelOptions = {}) {
  const [state, setState] = useState<PanelState>({ enabled, generation: 0, runs: [] });
  const isTransitionRender = state.enabled !== enabled;
  const generation = isTransitionRender ? state.generation + 1 : state.generation;

  if (isTransitionRender) setState({ enabled, generation, runs: [] });

  useEffect(() => {
    if (!enabled || isTransitionRender) return;

    const controller = new AbortController();
    let timeout: number | undefined;
    let stopped = false;

    const poll = async () => {
      try {
        const panel = await getTaskRunPanel(controller.signal);
        if (!stopped) {
          setState((current) => (
            current.enabled && current.generation === generation
              ? { ...current, runs: panel.items }
              : current
          ));
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (!stopped) timeout = window.setTimeout(poll, 2000);
    };

    void poll();
    return () => {
      stopped = true;
      controller.abort();
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [enabled, generation, isTransitionRender]);

  return enabled && !isTransitionRender ? state.runs : [];
}
