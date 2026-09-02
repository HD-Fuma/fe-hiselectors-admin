const STORAGE_KEY = "creator-discovery-current-month-only";

export function getCreatorDiscoveryCurrentMonthOnly() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function saveCreatorDiscoveryCurrentMonthOnly(enabled: boolean) {
  if (enabled) localStorage.setItem(STORAGE_KEY, "true");
  else localStorage.removeItem(STORAGE_KEY);
}
