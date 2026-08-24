import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type RefCallback,
} from "react";
import {
  normalizeWheelDelta,
  recentVelocity,
  shouldDismiss,
  shouldLockHorizontal,
  type PointerSample,
} from "./taskRunDismissGesture";

export type TaskRunDismissOrigin = "keyboard" | "pointer" | "wheel";
export type TaskRunDismissPhase =
  | "idle"
  | "dragging"
  | "returning"
  | "exiting"
  | "collapsing";

export interface WheelSession {
  ownerRunId: string | null;
  cooldownUntil: number;
}

interface UseTaskRunDismissOptions {
  enabled: boolean;
  expanded: boolean;
  runId: string;
  onDismissAccepted: (origin: TaskRunDismissOrigin) => void;
  onDismissComplete: () => void;
  wheelSessionRef: MutableRefObject<WheelSession>;
}

type TaskRunTrackProps = Pick<
  HTMLAttributes<HTMLLIElement>,
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp"
  | "onPointerCancel"
  | "style"
  | "aria-hidden"
  | "inert"
> & {
  "data-dismissible"?: "true";
  "data-dismiss-phase": TaskRunDismissPhase;
};

interface UseTaskRunDismissResult {
  trackRef: RefCallback<HTMLLIElement>;
  dismissFromKeyboard: () => void;
  trackProps: TaskRunTrackProps;
}

interface VisualState {
  height: number | null;
  phase: TaskRunDismissPhase;
  x: number;
}

interface PointerSession {
  pointerId: number;
  samples: PointerSample[];
  startX: number;
}

