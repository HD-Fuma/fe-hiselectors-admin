import { AUTH_STORAGE_KEY } from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";

export { AUTH_STORAGE_KEY };

export interface AdminLoginRequest {
  loginId: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  loginId: string;
  name: string;
  role: string;
  tokenType: string;
}

export interface AdministratorSession extends AdminLoginResponse {
  issuedAt: number;
}

interface ApiResult<T> {
  code: string;
  data: T | null;
  message: string | null;
  success: boolean;
}

async function loginErrorMessage(response: Response) {
  try {
    const result = await response.json() as Partial<ApiResult<unknown>>;
    return typeof result.message === "string" && result.message.trim()
      ? result.message
      : "관리자 로그인에 실패했습니다.";
  } catch {
    return "관리자 로그인에 실패했습니다.";
  }
}

export async function loginAdministrator(
  request: AdminLoginRequest,
): Promise<AdminLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
    body: JSON.stringify(request),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await loginErrorMessage(response));
  }

  const result = await response.json() as ApiResult<AdminLoginResponse>;
  if (!result.success || !result.data?.accessToken) {
    throw new Error(result.message || "관리자 로그인에 실패했습니다.");
  }

  return result.data;
}

export function persistAdministratorSession(session: AdminLoginResponse) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    ...session,
    issuedAt: Date.now(),
    tokenType: session.tokenType || "Bearer",
  }));
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

export function clearAdministratorSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
