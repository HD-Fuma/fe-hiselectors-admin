import { describe, expect, it } from 'vitest';

import {
  dismissDistance,
  normalizeWheelDelta,
  recentVelocity,
  shouldDismiss,
  shouldLockHorizontal,
  type PointerSample,
} from './taskRunDismissGesture';

describe('task run dismiss gesture math', () => {
  it('clamps the width-based dismiss distance', () => {
    expect(dismissDistance(200)).toBe(72);
    expect(dismissDistance(300)).toBe(96);
    expect(dismissDistance(500)).toBe(120);
  });

  it('normalizes wheel deltas by delta mode', () => {
    expect(normalizeWheelDelta(2, 0, 380)).toBe(2);
    expect(normalizeWheelDelta(2, 1, 380)).toBe(32);
    expect(normalizeWheelDelta(2, 2, 380)).toBe(760);
    expect(normalizeWheelDelta(-2, 1, 380)).toBe(-32);
  });

  it('locks only when horizontal movement is strictly dominant', () => {
    expect(shouldLockHorizontal(12, 8)).toBe(true);
    expect(shouldLockHorizontal(8, 12)).toBe(false);
    expect(shouldLockHorizontal(4, 0)).toBe(false);
    expect(shouldLockHorizontal(4.01, 0)).toBe(true);
    expect(shouldLockHorizontal(11.5, 10)).toBe(false);
    expect(shouldLockHorizontal(11.51, 10)).toBe(true);
    expect(shouldLockHorizontal(-12, 8)).toBe(true);
  });

  it('dismisses after distance or a sufficiently fast flick', () => {
    expect(shouldDismiss({ distance: 97, velocity: 0.1, width: 300 })).toBe(true);
    expect(shouldDismiss({ distance: 40, velocity: 0.56, width: 300 })).toBe(true);
    expect(shouldDismiss({ distance: 31, velocity: 1, width: 300 })).toBe(false);
    expect(shouldDismiss({ distance: -97, velocity: 0.1, width: 300 })).toBe(true);
  });

  it('uses the last two valid samples for recent velocity', () => {
    const samples: PointerSample[] = [
      { x: 0, time: 0 },
      { x: 24, time: 60 },
      { x: 54, time: 90 },
    ];
    expect(recentVelocity(samples, 100)).toBe(1);
    expect(recentVelocity([{ x: 0, time: 0 }, { x: 60, time: 80 }], 200)).toBe(0);
    expect(recentVelocity([{ x: 0, time: 0 }], 0)).toBe(0);
    expect(recentVelocity([{ x: 0, time: 10 }, { x: 10, time: 10 }], 10)).toBe(0);
    expect(recentVelocity([{ x: 10, time: 20 }, { x: 0, time: 10 }], 20)).toBe(0);
  });
});
