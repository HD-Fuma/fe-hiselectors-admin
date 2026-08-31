export type TaskType =
  | "CREATOR_SYNC"
  | "CONTENT_SYNC"
  | "APPLICATION_REPORT_GENERATION"
  | "CONTENT_REPORT_GENERATION"
  | "SETTLEMENT_CALCULATION"
  | "KAKAO_MESSAGE_SEND"
  | "PROPOSAL_EMAIL_SEND"
  | "SELECTOR_PROPOSAL_EMAIL_SEND";

export type TaskRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "PARTIAL_FAILED"
  | "FAILED"
  | "STALE";

export type TriggerType = "ADMIN_TRIGGERED" | "SCHEDULED";

export interface TaskStepProgress {
  readonly totalCount: number | null;
  readonly processedCount: number;
}

export type TaskRunProgressStepKey = "NEW_CONTENT_SYNC" | "STORED_CONTENT_SYNC";

export interface TaskRunProgressEvent {
  readonly runId: string;
  readonly stepKey: TaskRunProgressStepKey;
  readonly totalCount: number | null;
  readonly processedCount: number;
}

export type TaskRunProgressStreamOutcome =
  | {
    readonly type: "retryable";
    readonly reason: "eof" | "http" | "content-type" | "missing-body" | "network";
    readonly status?: number;
  }
  | {
    readonly type: "terminal";
    readonly reason: "aborted" | "unauthorized" | "forbidden";
    readonly status?: 401 | 403;
  };

export interface TaskRun {
  readonly runId: string;
  readonly taskType: TaskType;
  readonly triggerType: TriggerType;
  readonly status: TaskRunStatus;
  readonly currentStep: string | null;
  readonly progressMessage: string | null;
  readonly stepProgress?: Readonly<Record<string, TaskStepProgress>> | null;
  readonly totalCount: number | null;
  readonly processedCount: number;
  readonly succeededCount: number;
  readonly failedCount: number;
  readonly skippedCount: number;
  readonly progressPercent: number | null;
  readonly startedBy: { readonly adminId: number; readonly name: string | null } | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
}

export interface TaskRunPanel {
  readonly items: readonly TaskRun[];
  readonly serverTime: string;
}

export interface SpringPage<T> {
  readonly content: T[];
  readonly number: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}
