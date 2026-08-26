import { describe, expect, test } from "vitest";
import {
  contentChartDraggedScrollLeft,
  contentChartDragVelocity,
  contentChartEdgeScrollSpeed,
  contentChartMomentumVelocity,
} from "./contentChartEdgeScroll";

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

  test("carries drag velocity into a gradually slowing glide", () => {
    const velocity = contentChartDragVelocity(0, 300, 220, 16);
    expect(velocity).toBe(28);
    expect(contentChartMomentumVelocity(velocity)).toBeCloseTo(26.32);
    expect(contentChartMomentumVelocity(0.1)).toBe(0);
  });
});
