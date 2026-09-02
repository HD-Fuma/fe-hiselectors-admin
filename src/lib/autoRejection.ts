const STORAGE_KEY = "selectors-applicant-auto-rejection";
const CHANGE_EVENT = "selectors-applicant-auto-rejection-change";

export function getAutoRejectionEnabled() {
  return localStorage.getItem(STORAGE_KEY) !== "false";
}

export function saveAutoRejectionEnabled(enabled: boolean) {
  if (enabled) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, "false");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeAutoRejection(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
