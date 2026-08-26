import { describe, expect, test } from "vitest";
import { contentChartEdgeScrollSpeed } from "./contentChartEdgeScroll";

describe("contentChartEdgeScrollSpeed", () => {
  test("scrolls toward a nearby edge and stops in the center", () => {
    expect(contentChartEdgeScrollSpeed(8, 0, 500)).toBe(-5);
    expect(contentChartEdgeScrollSpeed(250, 0, 500)).toBe(0);
    expect(contentChartEdgeScrollSpeed(495, 0, 500)).toBe(6);
  });
});
