import { API_BASE_URL } from "./apiBaseUrl";

test("uses the production API as the shared default", () => {
  expect(API_BASE_URL).toBe("https://api.hiselectors.shop");
});
