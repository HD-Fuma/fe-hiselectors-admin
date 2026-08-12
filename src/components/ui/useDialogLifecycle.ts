import { useEffect, useRef, type RefObject } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface BackgroundElementState {
  ariaHidden: string | null;
  count: number;
  inert: boolean;
}

interface BodyScrollState {
  count: number;
  overflow: string;
}

const backgroundElementStates = new WeakMap<HTMLElement, BackgroundElementState>();
const bodyScrollStates = new WeakMap<HTMLElement, BodyScrollState>();

function focusableElements(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.tabIndex >= 0 && !element.closest("[hidden], [inert]"),
  );
}

function isolateBackgroundElement(element: HTMLElement) {
  const existingState = backgroundElementStates.get(element);

  if (existingState) {
    existingState.count += 1;
    return;
  }

  backgroundElementStates.set(element, {
    ariaHidden: element.getAttribute("aria-hidden"),
    count: 1,
    inert: element.hasAttribute("inert"),
  });
  element.setAttribute("aria-hidden", "true");
  element.setAttribute("inert", "");
}

function restoreBackgroundElement(element: HTMLElement) {
  const state = backgroundElementStates.get(element);
  if (!state) {
    return;
  }

  state.count -= 1;
  if (state.count > 0) {
    return;
  }

  if (state.ariaHidden == null) {
    element.removeAttribute("aria-hidden");
  } else {
    element.setAttribute("aria-hidden", state.ariaHidden);
  }

  if (!state.inert) {
    element.removeAttribute("inert");
  }
  backgroundElementStates.delete(element);
}

function lockBodyScroll(body: HTMLElement) {
  const existingState = bodyScrollStates.get(body);

  if (existingState) {
    existingState.count += 1;
    return;
  }

  bodyScrollStates.set(body, {
    count: 1,
    overflow: body.style.overflow,
  });
  body.style.overflow = "hidden";
}

function unlockBodyScroll(body: HTMLElement) {
  const state = bodyScrollStates.get(body);
  if (!state) {
    return;
  }

  state.count -= 1;
  if (state.count > 0) {
    return;
  }

  body.style.overflow = state.overflow;
  bodyScrollStates.delete(body);
}

interface DialogLifecycleOptions<
  TBackdrop extends HTMLElement,
  TDialog extends HTMLElement,
> {
  active?: boolean;
  backdropRef: RefObject<TBackdrop | null>;
  dialogRef: RefObject<TDialog | null>;
  initialFocusSelector?: string;
  onClose?: () => void;
}

export function useDialogLifecycle<
  TBackdrop extends HTMLElement,
  TDialog extends HTMLElement,
>({
  active = true,
  backdropRef,
  dialogRef,
  initialFocusSelector,
  onClose,
}: DialogLifecycleOptions<TBackdrop, TDialog>) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active || typeof document === "undefined") {
      return undefined;
    }

    const backdrop = backdropRef.current;
    const dialog = dialogRef.current;
    if (!backdrop || !dialog) {
      return undefined;
    }

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const backgroundElements = Array.from(document.body.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== backdrop,
    );

    lockBodyScroll(document.body);
    backgroundElements.forEach(isolateBackgroundElement);

    const elements = focusableElements(dialog);
    const initialFocus = initialFocusSelector
      ? elements.find((element) => element.matches(initialFocusSelector))
      : elements[0];
    (initialFocus ?? dialog).focus();

    const containFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentElements = focusableElements(dialog);
      if (currentElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = currentElements[0];
      const last = currentElements[currentElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", containFocus);

    return () => {
      dialog.removeEventListener("keydown", containFocus);
      backgroundElements.forEach(restoreBackgroundElement);
      unlockBodyScroll(document.body);

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [active, backdropRef, dialogRef, initialFocusSelector]);
}
