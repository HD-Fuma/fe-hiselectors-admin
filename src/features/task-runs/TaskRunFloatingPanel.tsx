import { ChevronDown, X } from "lucide-react";
import { useRef, useState } from "react";
import type { TaskRun } from "../../entities/task-run";
import { TaskRunCard } from "./TaskRunCard";
import { isActiveTaskRun, TASK_LABELS } from "./taskRunPresentation";
import type { TaskRunDismissOrigin, WheelSession } from "./useTaskRunDismiss";
import "../../styles/task-floating-panel.css";

interface TaskRunFloatingPanelProps {
  fallbackFocusId?: string;
  runs: readonly TaskRun[];
}

const TASK_RUN_LIST_VIEWPORT_ID = "task-run-list-viewport";

export function TaskRunFloatingPanel({
  fallbackFocusId = "admin-main-content",
  runs,
}: TaskRunFloatingPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [dismissedRunIds, setDismissedRunIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [announcement, setAnnouncement] = useState("");
  const closeButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const collapseButtonRef = useRef<HTMLButtonElement>(null);
  const acceptedRunIdsRef = useRef(new Set<string>());
  const wheelSessionRef = useRef<WheelSession>({
    cooldownUntil: 0,
    ownerRunId: null,
  });
  const visibleRuns = runs.filter((run) => !dismissedRunIds.has(run.runId));

  const focusFallback = () => {
    document.getElementById(fallbackFocusId)?.focus();
  };

  const availableCloseButton = (runId: string) => {
    if (acceptedRunIdsRef.current.has(runId)) return undefined;
    const closeButton = closeButtonRefs.current.get(runId);
    const track = closeButton?.closest<HTMLElement>(".fuma-task-run-track");
    if (
      !closeButton?.isConnected ||
      !track ||
      track.getAttribute("aria-hidden") === "true" ||
      track.hasAttribute("inert")
    ) {
      return undefined;
    }
    return closeButton;
  };

  const acceptDismiss = (run: TaskRun, origin: TaskRunDismissOrigin) => {
    const taskLabel = TASK_LABELS[run.taskType];
    const currentTrack = closeButtonRefs.current
      .get(run.runId)
      ?.closest<HTMLElement>(".fuma-task-run-track");
    const focusWasInside = currentTrack?.contains(document.activeElement) ?? false;
    const terminalRuns = visibleRuns.filter((item) => !isActiveTaskRun(item));
    const terminalIndex = terminalRuns.findIndex((item) => item.runId === run.runId);

    acceptedRunIdsRef.current.add(run.runId);
    setAnnouncement(`${taskLabel} 기록을 닫았습니다`);

    if (origin !== "keyboard" && !focusWasInside) return;

    const remainingVisualRuns = visibleRuns.filter(
      (item) => !acceptedRunIdsRef.current.has(item.runId),
    );
    if (remainingVisualRuns.length === 0) {
      focusFallback();
      return;
    }

    const nextFocusTarget = terminalRuns
      .slice(terminalIndex + 1)
      .map((item) => availableCloseButton(item.runId))
      .find(Boolean);
    const previousFocusTarget = terminalRuns
      .slice(0, terminalIndex)
      .reverse()
      .map((item) => availableCloseButton(item.runId))
      .find(Boolean);

    if (nextFocusTarget) {
      nextFocusTarget.focus();
    } else if (previousFocusTarget) {
      previousFocusTarget.focus();
    } else if (collapseButtonRef.current) {
      collapseButtonRef.current.focus();
    } else {
      focusFallback();
    }
  };

  const completeDismiss = (runId: string) => {
    acceptedRunIdsRef.current.delete(runId);
    setDismissedRunIds((current) => {
      const next = new Set(current);
      next.add(runId);
      return next;
    });
  };

  const closePanel = () => {
    const ids = visibleRuns.map((run) => run.runId);
    if (ids.length === 0) return;
    ids.forEach((id) => acceptedRunIdsRef.current.delete(id));
    setDismissedRunIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setExpanded(true);
    setAnnouncement("작업 진행상황을 닫았습니다");
    focusFallback();
  };

  return (
    <>
      <span
        aria-live="polite"
        className="hsas-visually-hidden"
        data-testid="task-run-announcement"
      >
        {announcement}
      </span>
      {visibleRuns.length > 0 && (
        <section
          aria-labelledby="task-run-floating-panel-title"
          className="fuma-task-run-panel"
          data-expanded={expanded}
        >
          <header className="fuma-task-run-panel__header">
            <h2
              className="fuma-task-run-panel__title"
              id="task-run-floating-panel-title"
            >
              작업 진행상황
            </h2>
            <span className="fuma-task-run-panel__count">
              {visibleRuns.length}개
            </span>
            <div className="fuma-task-run-panel__controls">
              <button
                aria-controls={TASK_RUN_LIST_VIEWPORT_ID}
                aria-expanded={expanded}
                aria-label={expanded ? "작업 패널 접기" : "작업 패널 펼치기"}
                className="fuma-task-run-panel__collapse"
                onClick={() => setExpanded((current) => !current)}
                ref={collapseButtonRef}
                type="button"
              >
                <ChevronDown aria-hidden="true" />
              </button>
              <button
                aria-label="작업 진행상황 닫기"
                className="fuma-task-run-panel__close"
                onClick={closePanel}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </div>
          </header>

          <div
            aria-hidden={expanded ? undefined : "true"}
            className="fuma-task-run-panel__list-viewport"
            data-testid="task-run-list-viewport"
            id={TASK_RUN_LIST_VIEWPORT_ID}
            inert={expanded ? undefined : true}
          >
            <div>
              <ul className="fuma-task-run-panel__list">
                {visibleRuns.map((run) => (
                  <TaskRunCard
                    closeButtonRef={(node) => {
                      if (node) closeButtonRefs.current.set(run.runId, node);
                      else closeButtonRefs.current.delete(run.runId);
                    }}
                    expanded={expanded}
                    key={run.runId}
                    onDismissAccepted={(origin) => acceptDismiss(run, origin)}
                    onDismissComplete={() => completeDismiss(run.runId)}
                    run={run}
                    wheelSessionRef={wheelSessionRef}
                  />
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
