const RECENT_DISCOVERY_MS = 10 * 60 * 1000;

export function recentDiscoveryGlowUntil(firstDiscoveredAt: string | null) {
  if (!firstDiscoveredAt) return undefined;
  const discoveredAt = Date.parse(firstDiscoveredAt);
  return Number.isFinite(discoveredAt) ? discoveredAt + RECENT_DISCOVERY_MS : undefined;
}
