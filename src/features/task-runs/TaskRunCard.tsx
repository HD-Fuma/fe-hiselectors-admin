import { Check, TriangleAlert, X } from "lucide-react";
import type { MutableRefObject, RefCallback } from "react";
import type { TaskRun } from "../../entities/task-run";
import { StatusPill } from "../../components/ui/StatusPill";
import {
  determinateProgress,
  isActiveTaskRun,
  STATUS_LABELS,
  STATUS_TONES,
  STEP_LABELS,
  TASK_LABELS,
  terminalSummary,
  triggerLabel,
} from "./taskRunPresentation";
import {
  useTaskRunDismiss,
  type TaskRunDismissOrigin,
  type WheelSession,
} from "./useTaskRunDismiss";

interface TaskRunCardProps {
  closeButtonRef?: RefCallback<HTMLButtonElement>;
  expanded: boolean;
  onDismissAccepted: (origin: TaskRunDismissOrigin) => void;
  onDismissComplete: () => void;
  run: TaskRun;
  wheelSessionRef: MutableRefObject<WheelSession>;
}

function TerminalTaskRunIcon({ run }: { run: TaskRun }) {
  switch (run.status) {
    case "SUCCEEDED":
      return <Check aria-hidden="true" data-task-run-icon="succeeded" />;
    case "FAILED":
      return <X aria-hidden="true" data-task-run-icon="failed" />;
    case "PARTIAL_FAILED":
      return <TriangleAlert aria-hidden="true" data-task-run-icon="partial-failed" />;
    case "STALE":
      return <TriangleAlert aria-hidden="true" data-task-run-icon="stale" />;
    default:
      return null;
  }
}

function ActiveTaskRunContent({ run }: { run: TaskRun }) {
  const taskLabel = TASK_LABELS[run.taskType];
  const creatorSync = run.taskType === "CREATOR_SYNC";
  const progressMessage = creatorSync ? run.progressMessage : null;
  const progress = creatorSync ? null : determinateProgress(run);
  const showsIndeterminateProgress = progress == null && progressMessage == null;

  return (
    <>
      <div className="fuma-task-run-card__header">
        <h3 className="fuma-task-run-card__title">{taskLabel}</h3>
        <StatusPill
          className="fuma-task-run-card__status"
          tone={STATUS_TONES[run.status]}
        >
          {STATUS_LABELS[run.status]}
        </StatusPill>
      </div>

      {run.currentStep && (
        <p className="fuma-task-run-card__step">
          {STEP_LABELS[run.currentStep] ?? run.currentStep}
        </p>
      )}

      {progressMessage != null ? (
        <p
          aria-live="polite"
          className="fuma-task-run-card__step"
          role="status"
        >
          {progressMessage}
        </p>
      ) : progress ? (
        <div className="fuma-task-run-card__progress">
          <span>{run.processedCount} / {run.totalCount}</span>
          <strong>{progress.percentage}%</strong>
          <progress
            aria-label={`${taskLabel} 진행률`}
            max={run.totalCount ?? undefined}
            value={progress.value}
          />
        </div>
      ) : showsIndeterminateProgress ? (
        <div
          aria-label="진행 상황 확인 중"
          aria-live="polite"
          className="fuma-task-run-card__indeterminate"
          role="status"
        >
          <span
            aria-hidden="true"
            className="fuma-task-run-card__loading-dot"
          />
          진행 상황 확인 중
        </div>
      ) : null}

      <div className="fuma-task-run-card__meta">
        <span>{triggerLabel(run)}</span>
        {!creatorSync && run.totalCount != null && run.failedCount > 0 && (
          <strong className="fuma-task-run-card__failure">
            {run.failedCount}건 실패
          </strong>
        )}
      </div>
    </>
  );
}

function TerminalTaskRunContent({
  closeButtonRef,
  onDismiss,
  run,
}: Pick<TaskRunCardProps, "closeButtonRef" | "run"> & { onDismiss: () => void }) {
  const taskLabel = TASK_LABELS[run.taskType];

  return (
    <div className="fuma-task-run-card__terminal">
      <TerminalTaskRunIcon run={run} />
      <div className="fuma-task-run-card__terminal-content">
        <div className="fuma-task-run-card__header">
          <h3 className="fuma-task-run-card__title">{taskLabel}</h3>
          <StatusPill
            className="fuma-task-run-card__status"
            tone={STATUS_TONES[run.status]}
          >
            {STATUS_LABELS[run.status]}
          </StatusPill>
        </div>
        <div className="fuma-task-run-card__terminal-footer">
          <p className="fuma-task-run-card__summary">{terminalSummary(run)}</p>
          <button
            aria-label={`${taskLabel} 기록 닫기`}
            className="hsas-visually-hidden fuma-task-run-card__accessible-dismiss"
            onClick={onDismiss}
            ref={closeButtonRef}
            type="button"
          >
            기록 닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export function TaskRunCard({
  closeButtonRef,
  expanded,
  onDismissAccepted,
  onDismissComplete,
  run,
  wheelSessionRef,
}: TaskRunCardProps) {
  const active = isActiveTaskRun(run);
  const { dismissFromKeyboard, trackProps, trackRef } = useTaskRunDismiss({
    enabled: !active,
    expanded,
    onDismissAccepted,
    onDismissComplete,
    runId: run.runId,
    wheelSessionRef,
  });
  const content = active ? (
    <ActiveTaskRunContent run={run} />
  ) : (
    <TerminalTaskRunContent
      closeButtonRef={closeButtonRef}
      onDismiss={dismissFromKeyboard}
      run={run}
    />
  );
  const card = <article className="fuma-task-run-card">{content}</article>;

  return (
    <li
      {...trackProps}
      className="fuma-task-run-track"
      data-run-id={run.runId}
      ref={trackRef}
    >
      <div className="fuma-task-run-card-surface">{card}</div>
    </li>
  );
}
