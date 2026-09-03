const STORAGE_KEY = "selectors-fast-demo-glow";
const GLOW_MS = 10 * 60 * 1000;

interface FastDemoGlow {
  ids: Set<number>;
  until: number;
}

/**
 * FAST 모드 데모 발굴로 되살린 계정을 잠시 "방금 발굴됨"으로 강조한다.
 *
 * 서버의 최초 발굴 시각(discovered_at)은 갱신하지 않으므로, 강조 대상은 화면에만
 * 남긴다. 유지 시간은 실제 발굴 글로우와 같은 10분이다.
 */
export function markFastDemoGlow(creatorIds: number[]) {
  if (creatorIds.length === 0) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ids: creatorIds,
      until: Date.now() + GLOW_MS,
    }));
  } catch {
    // 저장에 실패해도 발굴 결과 자체는 목록에 반영된다.
  }
}

export function readFastDemoGlow(): FastDemoGlow | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ids?: unknown; until?: unknown };
    const until = typeof parsed.until === "number" ? parsed.until : 0;
    if (!Array.isArray(parsed.ids) || until <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { ids: new Set(parsed.ids.filter((id): id is number => typeof id === "number")), until };
  } catch {
    return null;
  }
}
