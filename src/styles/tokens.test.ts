import { describe, expect, test } from "vitest";
import adminStyles from "./admin.css?raw";
import contentReviewStyles from "./content-review.css?raw";
import globalStyles from "./global.css?raw";
import loginStyles from "./login.css?raw";
import performanceStyles from "./performance-dashboard.css?raw";
import accountStyles from "./sidebar-account.css?raw";
import brandStyles from "./sidebar-brand.css?raw";
import tokensSource from "./tokens.css?raw";

const styleFiles = [
  { file: "admin.css", source: adminStyles },
  { file: "content-review.css", source: contentReviewStyles },
  { file: "global.css", source: globalStyles },
  { file: "login.css", source: loginStyles },
  { file: "performance-dashboard.css", source: performanceStyles },
  { file: "sidebar-account.css", source: accountStyles },
  { file: "sidebar-brand.css", source: brandStyles },
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
