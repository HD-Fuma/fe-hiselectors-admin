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

export interface AdministratorSession {
  accessToken: string;
  issuedAt: number;
  loginId: string;
  name: string;
  role: string;
  tokenType: string;
}

export function getAdministratorSession(): AdministratorSession | null {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedSession) return null;

  try {
    const session = JSON.parse(storedSession) as Partial<AdministratorSession>;
    if (
      typeof session.accessToken !== "string"
      || !session.accessToken.trim()
      || typeof session.loginId !== "string"
      || session.role !== "ADMIN"
    ) {
      return null;
    }

    return {
      accessToken: session.accessToken,
      issuedAt: typeof session.issuedAt === "number" ? session.issuedAt : 0,
      loginId: session.loginId,
      name: typeof session.name === "string" && session.name.trim()
        ? session.name.trim()
        : session.loginId,
      role: session.role,
      tokenType: typeof session.tokenType === "string" && session.tokenType
        ? session.tokenType
        : "Bearer",
    };
  } catch {
    return null;
  }
}
