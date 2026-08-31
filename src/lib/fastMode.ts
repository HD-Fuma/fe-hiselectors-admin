const FAST_MODE_STORAGE_KEY = "selectors-content-fast-mode";

export function getFastMode() {
  return localStorage.getItem(FAST_MODE_STORAGE_KEY) === "true";
}

export function saveFastMode(enabled: boolean) {
  if (enabled) {
    localStorage.setItem(FAST_MODE_STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(FAST_MODE_STORAGE_KEY);
  }
}
