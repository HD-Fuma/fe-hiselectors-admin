export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

export function formatWon(amount: number) {
  return `${formatNumber(amount)}원`;
}
