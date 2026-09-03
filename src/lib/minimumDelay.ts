/**
 * 즉시 끝나는 작업이 진행 중으로 보이도록 최소 시간을 채운다.
 *
 * 데모용 작업은 저장된 데이터를 되살리기만 해 수십 ms 만에 끝난다. 버튼이 눌린
 * 티도 나기 전에 결과가 바뀌면 조작이 반영됐는지 알기 어려우므로, 실제 수집과
 * 비슷한 체감 시간을 준다. 작업이 더 오래 걸리면 그 시간을 그대로 쓴다.
 */
export async function withMinimumDelay<T>(minimumMs: number, task: () => Promise<T>) {
  const [result] = await Promise.all([
    task(),
    new Promise((resolve) => { setTimeout(resolve, minimumMs); }),
  ]);
  return result as T;
}
