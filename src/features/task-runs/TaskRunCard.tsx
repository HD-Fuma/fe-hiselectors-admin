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

interface ContentProgressRowProps {
  ariaLabel: string;
  label: string;
  max: number;
  percentage?: number;
  text: string;
  value?: number;
}

function ContentProgressRow({
  ariaLabel,
  label,
  max,
  percentage,
  text,
  value,
}: ContentProgressRowProps) {
  return (
    <div className="fuma-task-run-card__content-progress-row">
      <div className="fuma-task-run-card__content-progress-heading">
        <span>{label}</span>
        {percentage != null && <strong>{percentage}%</strong>}
      </div>
      <progress
        aria-label={ariaLabel}
        max={max}
        value={value}
      />
      <span className="fuma-task-run-card__content-progress-text">{text}</span>
    </div>
  );
}

function determinateContentProgress(
  processedCount: number,
  totalCount: number,
  emptyText = "0건 완료",
) {
  if (totalCount === 0) {
    return { max: 1, percentage: undefined, text: emptyText, value: 1 };
  }

  const value = Math.min(Math.max(processedCount, 0), totalCount);
  const percentage = Math.min(
    Math.max(Math.round((processedCount / totalCount) * 100), 0),
    100,
  );
  const text = processedCount === totalCount
    ? `${processedCount}건 완료`
    : `${processedCount} / ${totalCount}건`;
  return { max: totalCount, percentage, text, value };
}

function ContentSyncProgress({ run }: { run: TaskRun }) {
  const newProgress = run.stepProgress?.NEW_CONTENT_SYNC;
  const storedProgress = run.stepProgress?.STORED_CONTENT_SYNC;
  const hasCompleteProgress = newProgress != null && storedProgress != null;

  if (!hasCompleteProgress) {
    return (
      <div
        aria-label="콘텐츠 수집 진행 상황"
        aria-live="polite"
        className="fuma-task-run-card__content-progress"
        role="status"
      >
        <ContentProgressRow
          ariaLabel="신규 콘텐츠 수집 진행률"
          label="신규 콘텐츠 수집"
          max={1}
          text="진행 정보 확인 중"
        />
        <ContentProgressRow
          ariaLabel="기존 콘텐츠 수집 진행률"
          label="기존 콘텐츠 수집"
          max={1}
          text="진행 정보 확인 중"
        />
      </div>
    );
  }

  const newRow = newProgress.totalCount == null
    ? {
        max: 1,
        text: `${newProgress.processedCount}건 처리`,
      }
    : determinateContentProgress(
        newProgress.processedCount,
        newProgress.totalCount,
        "신규 콘텐츠 없음",
      );
  const storedWaiting = run.currentStep === "NEW_CONTENT_SYNC"
    && storedProgress.totalCount == null;
  const storedRow = storedWaiting
    ? { max: 1, text: "대기 중", value: 0 }
    : storedProgress.totalCount == null
      ? {
          max: 1,
          text: `${storedProgress.processedCount}건 처리`,
        }
      : determinateContentProgress(
          storedProgress.processedCount,
          storedProgress.totalCount,
        );

  return (
    <div
      aria-label="콘텐츠 수집 진행 상황"
      aria-live="polite"
      className="fuma-task-run-card__content-progress"
      role="status"
    >
      <ContentProgressRow
        ariaLabel="신규 콘텐츠 수집 진행률"
        label="신규 콘텐츠 수집"
        {...newRow}
      />
      <ContentProgressRow
        ariaLabel="기존 콘텐츠 수집 진행률"
        label="기존 콘텐츠 수집"
        {...storedRow}
      />
    </div>
  );
}

function ActiveTaskRunContent({ run }: { run: TaskRun }) {
  const taskLabel = TASK_LABELS[run.taskType];
  const isContentSync = run.taskType === "CONTENT_SYNC";
  const usesProgressMessage = run.taskType === "CREATOR_SYNC";
  const progressMessage = usesProgressMessage
    ? run.progressMessage?.trim() || null
    : null;
  const progress = usesProgressMessage ? null : determinateProgress(run);
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

      {!isContentSync && run.currentStep && (
        <p className="fuma-task-run-card__step">
          {STEP_LABELS[run.currentStep] ?? run.currentStep}
        </p>
      )}

      {isContentSync ? (
        <ContentSyncProgress run={run} />
      ) : progressMessage != null ? (
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
        {!isContentSync
          && !usesProgressMessage
          && run.totalCount != null
          && run.failedCount > 0 && (
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
