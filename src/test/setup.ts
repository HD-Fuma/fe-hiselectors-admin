import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { resetAdminApplicationCache } from "../entities/application";
afterEach(() => {
  cleanup();
  resetAdminApplicationCache();
});
