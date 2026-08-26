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
