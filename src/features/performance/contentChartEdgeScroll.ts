export function contentChartEdgeScrollSpeed(clientX: number, left: number, right: number) {
  const edgeWidth = 88;
  const leftDistance = clientX - left;
  const rightDistance = right - clientX;

  if (leftDistance < edgeWidth) {
    return -6 * Math.pow(Math.min(1, (edgeWidth - leftDistance) / edgeWidth), 1.8);
  }
  if (rightDistance < edgeWidth) {
    return 6 * Math.pow(Math.min(1, (edgeWidth - rightDistance) / edgeWidth), 1.8);
  }
  return 0;
}

export function contentChartEdgeScrollVelocity(current: number, target: number) {
  const next = current + (target - current) * 0.1;
  return !target && Math.abs(next) < 0.05 ? 0 : next;
}

export function contentChartDraggedScrollLeft(startScrollLeft: number, startX: number, currentX: number) {
  return startScrollLeft - (currentX - startX);
}

export function contentChartDragVelocity(
  previousVelocity: number,
  previousX: number,
  currentX: number,
  elapsedMs: number,
) {
  const instantVelocity = ((previousX - currentX) * 16) / Math.max(elapsedMs, 8);
  return Math.max(-28, Math.min(28, previousVelocity * 0.55 + instantVelocity * 0.45));
}

export function contentChartMomentumVelocity(velocity: number) {
  const nextVelocity = velocity * 0.94;
  return Math.abs(nextVelocity) < 0.15 ? 0 : nextVelocity;
}
