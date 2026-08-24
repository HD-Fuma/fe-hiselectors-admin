export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

export function formatWon(amount: number) {
  return `${formatNumber(amount)}원`;
}

export function formatCompactCount(value: number) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}만`;
  return formatNumber(value);
}
