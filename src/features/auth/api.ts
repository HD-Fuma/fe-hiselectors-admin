import {
  AUTH_STORAGE_KEY,
  getAdministratorSession,
  type AdministratorSession,
} from "../../lib/adminAuthentication";
import { API_BASE_URL } from "../../lib/apiBaseUrl";

export { AUTH_STORAGE_KEY, getAdministratorSession, type AdministratorSession };

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

export function clearAdministratorSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
