import type { TaskRun } from "../../entities/task-run";
import {
  MIXED_TASK_RUN_PREVIEW,
  resolveTaskRunPreview,
} from "./taskRunPreview";

describe("mixed task-run preview", () => {
  test("contains the five preview runs in the contracted order and statuses", () => {
    expect(MIXED_TASK_RUN_PREVIEW).toHaveLength(5);
    expect(MIXED_TASK_RUN_PREVIEW.map(({ runId }) => runId)).toEqual([
      "preview-kakao-failed",
      "preview-creator-running",
      "preview-report-running",
      "preview-email-partial",
      "preview-content-succeeded",
    ]);
    expect(MIXED_TASK_RUN_PREVIEW.map(({ status }) => status)).toEqual([
      "FAILED",
      "RUNNING",
      "RUNNING",
      "PARTIAL_FAILED",
      "SUCCEEDED",
    ]);
  });

  test("preserves determinate, indeterminate, partial, and success counts", () => {
    const [failedKakao, runningCreator, runningReport, partialEmail, succeededContent] =
      MIXED_TASK_RUN_PREVIEW;

    expect(failedKakao).toMatchObject<Partial<TaskRun>>({
      taskType: "KAKAO_MESSAGE_SEND",
      triggerType: "ADMIN_TRIGGERED",
      currentStep: null,
      totalCount: 120,
      processedCount: 120,
      succeededCount: 0,
      failedCount: 120,
      skippedCount: 0,
      progressPercent: 100,
      startedBy: { adminId: 1, name: "김관리자" },
    });
    expect(runningCreator).toMatchObject<Partial<TaskRun>>({
      taskType: "CREATOR_SYNC",
      currentStep: "프로필 정보를 동기화하는 중",
      totalCount: 120,
      processedCount: 84,
      succeededCount: 84,
      failedCount: 0,
      skippedCount: 0,
      progressPercent: 70,
      startedBy: { adminId: 1, name: "김관리자" },
    });
    expect(runningReport).toMatchObject<Partial<TaskRun>>({
      taskType: "APPLICATION_REPORT_GENERATION",
      triggerType: "SCHEDULED",
      currentStep: "지원자 분석 결과를 생성하는 중",
      totalCount: null,
      processedCount: 12,
      succeededCount: 12,
      failedCount: 0,
      skippedCount: 0,
      progressPercent: null,
      startedBy: null,
    });
    expect(partialEmail).toMatchObject<Partial<TaskRun>>({
      taskType: "PROPOSAL_EMAIL_SEND",
      totalCount: 120,
      processedCount: 120,
      succeededCount: 117,
      failedCount: 3,
      skippedCount: 0,
      progressPercent: 100,
      startedBy: null,
    });
    expect(succeededContent).toMatchObject<Partial<TaskRun>>({
      taskType: "CONTENT_SYNC",
      totalCount: 248,
      processedCount: 248,
      succeededCount: 248,
      failedCount: 0,
      skippedCount: 0,
      progressPercent: 100,
      startedBy: null,
    });
  });

  test("resolves only the mixed preview on the development creators route", () => {
    expect(resolveTaskRunPreview("/creators", "?taskRunPreview=mixed", true)).toBe(
      MIXED_TASK_RUN_PREVIEW,
    );
    expect(resolveTaskRunPreview("/settlements", "?taskRunPreview=mixed", true)).toBeNull();
    expect(resolveTaskRunPreview("/creators", "?taskRunPreview=unknown", true)).toBeNull();
    expect(resolveTaskRunPreview("/creators", "?taskRunPreview=mixed", false)).toBeNull();
  });
});
