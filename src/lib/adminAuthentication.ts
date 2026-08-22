export const AUTH_STORAGE_KEY = "selectors-auth";
export const ADMIN_SESSION_INVALIDATED_EVENT = "selectors-admin-session-invalidated";

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (response.status === 401) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event(ADMIN_SESSION_INVALIDATED_EVENT));
  }

  return response;
}
