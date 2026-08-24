import type {
  TaskRun,
  TaskRunStatus,
  TaskType,
} from "../../entities/task-run";
import type { StatusPillProps } from "../../components/ui/StatusPill";

export const TASK_LABELS: Record<TaskType, string> = {
  CREATOR_SYNC: "크리에이터 동기화",
  CONTENT_SYNC: "콘텐츠 동기화",
  APPLICATION_REPORT_GENERATION: "지원자 리포트 생성",
  CONTENT_REPORT_GENERATION: "콘텐츠 리포트 생성",
  SETTLEMENT_CALCULATION: "정산 계산",
  KAKAO_MESSAGE_SEND: "카카오 메시지 발송",
  PROPOSAL_EMAIL_SEND: "제안 이메일 발송",
};

export const STATUS_LABELS: Record<TaskRunStatus, string> = {
  QUEUED: "대기 중",
  RUNNING: "진행 중",
  SUCCEEDED: "완료",
  PARTIAL_FAILED: "부분 실패",
  FAILED: "실패",
  STALE: "상태 확인 필요",
};

export const STATUS_TONES: Record<
  TaskRunStatus,
  NonNullable<StatusPillProps["tone"]>
> = {
  QUEUED: "pending",
  RUNNING: "approved",
  SUCCEEDED: "approved",
  PARTIAL_FAILED: "pending",
  FAILED: "danger",
  STALE: "neutral",
};

export const STEP_LABELS: Record<string, string> = {
  APPLICATION_REPORT_GENERATION: "지원자 리포트 생성 중",
  ESTIMATE: "예상 정산 계산 중",
  FINALIZE: "정산 확정 중",
  INSTAGRAM_CREATOR_SYNC: "Instagram 크리에이터 동기화 중",
  KAKAO_MESSAGE_RESEND: "카카오 메시지 재발송 중",
  NEW_CONTENT_SYNC: "신규 콘텐츠 수집 중",
  PROPOSAL_EMAIL_SEND: "제안 이메일 발송 중",
  RECALCULATE: "정산 재계산 중",
  STALE_CONTENT_INSPECTION: "콘텐츠 리포트 생성 중",
  STORED_CONTENT_SYNC: "기존 콘텐츠 변경 확인 중",
  YOUTUBE_CREATOR_SYNC: "YouTube 크리에이터 동기화 중",
};

export function triggerLabel(run: TaskRun) {
  if (run.triggerType === "SCHEDULED") return "자동 실행";
  const administratorName = run.startedBy?.name?.trim();
  return administratorName ? `${administratorName} 실행` : "관리자 실행";
}

export function determinateProgress(run: TaskRun) {
  if (run.totalCount == null || run.totalCount <= 0) return null;

  const value = Math.min(Math.max(run.processedCount, 0), run.totalCount);
  const percentage = Math.min(
    Math.max(Math.round((run.processedCount / run.totalCount) * 100), 0),
    100,
  );

  return { percentage, value };
}

export function isActiveTaskRun(run: TaskRun) {
  return run.status === "QUEUED" || run.status === "RUNNING";
}

export function terminalSummary(run: TaskRun) {
  const progressMessage = run.progressMessage?.trim();
  if (progressMessage) return progressMessage;

  if (run.totalCount == null) {
    switch (run.status) {
      case "SUCCEEDED":
        return "작업을 완료했습니다";
      case "PARTIAL_FAILED":
        return "일부 작업을 완료하지 못했습니다";
      case "FAILED":
        return "작업을 완료하지 못했습니다";
      case "STALE":
        return "최신 상태를 확인할 수 없습니다";
      default:
        return null;
    }
  }

  switch (run.status) {
    case "SUCCEEDED":
      return `${run.succeededCount}건 작업을 완료했습니다`;
    case "PARTIAL_FAILED":
      return `${run.succeededCount}건 완료 · ${run.failedCount}건 실패`;
    case "FAILED":
      return run.failedCount > 0
        ? `${run.failedCount}건 처리에 실패했습니다`
        : "작업을 완료하지 못했습니다";
    case "STALE":
      return "최신 상태를 확인할 수 없습니다";
    default:
      return null;
  }
}
