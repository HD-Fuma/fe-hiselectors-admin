import { describe, expect, test } from "vitest";
import adminStyles from "./admin.css?raw";
import contentInspectionStyles from "./content-inspection.css?raw";
import dashboardStyles from "./dashboard.css?raw";
import globalStyles from "./global.css?raw";
import loginStyles from "./login.css?raw";
import performanceStyles from "./performance-dashboard.css?raw";
import accountStyles from "./sidebar-account.css?raw";
import brandStyles from "./sidebar-brand.css?raw";
import taskFloatingPanelStyles from "./task-floating-panel.css?raw";
import tokensSource from "./tokens.css?raw";

const styleFiles = [
  { file: "admin.css", source: adminStyles },
  { file: "content-inspection.css", source: contentInspectionStyles },
  { file: "dashboard.css", source: dashboardStyles },
  { file: "global.css", source: globalStyles },
  { file: "login.css", source: loginStyles },
  { file: "performance-dashboard.css", source: performanceStyles },
  { file: "sidebar-account.css", source: accountStyles },
  { file: "sidebar-brand.css", source: brandStyles },
  { file: "task-floating-panel.css", source: taskFloatingPanelStyles },
] as const;
const definedTokens = new Set(
  [...tokensSource.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]),
);

const spacingDeclaration = /(?:^|[;{]\s*)(?:gap|row-gap|column-gap|margin(?:-(?:top|right|bottom|left|block|inline))?|padding(?:-(?:top|right|bottom|left|block|inline))?)\s*:\s*([^;}]+)/gm;
const rawPixelValue = /(?<![-\w.])\d+(?:\.\d+)?px\b/;

describe("CSS design tokens", () => {
  test("uses typography and spacing scales in every component stylesheet", () => {
    for (const { file, source } of styleFiles) {
      const fontSizeValues = [...source.matchAll(/font-size\s*:\s*([^;}]+)/g)].map(
        (match) => match[1],
      );
      const spacingValues = [...source.matchAll(spacingDeclaration)].map((match) => match[1]);

      expect(
        fontSizeValues.filter((value) => rawPixelValue.test(value)),
        `${file} contains raw font sizes`,
      ).toEqual([]);
      expect(
        spacingValues.filter((value) => rawPixelValue.test(value)),
        `${file} contains raw spacing values`,
      ).toEqual([]);
    }
  });

  test("defines every shared scale and palette token that styles reference", () => {
    const sharedTokenReferences = styleFiles.flatMap(({ source }) =>
      [...source.matchAll(/var\((--hsas-(?:font|space|color)-[\w-]+)/g)].map(
        (match) => match[1],
      ),
    );

    expect([...new Set(sharedTokenReferences)].filter((token) => !definedTokens.has(token))).toEqual([]);
  });
});

describe("shared component visual contracts", () => {
  test("renders the inspection session help as liquid glass", () => {
    const sessionHelpRule = contentInspectionStyles.match(
      /\.fuma-content-inspection-studio__session-help\s*\{([^}]*)\}/,
    )?.[1];

    expect(sessionHelpRule).toMatch(/overflow:\s*hidden;/);
    expect(sessionHelpRule).toMatch(/border:\s*1px solid rgb\(255 255 255 \/ 78%\);/);
    expect(sessionHelpRule).toMatch(/border-radius:\s*24px;/);
    expect(sessionHelpRule).toMatch(/background:\s*rgb\(255 255 255 \/ 58%\);/);
    expect(sessionHelpRule).toMatch(/backdrop-filter:\s*blur\(24px\) saturate\(1\.15\);/);
    expect(sessionHelpRule).toMatch(/top:\s*50%;/);
    expect(sessionHelpRule).toMatch(/bottom:\s*auto;/);
    expect(sessionHelpRule).toMatch(/translate:\s*-50% -50%;/);
    expect(sessionHelpRule).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\);/);
  });

  test("separates red violation bubbles from highlighted body copy", () => {
    const bubbleRule = contentInspectionStyles.match(
      /(?:^|\n)\.fuma-inspection-violation-bubble\s*\{([^}]*)\}/,
    )?.[1];
    const highlightRule = contentInspectionStyles.match(
      /(?:^|\n)\.fuma-inspection-text-violation__highlight\s*\{([^}]*)\}/,
    )?.[1];

    expect(bubbleRule).toMatch(/background:\s*var\(--hsas-color-danger\);/);
    expect(bubbleRule).toMatch(/border-radius:\s*12px 12px 12px 4px;/);
    expect(highlightRule).toMatch(/background:\s*rgb\(180 35 24 \/ 14%\);/);
  });

  test("keeps selected content cards free of a selection outline", () => {
    expect(contentInspectionStyles).not.toMatch(
      /\.fuma-content-inspection-studio__version\[data-selected="true"\]\s*>\s*\.fuma-minimal-version-card\s*\{[^}]*outline/s,
    );
  });

  test("draws the dense table top edge with the same border as its grid cells", () => {
    const headerRule = adminStyles.match(/\.hsas-dense-table th\s*\{([^}]*)\}/)?.[1];
    const wrapperRule = adminStyles.match(/\.hsas-dense-table-wrap\s*\{([^}]*)\}/)?.[1];

    expect(headerRule).toMatch(/border-top:\s*1px solid #d9dde0;/);
    expect(wrapperRule).not.toMatch(/border-top\s*:/);
  });

  test("keeps approved task statuses readable on glass floating cards", () => {
    const approvedTaskStatusRule = taskFloatingPanelStyles.match(
      /\.fuma-task-run-card__status\.hsas-status-pill--approved\s*\{([^}]*)\}/,
    )?.[1];

    expect(approvedTaskStatusRule).toMatch(
      /background:\s*var\(--fuma-task-glass-control-surface\);/,
    );
    expect(approvedTaskStatusRule).toMatch(
      /color:\s*var\(--fuma-task-glass-ink\);/,
    );
  });

  test("uses white sidebar surfaces only in light mode", () => {
    const lightThemeTokens = tokensSource.match(
      /:root\[data-sidebar-theme="light"\]\s*\{([^}]*)\}/,
    )?.[1];

    expect(lightThemeTokens).toMatch(
      /--hsas-sidebar-background:\s*var\(--hsas-surface\);/,
    );
    expect(lightThemeTokens).toMatch(
      /--hsas-sidebar-surface:\s*var\(--hsas-surface\);/,
    );
    expect(lightThemeTokens).toMatch(
      /--hsas-sidebar-strong-text:\s*var\(--hsas-text\);/,
    );
    expect(lightThemeTokens).toMatch(
      /--hsas-sidebar-active:\s*var\(--hsas-color-black\);/,
    );
    expect(lightThemeTokens).toMatch(
      /--hsas-sidebar-active-text:\s*var\(--hsas-color-white\);/,
    );
    expect(lightThemeTokens).toMatch(
      /--hsas-sidebar-hover:\s*#eee;/,
    );
  });
});
