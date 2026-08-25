export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

export function formatWon(amount: number) {
  return `${formatNumber(amount)}원`;
}

export function formatCompactCount(value: number) {
  return value >= 10000
    ? value.toLocaleString("ko-KR", { maximumFractionDigits: 1, notation: "compact" })
    : formatNumber(value);
}
