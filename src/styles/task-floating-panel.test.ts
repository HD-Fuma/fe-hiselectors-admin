import { describe, expect, test } from "vitest";
import taskFloatingPanelStyles from "./task-floating-panel.css?raw";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ruleFor(selector: string) {
  const match = taskFloatingPanelStyles.match(
    new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`),
  );

  expect(match, `missing CSS rule for ${selector}`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("TaskRun floating panel layout", () => {
  test("fixes the capsule bottom-right within a viewport-wide gesture stage", () => {
    const panelRule = ruleFor(".fuma-task-run-panel");
    const headerRule = ruleFor(".fuma-task-run-panel__header");
    const listRule = ruleFor(".fuma-task-run-panel__list");

    expect(panelRule).toMatch(/position:\s*fixed;/);
    expect(panelRule).toMatch(/left:\s*0;/);
    expect(panelRule).toMatch(/right:\s*0;/);
    expect(panelRule).toMatch(/bottom:\s*var\(--hsas-space-20\);/);
    expect(panelRule).toMatch(/width:\s*auto;/);
    expect(panelRule).toMatch(/padding:\s*0 var\(--hsas-space-20\);/);
    expect(panelRule).toMatch(/overflow-x:\s*hidden;/);
    expect(panelRule).toMatch(/overflow-y:\s*auto;/);
    expect(panelRule).toMatch(/pointer-events:\s*none;/);
    expect(headerRule).toMatch(/width:\s*min\(380px, 100%\);/);
    expect(headerRule).toMatch(/margin-left:\s*auto;/);
    expect(headerRule).toMatch(/pointer-events:\s*auto;/);
    expect(listRule).toMatch(/display:\s*grid;/);
    expect(listRule).toMatch(/gap:\s*var\(--hsas-space-10\);/);
    expect(listRule).toMatch(/width:\s*min\(380px, 100%\);/);
    expect(listRule).toMatch(/margin-left:\s*auto;/);
    expect(listRule).toMatch(/pointer-events:\s*auto;/);
  });

  test("keeps every track in normal flow without card stacking", () => {
    const trackRule = ruleFor(".fuma-task-run-track");

    expect(trackRule).toMatch(/position:\s*relative;/);
    expect(trackRule).toMatch(/margin:\s*0;/);
    expect(trackRule).not.toMatch(/position:\s*absolute;/);
    expect(trackRule).not.toMatch(/margin(?:-\w+)?:\s*-/);
  });

  test("collapses the list without isolating card backdrop filters", () => {
    const expandedRule = ruleFor(".fuma-task-run-panel__list-viewport");
    const collapsedRule = ruleFor(
      '.fuma-task-run-panel[data-expanded="false"] .fuma-task-run-panel__list-viewport',
    );
    const contentRule = ruleFor(".fuma-task-run-panel__list-viewport > div");
    const collapsedContentRule = ruleFor(
      '.fuma-task-run-panel[data-expanded="false"] .fuma-task-run-panel__list-viewport > div',
    );

    expect(expandedRule).toMatch(/grid-template-rows:\s*1fr;/);
    expect(expandedRule).toMatch(/grid-template-rows 240ms ease/);
    expect(expandedRule).not.toMatch(/transform:/);
    expect(collapsedRule).toMatch(/grid-template-rows:\s*0fr;/);
    expect(collapsedRule).not.toMatch(/transform:/);
    expect(contentRule).toMatch(/min-height:\s*0;/);
    expect(contentRule).toMatch(/overflow:\s*hidden;/);
    expect(contentRule).toMatch(/transform-origin:\s*bottom;/);
    expect(contentRule).not.toMatch(/clip-path:/);
    expect(contentRule).toMatch(/transform:\s*none;/);
    expect(contentRule).toMatch(/transform 240ms cubic-bezier/);
    expect(collapsedContentRule).toMatch(
      /transform:\s*translateY\(var\(--hsas-space-12\)\);/,
    );
  });

  test("keeps vertical scrolling while clipping dismiss motion only at screen edges", () => {
    const panelRule = ruleFor(".fuma-task-run-panel");
    const contentRule = ruleFor(".fuma-task-run-panel__list-viewport > div");

    expect(panelRule).toMatch(/overflow-x:\s*hidden;/);
    expect(panelRule).toMatch(/overflow-y:\s*auto;/);
    expect(contentRule).toMatch(/overflow:\s*hidden;/);
    expect(taskFloatingPanelStyles).not.toMatch(
      /:has\(\.fuma-task-run-track\[data-dismiss-phase=/,
    );
  });

  test("keeps 12px mobile edges with viewport padding", () => {
    const mobileBlock = taskFloatingPanelStyles.match(
      /@media \(max-width:\s*480px\)\s*\{([\s\S]*?)\n\}/,
    )?.[1];

    expect(mobileBlock).toMatch(/right:\s*0;/);
    expect(mobileBlock).toMatch(/bottom:\s*var\(--hsas-space-12\);/);
    expect(mobileBlock).toMatch(/left:\s*0;/);
    expect(mobileBlock).toMatch(/padding:\s*0 var\(--hsas-space-12\);/);
  });
});

describe("TaskRun floating panel surfaces", () => {
  test("adds static specular layers to both glass surfaces", () => {
    const headerRule = ruleFor(".fuma-task-run-panel__header");
    const surfaceRule = ruleFor(".fuma-task-run-card-surface");
    const sharedSheenRule = taskFloatingPanelStyles.match(
      /\.fuma-task-run-panel__header::before,\s*\.fuma-task-run-card-surface::before\s*\{([^}]*)\}/,
    )?.[1];

    expect(headerRule).toMatch(/position:\s*relative;/);
    expect(surfaceRule).toMatch(/position:\s*relative;/);
    expect(sharedSheenRule).toMatch(/position:\s*absolute;/);
    expect(sharedSheenRule).toMatch(/inset:\s*1px;/);
    expect(sharedSheenRule).toMatch(/border-radius:\s*inherit;/);
    expect(sharedSheenRule).toMatch(/background:\s*radial-gradient/);
    expect(sharedSheenRule).toMatch(/pointer-events:\s*none;/);
  });

  test("uses a translucent local glass material for the title capsule", () => {
    const panelRule = ruleFor(".fuma-task-run-panel");
    const headerRule = ruleFor(".fuma-task-run-panel__header");
    const titleRule = ruleFor(".fuma-task-run-panel__title");
    const countRule = ruleFor(".fuma-task-run-panel__count");
    const collapseRule = ruleFor(".fuma-task-run-panel__collapse");
    const closeRule = ruleFor(".fuma-task-run-panel__close");

    expect(panelRule).toMatch(
      /--fuma-task-glass-surface:\s*rgb\(255 255 255 \/ 58%\);/,
    );
    expect(panelRule).toMatch(
      /--fuma-task-glass-border:\s*rgb\(255 255 255 \/ 78%\);/,
    );
    expect(headerRule).toMatch(
      /border:\s*1px solid var\(--fuma-task-glass-border\);/,
    );
    expect(headerRule).toMatch(
      /background-color:\s*var\(--fuma-task-glass-surface\);/,
    );
    expect(headerRule).toMatch(
      /backdrop-filter:\s*blur\(24px\) saturate\(1\.3\) brightness\(1\.04\);/,
    );
    expect(headerRule).toMatch(
      /border-radius:\s*calc\(var\(--hsas-sidebar-radius\) \* 3\);/,
    );
    expect(titleRule).toMatch(/color:\s*var\(--fuma-task-glass-ink\);/);
    expect(countRule).toMatch(/color:\s*rgb\(32 34 36 \/ 58%\);/);
    expect(collapseRule).toMatch(
      /border:\s*1px solid var\(--fuma-task-glass-control-border\);/,
    );
    expect(collapseRule).toMatch(
      /background:\s*var\(--fuma-task-glass-control-surface\);/,
    );
    expect(collapseRule).toMatch(/color:\s*var\(--fuma-task-glass-ink\);/);
    expect(closeRule).toMatch(
      /border:\s*1px solid var\(--fuma-task-glass-control-border\);/,
    );
  });

  test("uses the same translucent material on task cards", () => {
    const surfaceRule = ruleFor(".fuma-task-run-card-surface");
    const cardRule = ruleFor(".fuma-task-run-card");
    const trackRule = ruleFor(".fuma-task-run-track");

    expect(surfaceRule).toMatch(
      /border:\s*1px solid var\(--fuma-task-glass-border\);/,
    );
    expect(surfaceRule).toMatch(
      /border-radius:\s*calc\(var\(--hsas-sidebar-radius\) \* 3\);/,
    );
    expect(surfaceRule).toMatch(
      /background-color:\s*var\(--fuma-task-glass-surface\);/,
    );
    expect(surfaceRule).not.toMatch(/backdrop-filter/);
    expect(trackRule).toMatch(
      /backdrop-filter:\s*blur\(24px\) saturate\(1\.3\) brightness\(1\.04\);/,
    );
    expect(surfaceRule).toMatch(
      /box-shadow:\s*var\(--fuma-task-glass-shadow\);/,
    );
    expect(cardRule).toMatch(
      /padding:\s*var\(--hsas-space-14\) var\(--hsas-space-16\);/,
    );
  });

  test("ships one glass material path", () => {
    expect(taskFloatingPanelStyles).not.toMatch(
      /fuma-task-run-(?:panel|card)--(?:dark|light)/,
    );
    expect(taskFloatingPanelStyles).not.toMatch(/liquid/i);
    expect(ruleFor(".fuma-task-run-card")).toMatch(
      /background:\s*transparent;/,
    );
  });
});

describe("TaskRun floating panel interaction styling", () => {
  test("prevents accidental text selection", () => {
    expect(ruleFor(".fuma-task-run-panel")).toMatch(/user-select:\s*none;/);
  });

  test("aligns every status pill without a visible terminal action", () => {
    const terminalRule = ruleFor(".fuma-task-run-card__terminal");
    const footerRule = ruleFor(".fuma-task-run-card__terminal-footer");

    expect(terminalRule).toMatch(
      /grid-template-columns:\s*var\(--hsas-space-18\) minmax\(0, 1fr\);/,
    );
    expect(footerRule).toMatch(/display:\s*flex;/);
    expect(footerRule).toMatch(/justify-content:\s*space-between;/);
    expect(footerRule).toMatch(/gap:\s*var\(--hsas-space-10\);/);
    expect(taskFloatingPanelStyles).not.toContain(
      ".fuma-task-run-card__swipe-dismiss",
    );
  });

  test("reserves vertical touch scrolling for terminal dismiss tracks", () => {
    expect(ruleFor('.fuma-task-run-track[data-dismissible="true"]')).toMatch(
      /touch-action:\s*pan-y;/,
    );
  });

  test("does not add a visible swipe hint or hint motion", () => {
    const keyboardFallbackRule = ruleFor(
      ".fuma-task-run-card__accessible-dismiss:focus-visible",
    );

    expect(taskFloatingPanelStyles).not.toContain("swipe-dismiss");
    expect(taskFloatingPanelStyles).not.toMatch(
      /\.fuma-task-run-track:(?:hover|focus-within)[^{]*\{[^}]*translateX/,
    );
    expect(keyboardFallbackRule).toMatch(/clip:\s*auto;/);
    expect(keyboardFallbackRule).toMatch(/width:\s*auto;/);
  });

  test("uses the measured offset and Apple-like return, exit, and collapse timing", () => {
    const trackRule = ruleFor(".fuma-task-run-track");
    const returningRule = ruleFor(
      '.fuma-task-run-track[data-dismiss-phase="returning"]',
    );
    const exitingRule = ruleFor(
      '.fuma-task-run-track[data-dismiss-phase="exiting"]',
    );
    const collapsingRule = ruleFor(
      '.fuma-task-run-track[data-dismiss-phase="collapsing"]',
    );

    expect(trackRule).toMatch(
      /height:\s*var\(--fuma-task-dismiss-height, auto\);/,
    );
    expect(trackRule).toMatch(
      /transform:\s*translate3d\(var\(--fuma-task-dismiss-x, 0\), 0, 0\);/,
    );
    expect(returningRule).toMatch(/transform 400ms cubic-bezier/);
    expect(exitingRule).toMatch(/transform 240ms cubic-bezier/);
    expect(collapsingRule).toMatch(/height:\s*0;/);
    expect(collapsingRule).toMatch(/height 180ms cubic-bezier/);
  });

  test("turns off every panel transition and pulse under reduced motion", () => {
    const reducedMotionBlock = taskFloatingPanelStyles.match(
      /@media \(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)\}\s*$/,
    )?.[1];

    expect(reducedMotionBlock).toContain(".fuma-task-run-panel__collapse svg");
    expect(reducedMotionBlock).toContain(".fuma-task-run-panel__list-viewport");
    expect(reducedMotionBlock).toContain(
      ".fuma-task-run-panel__list-viewport > div",
    );
    expect(reducedMotionBlock).not.toContain("swipe-dismiss");
    expect(reducedMotionBlock).toContain(
      '.fuma-task-run-track[data-dismiss-phase="returning"]',
    );
    expect(reducedMotionBlock).toContain(
      '.fuma-task-run-track[data-dismiss-phase="exiting"]',
    );
    expect(reducedMotionBlock).toContain(
      '.fuma-task-run-track[data-dismiss-phase="collapsing"]',
    );
    expect(reducedMotionBlock).toMatch(/transition:\s*none;/);
    expect(reducedMotionBlock).toMatch(
      /\.fuma-task-run-card__loading-dot\s*\{[^}]*animation:\s*none;/,
    );
  });
});
