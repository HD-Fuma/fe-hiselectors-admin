import { getFastMode, saveFastMode } from "./fastMode";

afterEach(() => localStorage.removeItem("selectors-content-fast-mode"));

test("persists fast mode as an opt-in browser setting", () => {
  expect(getFastMode()).toBe(false);

  saveFastMode(true);
  expect(getFastMode()).toBe(true);

  saveFastMode(false);
  expect(getFastMode()).toBe(false);
});
