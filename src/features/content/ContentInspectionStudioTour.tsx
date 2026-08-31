import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface StudioTourStep {
  keyboardLabels?: readonly [string, string];
  showKeyboardHint?: boolean;
  showWheelHint?: boolean;
  skipWhenSingle?: boolean;
  target: string;
  text: string;
  tipPlacement?: "below" | "left";
}

export const STUDIO_TOUR_STEPS: readonly StudioTourStep[] = [
  {
    showWheelHint: true,
    skipWhenSingle: true,
    target: "queue",
    text: "마우스 휠로 스크롤하거나 이전, 다음을 눌러 검수할 콘텐츠를 선택합니다.",
  },
  {
    target: "versions",
    text: "검수가 필요한 콘텐츠를 확인할 수 있습니다. 텍스트 영역을 누르면 원문과 STT 추출물을 확인할 수 있습니다.",
  },
  {
    target: "profile",
    text: "프로필을 누르면 셀렉터스 상세 패널이 열립니다.",
  },
  {
    keyboardLabels: ["위반", "위반 허용"],
    showKeyboardHint: true,
    target: "report",
    text: "리포트에서 콘텐츠 요약과 위반 항목을 확인합니다. 위반·위반 허용 버튼이나 키보드 1·2로 판정할 수 있습니다.",
    tipPlacement: "left",
  },
  {
    keyboardLabels: ["최종 반려", "최종 승인"],
    showKeyboardHint: true,
    target: "decision",
    text: "버튼을 클릭하거나 최종 반려 시 키보드 1, 최종 승인 시 키보드 2를 눌러 최종 검수를 진행합니다.",
    tipPlacement: "left",
  },
];

function studioTourStepsForSession(singleInspection: boolean) {
  return STUDIO_TOUR_STEPS.filter((step) => !(singleInspection && step.skipWhenSingle));
}

interface ContentInspectionStudioTourProps {
  onClose: () => void;
  singleInspection: boolean;
}

export function ContentInspectionStudioTour({
  onClose,
  singleInspection,
}: ContentInspectionStudioTourProps) {
  const steps = useMemo(
    () => studioTourStepsForSession(singleInspection),
    [singleInspection],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<DOMRect | null>(null);
  const wheelLockedRef = useRef(false);
  const wheelReleaseTimerRef = useRef<number | null>(null);
  const step = steps[stepIndex] ?? null;
  const isLast = stepIndex >= steps.length - 1;

  useLayoutEffect(() => {
    if (!step) return undefined;

    const update = () => {
      const selectedDescription = document.querySelector<HTMLElement>(
        `.fuma-content-inspection-studio__version[data-selected="true"] [data-studio-tour="${step.target}"]`,
      );
      const target = selectedDescription
        ?? document.querySelector<HTMLElement>(`[data-studio-tour="${step.target}"]`);
      setSpotlight(target?.getBoundingClientRect() ?? null);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  useEffect(() => {
    wheelLockedRef.current = false;
    if (wheelReleaseTimerRef.current != null) {
      window.clearTimeout(wheelReleaseTimerRef.current);
      wheelReleaseTimerRef.current = null;
    }
  }, [stepIndex]);

  useEffect(() => {
    const goNext = () => {
      if (isLast) {
        onClose();
        return;
      }
      setStepIndex((current) => current + 1);
    };
    const goPrevious = () => {
      setStepIndex((current) => Math.max(0, current - 1));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      if (wheelLockedRef.current || Math.abs(event.deltaY) < 8) return;

      wheelLockedRef.current = true;
      if (wheelReleaseTimerRef.current != null) {
        window.clearTimeout(wheelReleaseTimerRef.current);
      }
      wheelReleaseTimerRef.current = window.setTimeout(() => {
        wheelLockedRef.current = false;
        wheelReleaseTimerRef.current = null;
      }, 280);

      if (event.deltaY > 0) {
        if (isLast) {
          onClose();
          return;
        }
        goNext();
        return;
      }
      goPrevious();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("wheel", onWheel, true);
      if (wheelReleaseTimerRef.current != null) {
        window.clearTimeout(wheelReleaseTimerRef.current);
      }
    };
  }, [isLast, onClose]);

  if (!step) return null;

  const advance = () => {
    if (isLast) onClose();
    else setStepIndex((current) => current + 1);
  };

  const pad = 10;
  const hole = spotlight
    ? {
        top: Math.max(8, spotlight.top - pad),
        left: Math.max(8, spotlight.left - pad),
        width: Math.min(window.innerWidth - 16, spotlight.width + pad * 2),
        height: Math.min(window.innerHeight - 16, spotlight.height + pad * 2),
      }
    : null;

  const tipWidth = 300;
  const tipHeightEstimate = 168;
  const edge = 16;
  const tipPlacement = step.tipPlacement ?? "below";

  let tipTop: number;
  let tipLeft: number;

  if (!hole) {
    tipTop = window.innerHeight / 2 - tipHeightEstimate / 2;
    tipLeft = window.innerWidth / 2 - tipWidth / 2;
  } else if (tipPlacement === "left") {
    tipLeft = Math.max(edge, hole.left - tipWidth - 14);
    tipTop = Math.min(
      window.innerHeight - tipHeightEstimate - edge,
      Math.max(edge, hole.top + hole.height / 2 - tipHeightEstimate / 2),
    );
  } else {
    tipTop = Math.min(
      window.innerHeight - tipHeightEstimate - edge,
      hole.top + hole.height + 14,
    );
    tipLeft = Math.min(
      window.innerWidth - tipWidth - edge,
      Math.max(edge, hole.left + hole.width / 2 - tipWidth / 2),
    );
  }

  return (
    <div
      aria-label="검수 도움말 가이드"
      aria-modal="true"
      className="fuma-content-inspection-studio__tour"
      onClick={advance}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          advance();
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div
        aria-hidden="true"
        className="fuma-content-inspection-studio__tour-mask"
      />
      {hole ? (
        <div
          aria-hidden="true"
          className="fuma-content-inspection-studio__tour-spotlight"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
          }}
        />
      ) : null}
      <div
        className="fuma-content-inspection-studio__tour-card"
        style={{ top: tipTop, left: tipLeft }}
      >
        {step.showWheelHint ? (
          <div
            aria-hidden="true"
            className="fuma-content-inspection-studio__tour-wheel"
          >
            <span className="fuma-content-inspection-studio__tour-wheel-body">
              <i className="fuma-content-inspection-studio__tour-wheel-dot" />
            </span>
          </div>
        ) : null}
        {step.showKeyboardHint ? (
          <div
            aria-hidden="true"
            className="fuma-content-inspection-studio__tour-keys"
          >
            <span className="fuma-content-inspection-studio__tour-key" data-key="1">
              <kbd>1</kbd>
              <small>{step.keyboardLabels?.[0] ?? "1"}</small>
            </span>
            <span className="fuma-content-inspection-studio__tour-key" data-key="2">
              <kbd>2</kbd>
              <small>{step.keyboardLabels?.[1] ?? "2"}</small>
            </span>
          </div>
        ) : null}
        <p>
          <small>
            {stepIndex + 1}
            {" / "}
            {steps.length}
          </small>
          <strong>{step.text}</strong>
        </p>
        <p className="fuma-content-inspection-studio__tour-hint">
          {isLast ? "클릭하거나 스크롤해서 완료" : "클릭하거나 스크롤해서 넘기기"}
        </p>
      </div>
    </div>
  );
}
