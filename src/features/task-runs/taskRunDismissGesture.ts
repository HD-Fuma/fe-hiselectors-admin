const MIN_DISTANCE = 72;
const MAX_DISTANCE = 120;
const DISTANCE_RATIO = 0.32;
const MIN_FLICK_DISTANCE = 32;
const FLICK_VELOCITY = 0.55;
const VELOCITY_WINDOW = 100;
const LINE_DELTA = 16;

export type PointerSample = {
  x: number;
  time: number;
};

export function dismissDistance(width: number): number {
  return Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, width * DISTANCE_RATIO));
}

export function normalizeWheelDelta(delta: number, deltaMode: number, pageSize: number): number {
  if (deltaMode === 1) return delta * LINE_DELTA;
  if (deltaMode === 2) return delta * pageSize;
  return delta;
}

export function shouldLockHorizontal(absX: number, absY: number): boolean {
  return Math.abs(absX) > 4 && Math.abs(absX) > Math.abs(absY) * 1.15;
}

export function recentVelocity(samples: PointerSample[], now: number): number {
  const recent = samples.filter(
    (sample) => sample.time <= now && now - sample.time <= VELOCITY_WINDOW,
  );
  const pair = recent.slice(-2);
  if (pair.length < 2) return 0;

  const [first, last] = pair;
  const elapsed = last.time - first.time;
  if (elapsed <= 0) return 0;
  return (last.x - first.x) / elapsed;
}

export function shouldDismiss({
  distance,
  velocity,
  width,
}: {
  distance: number;
  velocity: number;
  width: number;
}): boolean {
  return (
    Math.abs(distance) >= dismissDistance(width) ||
    (Math.abs(distance) >= MIN_FLICK_DISTANCE && Math.abs(velocity) >= FLICK_VELOCITY)
  );
}
