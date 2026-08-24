import {
  act,
  cleanup,
  configure,
  fireEvent,
  getConfig,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { TaskRun } from "../../entities/task-run";
import { TaskRunFloatingPanel } from "./TaskRunFloatingPanel";

const runningCreatorSync: TaskRun = {
  runId: "task-run-creator-sync",
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
};

const runningContentSync: TaskRun = {
  ...runningCreatorSync,
  taskType: "CONTENT_SYNC",
};

test("keeps an empty polite announcement mounted without a visual section", () => {
  render(<TaskRunFloatingPanel runs={[]} />);

  expect(
    screen.queryByRole("region", { name: "작업 진행상황" }),
  ).not.toBeInTheDocument();
  expect(screen.getByTestId("task-run-announcement")).toHaveAttribute(
    "aria-live",
    "polite",
  );
  expect(screen.getByTestId("task-run-announcement")).toHaveClass(
    "hsas-visually-hidden",
  );
  expect(screen.getByTestId("task-run-announcement")).toBeEmptyDOMElement();
});

test("shows determinate progress and administrator context", () => {
  render(<TaskRunFloatingPanel runs={[runningContentSync]} />);

  const panel = screen.getByRole("region", { name: "작업 진행상황" });
  expect(panel).not.toHaveAttribute("tabindex");
  expect(within(panel).getByText("콘텐츠 동기화")).toBeInTheDocument();
  expect(within(panel).getByText("프로필 정보를 동기화하는 중")).toBeInTheDocument();
  expect(within(panel).getByText("김관리자 실행")).toBeInTheDocument();
  expect(within(panel).getByText("84 / 120")).toBeInTheDocument();
  expect(within(panel).getByText("70%")).toBeInTheDocument();
  expect(within(panel).getByText("진행 중")).toHaveClass(
    "hsas-status-pill",
    "hsas-status-pill--approved",
  );
  expect(
    within(panel).getByRole("progressbar", { name: "콘텐츠 동기화 진행률" }),
  ).toHaveAttribute("max", "120");
  expect(
    within(panel).getByRole("progressbar", { name: "콘텐츠 동기화 진행률" }),
  ).toHaveAttribute("value", "84");
});

test("clamps over-total determinate progress at one hundred percent", () => {
  render(
    <TaskRunFloatingPanel
      runs={[{ ...runningContentSync, processedCount: 150 }]}
    />,
  );

  expect(screen.getByText("150 / 120")).toBeInTheDocument();
  expect(screen.getByText("100%")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "120");
});

test("clamps negative determinate progress at zero percent", () => {
  render(
    <TaskRunFloatingPanel
      runs={[{ ...runningContentSync, processedCount: -12 }]}
    />,
  );

  expect(screen.getByText("-12 / 120")).toBeInTheDocument();
  expect(screen.getByText("0%")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
});

test("does not divide by zero or expose an invalid progressbar", () => {
  render(
    <TaskRunFloatingPanel
      runs={[{ ...runningContentSync, processedCount: 0, totalCount: 0 }]}
    />,
  );

  expect(screen.getByRole("status", { name: "진행 상황 확인 중" })).toBeInTheDocument();
  expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
});

test("shows an accessible loading status for a scheduled task with an unknown total", () => {
  const scheduledReport: TaskRun = {
    runId: "task-run-application-report",
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
  };

  render(<TaskRunFloatingPanel runs={[scheduledReport]} />);

  const panel = screen.getByRole("region", { name: "작업 진행상황" });
  expect(within(panel).getByText("지원자 리포트 생성")).toBeInTheDocument();
  expect(within(panel).getByText("지원자 분석 결과를 생성하는 중")).toBeInTheDocument();
  expect(within(panel).getByText("자동 실행")).toBeInTheDocument();
  expect(within(panel).getByRole("status", { name: "진행 상황 확인 중" })).toBeInTheDocument();
  expect(within(panel).queryByText(/%/)).not.toBeInTheDocument();
  expect(within(panel).queryByRole("progressbar")).not.toBeInTheDocument();
});

test("does not present mixed failure counts when the total unit is unknown", () => {
  render(
    <TaskRunFloatingPanel
      runs={[{
        ...runningCreatorSync,
        currentStep: "YOUTUBE_CREATOR_SYNC",
        totalCount: null,
        failedCount: 1,
      }]}
    />,
  );

  expect(screen.getByText("YouTube 크리에이터 동기화 중")).toBeInTheDocument();
  expect(screen.getByRole("status", { name: "진행 상황 확인 중" })).toBeInTheDocument();
  expect(screen.queryByText("1건 실패")).not.toBeInTheDocument();
});

test("keeps creator progress indeterminate when its progress message is absent", () => {
  render(
    <TaskRunFloatingPanel
      runs={[{ ...runningCreatorSync, failedCount: 3 }]}
    />,
  );

  expect(screen.getByRole("status", { name: "진행 상황 확인 중" })).toBeInTheDocument();
  expect(screen.queryByText("84 / 120")).not.toBeInTheDocument();
  expect(screen.queryByText("70%")).not.toBeInTheDocument();
  expect(screen.queryByText("3건 실패")).not.toBeInTheDocument();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
});

test("shows a live creator collection message instead of generic progress numbers", () => {
  const progressMessage = "2개 키워드 중 1개 처리 · 크리에이터 7명 수집";

  render(
    <TaskRunFloatingPanel
      runs={[{
        ...runningCreatorSync,
        currentStep: "YOUTUBE_CREATOR_SYNC",
        failedCount: 1,
        progressMessage,
      }]}
    />,
  );

  expect(screen.getByText("YouTube 크리에이터 동기화 중")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  expect(screen.getByRole("status")).toHaveTextContent(progressMessage);
  expect(screen.getAllByText(progressMessage)).toHaveLength(1);
  expect(screen.queryByText("84 / 120")).not.toBeInTheDocument();
  expect(screen.queryByText("70%")).not.toBeInTheDocument();
  expect(screen.queryByText("1건 실패")).not.toBeInTheDocument();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("status", { name: "진행 상황 확인 중" }),
  ).not.toBeInTheDocument();
});

test("uses the creator collection message as the terminal summary", () => {
  const progressMessage = "YouTube 7명 · Instagram 4명 수집";

  render(
    <TaskRunFloatingPanel
      runs={[{
        ...runningCreatorSync,
        progressMessage,
        status: "SUCCEEDED",
      }]}
    />,
  );

  expect(screen.getByText(progressMessage)).toBeInTheDocument();
  expect(screen.queryByText("84건 작업을 완료했습니다")).not.toBeInTheDocument();
});

const terminalTaskRuns: readonly {
  readonly run: TaskRun;
  readonly summary: string;
  readonly icon: "failed" | "succeeded" | "partial-failed" | "stale";
  readonly statusLabel: string;
}[] = [
  {
    run: {
      ...runningCreatorSync,
      runId: "task-run-failed-with-count",
      status: "FAILED",
      currentStep: "동기화가 중단됨",
      totalCount: 120,
      processedCount: 84,
      succeededCount: 81,
      failedCount: 3,
    },
    summary: "3건 처리에 실패했습니다",
    icon: "failed",
    statusLabel: "실패",
  },
  {
    run: {
      ...runningCreatorSync,
      runId: "task-run-failed-without-count",
      status: "FAILED",
      failedCount: 0,
    },
    summary: "작업을 완료하지 못했습니다",
    icon: "failed",
    statusLabel: "실패",
  },
  {
    run: {
      ...runningCreatorSync,
      runId: "task-run-succeeded",
      status: "SUCCEEDED",
      succeededCount: 248,
    },
    summary: "248건 작업을 완료했습니다",
    icon: "succeeded",
    statusLabel: "완료",
  },
  {
    run: {
      ...runningCreatorSync,
      runId: "task-run-partial-failed",
      status: "PARTIAL_FAILED",
      currentStep: "발송 결과를 정리하는 중",
      totalCount: 120,
      processedCount: 120,
      succeededCount: 117,
      failedCount: 3,
    },
    summary: "117건 완료 · 3건 실패",
    icon: "partial-failed",
    statusLabel: "부분 실패",
  },
  {
    run: {
      ...runningCreatorSync,
      runId: "task-run-partial-failed-with-unknown-unit",
      status: "PARTIAL_FAILED",
      totalCount: null,
      processedCount: 6,
      succeededCount: 4,
      failedCount: 2,
    },
    summary: "일부 작업을 완료하지 못했습니다",
    icon: "partial-failed",
    statusLabel: "부분 실패",
  },
  {
    run: {
      ...runningCreatorSync,
      runId: "task-run-stale",
      status: "STALE",
    },
    summary: "최신 상태를 확인할 수 없습니다",
    icon: "stale",
    statusLabel: "상태 확인 필요",
  },
];

function terminalRun(
  overrides: Partial<TaskRun> & Pick<TaskRun, "runId" | "taskType">,
): TaskRun {
  return { ...terminalTaskRuns[0].run, ...overrides };
}

test.each(terminalTaskRuns)(
  "shows a compact terminal notification for $run.status",
  ({ run, summary, icon, statusLabel }) => {
    render(<TaskRunFloatingPanel runs={[run]} />);

    const panel = screen.getByRole("region", { name: "작업 진행상황" });
    const terminalIcon = panel.querySelector(`[data-task-run-icon="${icon}"]`);

    expect(within(panel).getByText(summary)).toBeInTheDocument();
    expect(terminalIcon).toHaveAttribute("aria-hidden", "true");
    expect(within(panel).getByText(statusLabel)).toBeVisible();
    const dismissButton = within(panel).getByRole("button", {
      name: "크리에이터 동기화 기록 닫기",
    });
    expect(
      within(dismissButton).queryByText("밀어서 닫기"),
    ).not.toBeInTheDocument();
    expect(dismissButton).toHaveClass(
      "hsas-visually-hidden",
      "fuma-task-run-card__accessible-dismiss",
    );
    expect(dismissButton.querySelector("svg")).not.toBeInTheDocument();
    expect(dismissButton).toHaveTextContent("기록 닫기");
    expect(within(panel).queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      within(panel).queryByRole("status", { name: "진행 상황 확인 중" }),
    ).not.toBeInTheDocument();
    expect(panel.querySelector(".fuma-task-run-card__step")).not.toBeInTheDocument();
    expect(panel.querySelector(".fuma-task-run-card__meta")).not.toBeInTheDocument();
    expect(panel.querySelector(".fuma-task-run-card__progress")).not.toBeInTheDocument();
    expect(panel.querySelector(".fuma-task-run-card__indeterminate")).not.toBeInTheDocument();
  },
);

test("renders the finalized dark panel from the base surface classes", () => {
  const terminalRun = terminalTaskRuns[0].run;
  render(<TaskRunFloatingPanel runs={[runningCreatorSync, terminalRun]} />);

  const panel = screen.getByRole("region", { name: "작업 진행상황" });
  expect(panel).toHaveClass("fuma-task-run-panel");
  expect(panel.className).not.toMatch(/--(?:dark|light)/);
});

test("groups the panel title and collapse control in a native header", () => {
  render(<TaskRunFloatingPanel runs={[runningCreatorSync]} />);

  const panel = screen.getByRole("region", { name: "작업 진행상황" });
  const header = panel.querySelector("header");

  expect(header).toBeInTheDocument();
  expect(header).toContainElement(
    within(panel).getByRole("heading", { name: "작업 진행상황" }),
  );
  expect(header).toContainElement(
    within(panel).getByRole("button", { name: "작업 패널 접기" }),
  );
});

test("uses the contracted dark track, surface, and article boundaries", () => {
  render(<TaskRunFloatingPanel runs={[runningCreatorSync]} />);

  const track = screen.getByRole("listitem");
  expect(track).toHaveClass("fuma-task-run-track");
  expect(track).toHaveAttribute("data-run-id", runningCreatorSync.runId);
  expect(track.firstElementChild).toHaveClass("fuma-task-run-card-surface");
  expect(track.firstElementChild?.firstElementChild).toHaveClass(
    "fuma-task-run-card",
  );
  expect(track.firstElementChild?.firstElementChild?.className).not.toMatch(
    /--(?:dark|light)/,
  );
});

test("collapses accessibly while retaining the list DOM and restores it on expand", async () => {
  const user = userEvent.setup();
  const { container } = render(<TaskRunFloatingPanel runs={[runningCreatorSync]} />);

  const panel = screen.getByRole("region", { name: "작업 진행상황" });
  const viewport = screen.getByTestId("task-run-list-viewport");
  const collapseButton = within(panel).getByRole("button", {
    name: "작업 패널 접기",
  });
  const list = within(panel).getByRole("list");

  expect(panel).toHaveAttribute("data-expanded", "true");
  expect(collapseButton).toHaveAttribute("aria-expanded", "true");
  expect(collapseButton).toHaveAttribute("aria-controls", viewport.id);
  expect(viewport).toHaveAttribute("id", "task-run-list-viewport");
  expect(list).not.toHaveAttribute("id");

  await user.click(collapseButton);

  expect(panel).toHaveAttribute("data-expanded", "false");
  expect(viewport).toHaveAttribute("aria-hidden", "true");
  expect(viewport).toHaveAttribute("inert");
  expect(container.querySelectorAll(".fuma-task-run-track")).toHaveLength(1);
  expect(screen.queryByRole("listitem")).not.toBeInTheDocument();

  const expandButton = within(panel).getByRole("button", {
    name: "작업 패널 펼치기",
  });
  expect(expandButton).toHaveAttribute("aria-expanded", "false");
  await user.click(expandButton);

  expect(panel).toHaveAttribute("data-expanded", "true");
  expect(viewport).not.toHaveAttribute("aria-hidden");
  expect(viewport).not.toHaveAttribute("inert");
  expect(screen.getByRole("listitem")).toBeInTheDocument();
});

describe("terminal dismissal interactions", () => {
  const defaultAsyncWrapper = getConfig().asyncWrapper;
  const firstRun = terminalRun({
    runId: "terminal-kakao",
    taskType: "KAKAO_MESSAGE_SEND",
  });
  const secondRun = terminalRun({
    ...terminalTaskRuns[2].run,
    runId: "terminal-content",
    taskType: "CONTENT_SYNC",
  });
  const thirdRun = terminalRun({
    ...terminalTaskRuns[3].run,
    runId: "terminal-email",
    taskType: "PROPOSAL_EMAIL_SEND",
  });
  const queuedRun: TaskRun = {
    ...runningCreatorSync,
    runId: "queued-settlement",
    taskType: "SETTLEMENT_CALCULATION",
    status: "QUEUED",
  };
  const pointerCaptureDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "setPointerCapture",
  );
  const pointerReleaseDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "releasePointerCapture",
  );
  const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, "matchMedia");
  let setPointerCapture: ReturnType<typeof vi.fn>;
  let releasePointerCapture: ReturnType<typeof vi.fn>;

  function setReducedMotion(reduce: boolean) {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: reduce && query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
  }

  function trackFor(runId: string) {
    const track = document.querySelector<HTMLElement>(`[data-run-id="${runId}"]`);
    expect(track).toBeInTheDocument();
    return track as HTMLElement;
  }

  function dispatchPointer(
    target: Element,
    type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
    init: {
      button?: number;
      clientX?: number;
      isPrimary?: boolean;
      pointerId?: number;
      pointerType?: string;
    } = {},
  ) {
    const eventInit = {
      bubbles: true,
      button: 0,
      cancelable: true,
      clientX: 0,
      isPrimary: true,
      pointerId: 1,
      pointerType: "mouse",
      ...init,
    };

    act(() => {
      if (type === "pointerdown") fireEvent.pointerDown(target, eventInit);
      if (type === "pointermove") fireEvent.pointerMove(target, eventInit);
      if (type === "pointerup") fireEvent.pointerUp(target, eventInit);
      if (type === "pointercancel") fireEvent.pointerCancel(target, eventInit);
    });
  }

  function dispatchWheel(
    target: Element,
    { deltaMode = 0, deltaX = 0, deltaY = 0 } = {},
  ) {
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaMode,
      deltaX,
      deltaY,
    });
    let dispatched = true;

    act(() => {
      dispatched = target.dispatchEvent(event);
    });

    return { dispatched, event };
  }

  function advance(milliseconds: number) {
    act(() => {
      vi.advanceTimersByTime(milliseconds);
    });
  }

  function user() {
    return userEvent.setup({
      advanceTimers: vi.advanceTimersByTimeAsync,
    });
  }

  beforeEach(() => {
    configure({ asyncWrapper: async (callback) => callback() });
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.spyOn(performance, "now").mockImplementation(() => Date.now());
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        const width = this.matches(".fuma-task-run-track") ? 300 : 0;
        const height = this.matches(".fuma-task-run-track") ? 96 : 0;
        return {
          bottom: height,
          height,
          left: 0,
          right: width,
          toJSON: () => ({}),
          top: 0,
          width,
          x: 0,
          y: 0,
        };
      },
    );
    setPointerCapture = vi.fn();
    releasePointerCapture = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: setPointerCapture,
    });
    Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
      configurable: true,
      value: releasePointerCapture,
    });
    setReducedMotion(false);
  });

  afterEach(() => {
    cleanup();
    configure({ asyncWrapper: defaultAsyncWrapper });
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (pointerCaptureDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "setPointerCapture",
        pointerCaptureDescriptor,
      );
    } else {
      delete (HTMLElement.prototype as Partial<HTMLElement>).setPointerCapture;
    }
    if (pointerReleaseDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "releasePointerCapture",
        pointerReleaseDescriptor,
      );
    } else {
      delete (HTMLElement.prototype as Partial<HTMLElement>).releasePointerCapture;
    }
    if (matchMediaDescriptor) {
      Object.defineProperty(window, "matchMedia", matchMediaDescriptor);
    } else {
      delete (window as Partial<Window>).matchMedia;
    }
  });

  test("renders accessible terminal close controls but no dismissal affordance for active runs", () => {
    render(
      <TaskRunFloatingPanel
        runs={[runningCreatorSync, queuedRun, firstRun, secondRun]}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "크리에이터 동기화 기록 닫기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "정산 계산 기록 닫기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "카카오 메시지 발송 기록 닫기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "콘텐츠 동기화 기록 닫기" }),
    ).toBeInTheDocument();
    expect(trackFor(firstRun.runId)).toHaveAttribute("data-dismissible", "true");
    expect(trackFor(runningCreatorSync.runId)).not.toHaveAttribute("data-dismissible");
    expect(trackFor(queuedRun.runId)).not.toHaveAttribute("data-dismissible");
  });

  test.each([110, -110])(
    "dismisses a terminal pointer drag of %ipx through release and height phases",
    (distance) => {
      render(<TaskRunFloatingPanel runs={[firstRun]} />);
      const track = trackFor(firstRun.runId);

      dispatchPointer(track, "pointerdown", { clientX: 10, pointerId: 7 });
      dispatchPointer(track, "pointermove", {
        clientX: 10 + distance,
        pointerId: 7,
      });
      expect(track.style.getPropertyValue("--fuma-task-dismiss-x")).toBe(
        `${distance}px`,
      );
      dispatchPointer(track, "pointerup", {
        clientX: 10 + distance,
        pointerId: 7,
      });

      expect(track).toHaveAttribute("data-dismiss-phase", "exiting");
      expect(track).toHaveAttribute("aria-hidden", "true");
      expect(track).toHaveAttribute("inert");
      expect(track.style.getPropertyValue("--fuma-task-dismiss-x")).toBe(
        `${Math.sign(distance) * 348}px`,
      );
      advance(239);
      expect(track).toHaveAttribute("data-dismiss-phase", "exiting");
      advance(1);
      expect(track).toHaveAttribute("data-dismiss-phase", "collapsing");
      advance(179);
      expect(document.body).toContainElement(track);
      advance(1);
      expect(document.body).not.toContainElement(track);
    },
  );

  test("returns a 30px drag and accepts the same threshold for touch pointers", () => {
    render(<TaskRunFloatingPanel runs={[firstRun, secondRun]} />);
    const firstTrack = trackFor(firstRun.runId);
    const secondTrack = trackFor(secondRun.runId);

    dispatchPointer(firstTrack, "pointerdown", { clientX: 0, pointerId: 1 });
    dispatchPointer(firstTrack, "pointermove", { clientX: 30, pointerId: 1 });
    dispatchPointer(firstTrack, "pointerup", { clientX: 30, pointerId: 1 });

    expect(firstTrack).toHaveAttribute("data-dismiss-phase", "returning");
    expect(firstTrack.style.getPropertyValue("--fuma-task-dismiss-x")).toBe("0px");
    advance(400);
    expect(firstTrack).toHaveAttribute("data-dismiss-phase", "idle");

    dispatchPointer(secondTrack, "pointerdown", {
      clientX: 0,
      pointerId: 2,
      pointerType: "touch",
    });
    dispatchPointer(secondTrack, "pointermove", {
      clientX: 110,
      pointerId: 2,
      pointerType: "touch",
    });
    dispatchPointer(secondTrack, "pointerup", {
      clientX: 110,
      pointerId: 2,
      pointerType: "touch",
    });

    expect(secondTrack).toHaveAttribute("data-dismiss-phase", "exiting");
  });

  test("uses recent pointer velocity to accept a short flick", () => {
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);

    dispatchPointer(track, "pointerdown", { clientX: 0, pointerId: 1 });
    advance(20);
    dispatchPointer(track, "pointermove", { clientX: 40, pointerId: 1 });
    dispatchPointer(track, "pointerup", { clientX: 40, pointerId: 1 });

    expect(track).toHaveAttribute("data-dismiss-phase", "exiting");
  });

  test("ignores non-primary and right mouse input and only follows the captured pointer", () => {
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);

    dispatchPointer(track, "pointerdown", {
      isPrimary: false,
      pointerId: 3,
    });
    dispatchPointer(track, "pointerdown", {
      button: 2,
      pointerId: 4,
    });
    expect(setPointerCapture).not.toHaveBeenCalled();
    expect(track).toHaveAttribute("data-dismiss-phase", "idle");

    dispatchPointer(track, "pointerdown", { clientX: 5, pointerId: 7 });
    expect(setPointerCapture).toHaveBeenCalledWith(7);
    dispatchPointer(track, "pointermove", { clientX: 205, pointerId: 8 });
    dispatchPointer(track, "pointerup", { clientX: 205, pointerId: 8 });
    expect(track.style.getPropertyValue("--fuma-task-dismiss-x")).toBe("0px");
    expect(track).toHaveAttribute("data-dismiss-phase", "dragging");
    expect(releasePointerCapture).not.toHaveBeenCalled();

    dispatchPointer(track, "pointermove", { clientX: 35, pointerId: 7 });
    dispatchPointer(track, "pointerup", { clientX: 35, pointerId: 7 });
    expect(releasePointerCapture).toHaveBeenCalledWith(7);
    expect(track).toHaveAttribute("data-dismiss-phase", "returning");
  });

  test("pointercancel and window blur release capture and restore without dismissing", () => {
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);

    dispatchPointer(track, "pointerdown", { pointerId: 1 });
    dispatchPointer(track, "pointermove", { clientX: 80, pointerId: 1 });
    dispatchPointer(track, "pointercancel", { clientX: 80, pointerId: 1 });
    expect(releasePointerCapture).toHaveBeenCalledWith(1);
    expect(track).toHaveAttribute("data-dismiss-phase", "idle");
    expect(track.style.getPropertyValue("--fuma-task-dismiss-x")).toBe("0px");

    dispatchPointer(track, "pointerdown", { pointerId: 2 });
    dispatchPointer(track, "pointermove", { clientX: 80, pointerId: 2 });
    act(() => window.dispatchEvent(new Event("blur")));
    expect(releasePointerCapture).toHaveBeenCalledWith(2);
    expect(track).toHaveAttribute("data-dismiss-phase", "idle");
    expect(vi.getTimerCount()).toBe(0);
    advance(1000);
    expect(trackFor(firstRun.runId)).toBe(track);
  });

  test("cleans accepted timers on unmount without late callbacks or warnings", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { unmount } = render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);

    dispatchPointer(track, "pointerdown", { pointerId: 1 });
    dispatchPointer(track, "pointermove", { clientX: 110, pointerId: 1 });
    dispatchPointer(track, "pointerup", { clientX: 110, pointerId: 1 });
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    advance(1000);
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("does not lock vertical or cumulative horizontal wheel input until the strict boundary", () => {
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);

    const vertical = dispatchWheel(track, { deltaX: 0, deltaY: 20 });
    expect(vertical.event.defaultPrevented).toBe(false);
    expect(vertical.dispatched).toBe(true);
    advance(500);
    expect(track).toHaveAttribute("data-dismiss-phase", "idle");

    for (const deltaX of [2, 2]) {
      const beforeLock = dispatchWheel(track, { deltaX });
      expect(beforeLock.event.defaultPrevented).toBe(false);
      expect(beforeLock.dispatched).toBe(true);
    }
    const strictLock = dispatchWheel(track, { deltaX: 0.1 });
    expect(strictLock.event.defaultPrevented).toBe(true);
    expect(strictLock.dispatched).toBe(false);
  });

  test("dismisses an accumulated horizontal wheel gesture after settle without flick", () => {
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);

    expect(dispatchWheel(track, { deltaX: 60 }).event.defaultPrevented).toBe(true);
    expect(dispatchWheel(track, { deltaX: 40 }).event.defaultPrevented).toBe(true);
    expect(track.style.getPropertyValue("--fuma-task-dismiss-x")).toBe("100px");
    advance(99);
    expect(track).toHaveAttribute("data-dismiss-phase", "dragging");
    advance(1);
    expect(track).toHaveAttribute("data-dismiss-phase", "exiting");
    advance(240);
    expect(track).toHaveAttribute("data-dismiss-phase", "collapsing");
    advance(180);
    expect(document.body).not.toContainElement(track);
  });

  test("returns a sub-threshold wheel gesture even when it arrives quickly", () => {
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);

    dispatchWheel(track, { deltaX: 40 });
    advance(100);

    expect(track).toHaveAttribute("data-dismiss-phase", "returning");
    expect(track.style.getPropertyValue("--fuma-task-dismiss-x")).toBe("0px");
    advance(400);
    expect(track).toHaveAttribute("data-dismiss-phase", "idle");
  });

  test("keeps a new wheel sequence dragging past the previous return deadline", () => {
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);

    dispatchWheel(track, { deltaX: 40 });
    advance(100);
    expect(track).toHaveAttribute("data-dismiss-phase", "returning");

    advance(330);
    dispatchWheel(track, { deltaX: 12 });
    advance(40);
    dispatchWheel(track, { deltaX: 8 });
    advance(31);

    expect(track).toHaveAttribute("data-dismiss-phase", "dragging");
    expect(track.style.getPropertyValue("--fuma-task-dismiss-x")).toBe("20px");
    advance(69);
    expect(track).toHaveAttribute("data-dismiss-phase", "returning");
  });

  test("gives wheel ownership to the first card before intent lock", () => {
    render(<TaskRunFloatingPanel runs={[firstRun, secondRun]} />);
    const firstTrack = trackFor(firstRun.runId);
    const secondTrack = trackFor(secondRun.runId);

    expect(
      dispatchWheel(firstTrack, { deltaY: 12 }).event.defaultPrevented,
    ).toBe(false);
    const nonOwner = dispatchWheel(secondTrack, { deltaX: 120 });
    expect(nonOwner.event.defaultPrevented).toBe(false);
    expect(nonOwner.dispatched).toBe(true);
    advance(100);

    expect(firstTrack).toHaveAttribute("data-dismiss-phase", "returning");
    expect(secondTrack).toHaveAttribute("data-dismiss-phase", "idle");
    expect(document.body).toContainElement(secondTrack);
  });

  test("applies a shared 450ms cooldown before a new wheel gesture can dismiss the next card", () => {
    render(<TaskRunFloatingPanel runs={[firstRun, secondRun]} />);
    const firstTrack = trackFor(firstRun.runId);
    const secondTrack = trackFor(secondRun.runId);

    dispatchWheel(firstTrack, { deltaX: 100 });
    advance(100);
    expect(firstTrack).toHaveAttribute("data-dismiss-phase", "exiting");

    const momentum = dispatchWheel(secondTrack, { deltaX: 100 });
    expect(momentum.event.defaultPrevented).toBe(false);
    advance(100);
    expect(secondTrack).toHaveAttribute("data-dismiss-phase", "idle");

    advance(350);
    expect(document.body).not.toContainElement(firstTrack);
    dispatchWheel(secondTrack, { deltaX: 100 });
    advance(100);
    expect(secondTrack).toHaveAttribute("data-dismiss-phase", "exiting");
  });

  test("does not expose close behavior or move queued and running tracks", () => {
    render(<TaskRunFloatingPanel runs={[queuedRun, runningCreatorSync]} />);
    const queuedTrack = trackFor(queuedRun.runId);
    const runningTrack = trackFor(runningCreatorSync.runId);

    dispatchPointer(queuedTrack, "pointerdown", { pointerId: 1 });
    dispatchPointer(queuedTrack, "pointermove", { clientX: 120, pointerId: 1 });
    dispatchPointer(queuedTrack, "pointerup", { clientX: 120, pointerId: 1 });
    dispatchWheel(runningTrack, { deltaX: 120 });
    advance(600);

    expect(queuedTrack).not.toHaveAttribute("data-dismissible");
    expect(runningTrack).not.toHaveAttribute("data-dismissible");
    expect(queuedTrack.style.getPropertyValue("--fuma-task-dismiss-x")).toBe("0px");
    expect(runningTrack.style.getPropertyValue("--fuma-task-dismiss-x")).toBe("0px");
    expect(setPointerCapture).not.toHaveBeenCalled();
  });

  test("does not start a pointer drag from the hidden keyboard fallback", () => {
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);
    const swipeButton = screen.getByRole("button", {
      name: "카카오 메시지 발송 기록 닫기",
    });

    dispatchPointer(swipeButton, "pointerdown", { pointerId: 1 });
    dispatchPointer(track, "pointermove", { clientX: 120, pointerId: 1 });
    dispatchPointer(track, "pointerup", { clientX: 120, pointerId: 1 });

    expect(setPointerCapture).not.toHaveBeenCalled();
    expect(track).toHaveAttribute("data-dismiss-phase", "idle");
  });

  test("collapsing the panel clears pending pointer state without dismissal", () => {
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);
    dispatchPointer(track, "pointerdown", { pointerId: 1 });
    dispatchPointer(track, "pointermove", { clientX: 80, pointerId: 1 });

    fireEvent.click(screen.getByRole("button", { name: "작업 패널 접기" }));

    expect(track).toHaveAttribute("data-dismiss-phase", "idle");
    expect(track.style.getPropertyValue("--fuma-task-dismiss-x")).toBe("0px");
    expect(releasePointerCapture).toHaveBeenCalledWith(1);
    dispatchPointer(track, "pointerup", { clientX: 120, pointerId: 1 });
    advance(500);
    expect(document.body).toContainElement(track);
  });

  test("collapsing the panel clears wheel ownership and settle state", () => {
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);
    dispatchWheel(track, { deltaX: 80 });

    fireEvent.click(screen.getByRole("button", { name: "작업 패널 접기" }));
    advance(100);

    expect(track).toHaveAttribute("data-dismiss-phase", "idle");
    expect(document.body).toContainElement(track);
    fireEvent.click(screen.getByRole("button", { name: "작업 패널 펼치기" }));
    dispatchWheel(track, { deltaX: 100 });
    advance(100);
    expect(track).toHaveAttribute("data-dismiss-phase", "exiting");
  });

  test("finishes an accepted exit while the panel viewport is collapsed", () => {
    render(<TaskRunFloatingPanel runs={[firstRun, runningCreatorSync]} />);
    const track = trackFor(firstRun.runId);
    dispatchPointer(track, "pointerdown", { pointerId: 1 });
    dispatchPointer(track, "pointermove", { clientX: 110, pointerId: 1 });
    dispatchPointer(track, "pointerup", { clientX: 110, pointerId: 1 });

    fireEvent.click(screen.getByRole("button", { name: "작업 패널 접기" }));
    expect(track).toHaveAttribute("data-dismiss-phase", "exiting");
    advance(420);

    expect(document.body).not.toContainElement(track);
    expect(screen.getByRole("region", { name: "작업 진행상황" })).toHaveAttribute(
      "data-expanded",
      "false",
    );
  });

  test("announces keyboard dismissal immediately, focuses next, then removes after 240 plus 180ms", async () => {
    render(<TaskRunFloatingPanel runs={[firstRun, secondRun, thirdRun]} />);
    const closeButton = screen.getByRole("button", {
      name: "콘텐츠 동기화 기록 닫기",
    });
    const track = trackFor(secondRun.runId);
    closeButton.focus();
    await user().keyboard("{Enter}");

    expect(track).toHaveAttribute("data-dismiss-phase", "exiting");
    expect(track).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByRole("button", { name: "제안 이메일 발송 기록 닫기" }),
    ).toHaveFocus();
    expect(screen.getByTestId("task-run-announcement")).toHaveTextContent(
      "콘텐츠 동기화 기록을 닫았습니다",
    );
    advance(240);
    expect(track).toHaveAttribute("data-dismiss-phase", "collapsing");
    advance(180);
    expect(document.body).not.toContainElement(track);
  });

  test("focuses the previous terminal close control when there is no next control", async () => {
    render(<TaskRunFloatingPanel runs={[firstRun, secondRun]} />);

    await user().click(
      screen.getByRole("button", { name: "콘텐츠 동기화 기록 닫기" }),
    );

    expect(
      screen.getByRole("button", { name: "카카오 메시지 발송 기록 닫기" }),
    ).toHaveFocus();
    expect(trackFor(secondRun.runId)).toHaveAttribute(
      "data-dismiss-phase",
      "exiting",
    );
  });

  test("focuses collapse when active cards remain after the last terminal closes", async () => {
    render(<TaskRunFloatingPanel runs={[firstRun, runningCreatorSync]} />);
    const closeButton = screen.getByRole("button", {
      name: "카카오 메시지 발송 기록 닫기",
    });
    closeButton.focus();
    await user().keyboard(" ");

    expect(screen.getByRole("button", { name: "작업 패널 접기" })).toHaveFocus();
    expect(screen.getByText("프로필 정보를 동기화하는 중")).toBeInTheDocument();
  });

  test("focuses fallback immediately for the last visual run and keeps its announcement after removal", async () => {
    render(
      <>
        <main id="admin-main-content" tabIndex={-1}>관리자 본문</main>
        <TaskRunFloatingPanel fallbackFocusId="admin-main-content" runs={[firstRun]} />
      </>,
    );
    const track = trackFor(firstRun.runId);

    await user().click(
      screen.getByRole("button", { name: "카카오 메시지 발송 기록 닫기" }),
    );

    expect(screen.getByRole("main")).toHaveFocus();
    expect(track).toHaveAttribute("data-dismiss-phase", "exiting");
    expect(
      screen.getByRole("region", { name: "작업 진행상황" }),
    ).toBeInTheDocument();
    advance(420);
    expect(
      screen.queryByRole("region", { name: "작업 진행상황" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("task-run-announcement")).toHaveTextContent(
      "카카오 메시지 발송 기록을 닫았습니다",
    );
  });

  test("moves focus for a pointer dismissal only when focus was inside that card", () => {
    render(<TaskRunFloatingPanel runs={[firstRun, secondRun]} />);
    const firstTrack = trackFor(firstRun.runId);
    screen.getByRole("button", {
      name: "카카오 메시지 발송 기록 닫기",
    }).focus();

    dispatchPointer(firstTrack, "pointerdown", { pointerId: 1 });
    dispatchPointer(firstTrack, "pointermove", { clientX: 110, pointerId: 1 });
    dispatchPointer(firstTrack, "pointerup", { clientX: 110, pointerId: 1 });

    expect(
      screen.getByRole("button", { name: "콘텐츠 동기화 기록 닫기" }),
    ).toHaveFocus();
  });

  test("pointer dismissal does not steal focus from outside the card", () => {
    render(
      <>
        <button type="button">외부 작업</button>
        <TaskRunFloatingPanel runs={[firstRun, secondRun]} />
      </>,
    );
    const outsideButton = screen.getByRole("button", { name: "외부 작업" });
    const track = trackFor(firstRun.runId);
    outsideButton.focus();

    dispatchPointer(track, "pointerdown", { pointerId: 1 });
    dispatchPointer(track, "pointermove", { clientX: 110, pointerId: 1 });
    dispatchPointer(track, "pointerup", { clientX: 110, pointerId: 1 });

    expect(outsideButton).toHaveFocus();
  });

  test("wheel dismissal does not steal focus from outside the card", () => {
    render(
      <>
        <button type="button">외부 작업</button>
        <TaskRunFloatingPanel runs={[firstRun, secondRun]} />
      </>,
    );
    const outsideButton = screen.getByRole("button", { name: "외부 작업" });
    outsideButton.focus();

    dispatchWheel(trackFor(firstRun.runId), { deltaX: 100 });
    advance(100);

    expect(outsideButton).toHaveFocus();
  });

  test("keeps dismissed terminal IDs hidden on rerender and remounts the same active ID cleanly", async () => {
    const { rerender } = render(<TaskRunFloatingPanel runs={[firstRun]} />);

    await user().click(
      screen.getByRole("button", { name: "카카오 메시지 발송 기록 닫기" }),
    );
    advance(420);
    rerender(<TaskRunFloatingPanel runs={[firstRun, runningCreatorSync]} />);

    expect(screen.queryByText("120건 처리에 실패했습니다")).not.toBeInTheDocument();
    expect(screen.getByText("프로필 정보를 동기화하는 중")).toBeInTheDocument();

    rerender(
      <TaskRunFloatingPanel
        runs={[{ ...firstRun, status: "RUNNING", currentStep: "다시 실행 중" }]}
      />,
    );

    const activeTrack = trackFor(firstRun.runId);
    expect(screen.getByText("다시 실행 중")).toBeInTheDocument();
    expect(activeTrack).not.toHaveAttribute("aria-hidden");
    expect(activeTrack).not.toHaveAttribute("inert");
    expect(activeTrack).not.toHaveAttribute("data-dismissible");
    expect(
      screen.queryByRole("button", { name: "카카오 메시지 발송 기록 닫기" }),
    ).not.toBeInTheDocument();
  });

  test("uses zero-duration release and height phases for reduced motion", () => {
    setReducedMotion(true);
    render(<TaskRunFloatingPanel runs={[firstRun]} />);
    const track = trackFor(firstRun.runId);

    fireEvent.click(
      screen.getByRole("button", { name: "카카오 메시지 발송 기록 닫기" }),
    );
    expect(track).toHaveAttribute("data-dismiss-phase", "exiting");
    act(() => vi.runAllTimers());

    expect(document.body).not.toContainElement(track);
    expect(screen.getByTestId("task-run-announcement")).toHaveTextContent(
      "카카오 메시지 발송 기록을 닫았습니다",
    );
  });
});

test.each([
  ["KAKAO_MESSAGE_RESEND", "카카오 메시지 재발송 중"],
  ["PROPOSAL_EMAIL_SEND", "제안 이메일 발송 중"],
  ["ESTIMATE", "예상 정산 계산 중"],
  ["FINALIZE", "정산 확정 중"],
  ["RECALCULATE", "정산 재계산 중"],
  ["YOUTUBE_CREATOR_SYNC", "YouTube 크리에이터 동기화 중"],
  ["INSTAGRAM_CREATOR_SYNC", "Instagram 크리에이터 동기화 중"],
])("shows a friendly label for the %s step", (currentStep, label) => {
  render(
    <TaskRunFloatingPanel runs={[{ ...runningCreatorSync, currentStep }]} />,
  );

  expect(screen.getByText(label)).toBeInTheDocument();
});
