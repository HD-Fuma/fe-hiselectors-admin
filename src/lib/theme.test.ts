import indexHtml from "../../index.html?raw";
import { getTheme } from "./theme";

afterEach(() => {
  localStorage.removeItem("selectors-theme");
});

test.each([
  [null, "light"],
  ["sepia", "light"],
  ["light", "light"],
  ["dark", "dark"],
] as const)("resolves stored theme %s to %s", (storedTheme, expectedTheme) => {
  if (storedTheme !== null) {
    localStorage.setItem("selectors-theme", storedTheme);
  }

  expect(getTheme()).toBe(expectedTheme);
});

test("starts the document with the same light theme fallback", () => {
  expect(indexHtml).toContain(
    'const theme = storedTheme === "dark" ? "dark" : "light";',
  );
});
