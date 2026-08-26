export function contentChartEdgeScrollSpeed(clientX: number, left: number, right: number) {
  const edgeWidth = 88;
  const leftDistance = clientX - left;
  const rightDistance = right - clientX;

  if (leftDistance < edgeWidth) {
    return -Math.min(6, Math.ceil((edgeWidth - leftDistance) / 8));
  }
  if (rightDistance < edgeWidth) {
    return Math.min(6, Math.ceil((edgeWidth - rightDistance) / 8));
  }
  return 0;
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
