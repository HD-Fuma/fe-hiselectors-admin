import { describe, expect, test } from "vitest";
import { recentDiscoveryGlowUntil } from "./recentDiscoveryGlow";

describe("recent discovery glow", () => {
  test("ends exactly ten minutes after discovery", () => {
    const discoveredAt = "2026-09-03T12:34:56+09:00";

    expect(recentDiscoveryGlowUntil(discoveredAt))
      .toBe(Date.parse(discoveredAt) + 10 * 60 * 1000);
  });

  test.each([null, "not-a-date"])("ignores an unusable discovery time: %s", (discoveredAt) => {
    expect(recentDiscoveryGlowUntil(discoveredAt)).toBeUndefined();
  });
});
