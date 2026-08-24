import type { TaskRun } from "../../entities/task-run";

export const MIXED_TASK_RUN_PREVIEW: readonly TaskRun[] = [
  {
    runId: "preview-kakao-failed",
    taskType: "KAKAO_MESSAGE_SEND",
    triggerType: "ADMIN_TRIGGERED",
    status: "FAILED",
    currentStep: null,
    progressMessage: null,
    totalCount: 120,
    processedCount: 120,
    succeededCount: 0,
    failedCount: 120,
    skippedCount: 0,
    progressPercent: 100,
    startedBy: { adminId: 1, name: "김관리자" },
    startedAt: "2026-08-23T00:00:00Z",
    finishedAt: "2026-08-23T00:01:00Z",
  },
  {
    runId: "preview-creator-running",
    taskType: "CREATOR_SYNC",
    triggerType: "ADMIN_TRIGGERED",
    status: "RUNNING",
    currentStep: "프로필 정보를 동기화하는 중",
    progressMessage: null,
    totalCount: 120,
    processedCount: 84,
    succeededCount: 84,
    failedCount: 0,
    skippedCount: 0,
    progressPercent: 70,
    startedBy: { adminId: 1, name: "김관리자" },
    startedAt: "2026-08-23T00:00:00Z",
    finishedAt: null,
  },
  {
    runId: "preview-report-running",
    taskType: "APPLICATION_REPORT_GENERATION",
    triggerType: "SCHEDULED",
    status: "RUNNING",
    currentStep: "지원자 분석 결과를 생성하는 중",
    progressMessage: null,
    totalCount: null,
    processedCount: 12,
    succeededCount: 12,
    failedCount: 0,
    skippedCount: 0,
    progressPercent: null,
    startedBy: null,
    startedAt: "2026-08-23T00:00:00Z",
    finishedAt: null,
  },
  {
    runId: "preview-email-partial",
    taskType: "PROPOSAL_EMAIL_SEND",
    triggerType: "SCHEDULED",
    status: "PARTIAL_FAILED",
    currentStep: null,
    progressMessage: null,
    totalCount: 120,
    processedCount: 120,
    succeededCount: 117,
    failedCount: 3,
    skippedCount: 0,
    progressPercent: 100,
    startedBy: null,
    startedAt: "2026-08-23T00:00:00Z",
    finishedAt: "2026-08-23T00:01:00Z",
  },
  {
    runId: "preview-content-succeeded",
    taskType: "CONTENT_SYNC",
    triggerType: "SCHEDULED",
    status: "SUCCEEDED",
    currentStep: null,
    progressMessage: null,
    totalCount: 248,
    processedCount: 248,
    succeededCount: 248,
    failedCount: 0,
    skippedCount: 0,
    progressPercent: 100,
    startedBy: null,
    startedAt: "2026-08-23T00:00:00Z",
    finishedAt: "2026-08-23T00:01:00Z",
  },
];

export function resolveTaskRunPreview(
  pathname: string,
  search: string,
  isDevelopment: boolean,
): readonly TaskRun[] | null {
  if (
    !isDevelopment ||
    pathname !== "/creators" ||
    new URLSearchParams(search).get("taskRunPreview") !== "mixed"
  ) {
    return null;
  }

  return MIXED_TASK_RUN_PREVIEW;
}
