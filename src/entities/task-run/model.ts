export type TaskType =
  | "CREATOR_SYNC"
  | "CONTENT_SYNC"
  | "APPLICATION_REPORT_GENERATION"
  | "CONTENT_REPORT_GENERATION"
  | "SETTLEMENT_CALCULATION"
  | "KAKAO_MESSAGE_SEND"
  | "PROPOSAL_EMAIL_SEND";

export type TaskRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "PARTIAL_FAILED"
  | "FAILED"
  | "STALE";

export type TriggerType = "ADMIN_TRIGGERED" | "SCHEDULED";

export interface TaskRun {
  readonly runId: string;
  readonly taskType: TaskType;
  readonly triggerType: TriggerType;
  readonly status: TaskRunStatus;
  readonly currentStep: string | null;
  readonly totalCount: number | null;
  readonly processedCount: number;
  readonly succeededCount: number;
  readonly failedCount: number;
  readonly skippedCount: number;
  readonly progressPercent: number | null;
  readonly startedBy: { readonly adminId: number; readonly name: string } | null;
}

export interface TaskRunPanel {
  readonly items: readonly TaskRun[];
  readonly serverTime: string;
}