const EXIT_MS = 240;
const HEIGHT_MS = 180;
const RETURN_MS = 400;
const WHEEL_SETTLE_MS = 100;
const WHEEL_COOLDOWN_MS = 450;
const INTERACTIVE_SELECTOR = "button,a,input,select,textarea";

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function useTaskRunDismiss({
  enabled,
  expanded,
  runId,
  onDismissAccepted,
  onDismissComplete,
  wheelSessionRef,
}: UseTaskRunDismissOptions): UseTaskRunDismissResult {
  const [trackNode, setTrackNode] = useState<HTMLLIElement | null>(null);
  const [visual, setVisual] = useState<VisualState>({
    height: null,
    phase: "idle",
    x: 0,
  });
  const trackNodeRef = useRef<HTMLLIElement | null>(null);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const wheelStateRef = useRef({ locked: false, x: 0, y: 0 });
  const acceptedRef = useRef(false);
  const completeRef = useRef(false);
  const mountedRef = useRef(true);
  const exitTimerRef = useRef<number | null>(null);
  const heightTimerRef = useRef<number | null>(null);
  const returnTimerRef = useRef<number | null>(null);
  const wheelSettleTimerRef = useRef<number | null>(null);
  const onDismissAcceptedRef = useRef(onDismissAccepted);
  const onDismissCompleteRef = useRef(onDismissComplete);

  useEffect(() => {
    onDismissAcceptedRef.current = onDismissAccepted;
    onDismissCompleteRef.current = onDismissComplete;
  }, [onDismissAccepted, onDismissComplete]);

  const clearTimer = useCallback((timerRef: MutableRefObject<number | null>) => {
    if (timerRef.current == null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const releasePointerCapture = useCallback(() => {
    const pointerSession = pointerSessionRef.current;
    if (!pointerSession) return;

    try {
      trackNodeRef.current?.releasePointerCapture(pointerSession.pointerId);
    } catch {
      // Capture may already have been released by the browser.
    }
    pointerSessionRef.current = null;
  }, []);

  const releaseWheelOwnership = useCallback(() => {
    if (wheelSessionRef.current.ownerRunId === runId) {
      wheelSessionRef.current.ownerRunId = null;
    }
  }, [runId, wheelSessionRef]);

  const resetWheelState = useCallback(() => {
    clearTimer(wheelSettleTimerRef);
    wheelStateRef.current = { locked: false, x: 0, y: 0 };
    releaseWheelOwnership();
  }, [clearTimer, releaseWheelOwnership]);

  const restoreImmediately = useCallback(() => {
    if (acceptedRef.current) return;
    releasePointerCapture();
    resetWheelState();
    clearTimer(returnTimerRef);
    setVisual({ height: null, phase: "idle", x: 0 });
  }, [clearTimer, releasePointerCapture, resetWheelState]);

  const beginReturn = useCallback(() => {
    if (acceptedRef.current) return;
    releasePointerCapture();
    resetWheelState();
    clearTimer(returnTimerRef);
    setVisual({ height: null, phase: "returning", x: 0 });
    const duration = prefersReducedMotion() ? 0 : RETURN_MS;
    returnTimerRef.current = window.setTimeout(() => {
      returnTimerRef.current = null;
      if (!mountedRef.current || acceptedRef.current) return;
      setVisual({ height: null, phase: "idle", x: 0 });
    }, duration);
  }, [clearTimer, releasePointerCapture, resetWheelState]);

  const acceptDismiss = useCallback(
    (origin: TaskRunDismissOrigin, directionValue: number) => {
      if (acceptedRef.current || !enabled) return;
      const node = trackNodeRef.current;
      if (!node) return;

      acceptedRef.current = true;
      clearTimer(returnTimerRef);
      clearTimer(wheelSettleTimerRef);
      const { height, width } = node.getBoundingClientRect();
      const direction = Math.sign(directionValue) || 1;
      setVisual({
        height,
        phase: "exiting",
        x: direction * (width + 48),
      });
      onDismissAcceptedRef.current(origin);

      const exitDuration = prefersReducedMotion() ? 0 : EXIT_MS;
      const heightDuration = prefersReducedMotion() ? 0 : HEIGHT_MS;
      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null;
        if (!mountedRef.current) return;
        setVisual((current) => ({ ...current, phase: "collapsing" }));
        heightTimerRef.current = window.setTimeout(() => {
          heightTimerRef.current = null;
          if (!mountedRef.current || completeRef.current) return;
          completeRef.current = true;
          onDismissCompleteRef.current();
        }, heightDuration);
      }, exitDuration);
    },
    [clearTimer, enabled],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      if (!enabled || !expanded || acceptedRef.current || pointerSessionRef.current) {
        return;
      }
      if (event.isPrimary === false) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const interactiveTarget =
        event.target instanceof Element
          ? event.target.closest(INTERACTIVE_SELECTOR)
          : null;
      if (interactiveTarget) return;

      clearTimer(returnTimerRef);
      const now = performance.now();
      pointerSessionRef.current = {
        pointerId: event.pointerId,
        samples: [{ time: now, x: event.clientX }],
        startX: event.clientX,
      };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        pointerSessionRef.current = null;
        return;
      }
      setVisual({ height: null, phase: "dragging", x: 0 });
    },
    [clearTimer, enabled, expanded],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLLIElement>) => {
    const pointerSession = pointerSessionRef.current;
    if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;

    const now = performance.now();
    pointerSession.samples.push({ time: now, x: event.clientX });
    if (pointerSession.samples.length > 8) pointerSession.samples.shift();
    setVisual({
      height: null,
      phase: "dragging",
      x: event.clientX - pointerSession.startX,
    });
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      const pointerSession = pointerSessionRef.current;
      if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;

      const now = performance.now();
      const distance = event.clientX - pointerSession.startX;
      const samples = [...pointerSession.samples];
      if (samples.at(-1)?.x !== event.clientX) {
        samples.push({ time: now, x: event.clientX });
      }
      const velocity = recentVelocity(samples, now);
      releasePointerCapture();

      const width = trackNodeRef.current?.getBoundingClientRect().width ?? 0;
      if (shouldDismiss({ distance, velocity, width })) {
        acceptDismiss("pointer", distance || velocity);
      } else {
        beginReturn();
      }
    },
    [acceptDismiss, beginReturn, releasePointerCapture],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      if (pointerSessionRef.current?.pointerId !== event.pointerId) return;
      restoreImmediately();
    },
    [restoreImmediately],
  );

  const dismissFromKeyboard = useCallback(() => {
    if (!enabled || !expanded || acceptedRef.current) return;
    acceptDismiss("keyboard", 1);
  }, [acceptDismiss, enabled, expanded]);

  const trackRef = useCallback<RefCallback<HTMLLIElement>>((node) => {
    trackNodeRef.current = node;
    setTrackNode(node);
  }, []);

  useEffect(() => {
    if ((enabled && expanded) || acceptedRef.current) return;
    restoreImmediately();
  }, [enabled, expanded, restoreImmediately]);

  useEffect(() => {
    const handleWindowBlur = () => restoreImmediately();
    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [restoreImmediately]);

  useEffect(() => {
    if (!trackNode || !enabled || !expanded) return;

    const handleWheel = (event: WheelEvent) => {
      if (acceptedRef.current) return;
      const now = performance.now();
      if (now < wheelSessionRef.current.cooldownUntil) return;

      if (wheelSessionRef.current.ownerRunId == null) {
        clearTimer(returnTimerRef);
        wheelSessionRef.current.ownerRunId = runId;
      }
      if (wheelSessionRef.current.ownerRunId !== runId) return;

      const { height, width } = trackNode.getBoundingClientRect();
      const wheelState = wheelStateRef.current;
      wheelState.x += normalizeWheelDelta(event.deltaX, event.deltaMode, width);
      wheelState.y += normalizeWheelDelta(event.deltaY, event.deltaMode, height);
      wheelState.locked =
        wheelState.locked || shouldLockHorizontal(wheelState.x, wheelState.y);
      setVisual({ height: null, phase: "dragging", x: wheelState.x });

      if (wheelState.locked) event.preventDefault();

      clearTimer(wheelSettleTimerRef);
      wheelSettleTimerRef.current = window.setTimeout(() => {
        wheelSettleTimerRef.current = null;
        if (
          acceptedRef.current ||
          wheelSessionRef.current.ownerRunId !== runId
        ) {
          return;
        }

        const { locked, x } = wheelStateRef.current;
        const measuredWidth = trackNode.getBoundingClientRect().width;
        if (locked && shouldDismiss({ distance: x, velocity: 0, width: measuredWidth })) {
          wheelSessionRef.current.cooldownUntil =
            performance.now() + WHEEL_COOLDOWN_MS;
          wheelSessionRef.current.ownerRunId = null;
          wheelStateRef.current = { locked: false, x: 0, y: 0 };
          acceptDismiss("wheel", x);
        } else {
          beginReturn();
        }
      }, WHEEL_SETTLE_MS);
    };

    trackNode.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      trackNode.removeEventListener("wheel", handleWheel);
      clearTimer(wheelSettleTimerRef);
      wheelStateRef.current = { locked: false, x: 0, y: 0 };
      releaseWheelOwnership();
    };
  }, [
    acceptDismiss,
    beginReturn,
    clearTimer,
    enabled,
    expanded,
    releaseWheelOwnership,
    runId,
    trackNode,
    wheelSessionRef,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer(exitTimerRef);
      clearTimer(heightTimerRef);
      clearTimer(returnTimerRef);
      clearTimer(wheelSettleTimerRef);
      const pointerSession = pointerSessionRef.current;
      if (pointerSession) {
        try {
          trackNodeRef.current?.releasePointerCapture(pointerSession.pointerId);
        } catch {
          // The node may already be detached.
        }
      }
      pointerSessionRef.current = null;
      releaseWheelOwnership();
    };
  }, [clearTimer, releaseWheelOwnership]);

  const style: CSSProperties & {
    "--fuma-task-dismiss-height"?: string;
    "--fuma-task-dismiss-x": string;
  } = {
    "--fuma-task-dismiss-x": `${visual.x}px`,
  };
  if (visual.height != null) {
    style["--fuma-task-dismiss-height"] = `${visual.height}px`;
  }
  const isAccepted =
    visual.phase === "exiting" || visual.phase === "collapsing";

  return {
    dismissFromKeyboard,
    trackProps: {
      "aria-hidden": isAccepted ? true : undefined,
      "data-dismissible": enabled ? "true" : undefined,
      "data-dismiss-phase": visual.phase,
      inert: isAccepted ? true : undefined,
      onPointerCancel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      style,
    },
    trackRef,
  };
}
