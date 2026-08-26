import { describe, expect, test } from "vitest";
import { contentChartDraggedScrollLeft, contentChartEdgeScrollSpeed } from "./contentChartEdgeScroll";

describe("contentChartEdgeScrollSpeed", () => {
  test("scrolls toward a nearby edge and stops in the center", () => {
    expect(contentChartEdgeScrollSpeed(70, 0, 500)).toBe(-3);
    expect(contentChartEdgeScrollSpeed(250, 0, 500)).toBe(0);
    expect(contentChartEdgeScrollSpeed(495, 0, 500)).toBe(6);
  });

  test("moves the chart opposite to the pointer drag", () => {
    expect(contentChartDraggedScrollLeft(100, 300, 220)).toBe(180);
    expect(contentChartDraggedScrollLeft(100, 300, 360)).toBe(40);
  });
});
