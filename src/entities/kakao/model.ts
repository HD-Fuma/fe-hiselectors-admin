export type KakaoRecipientConnectionStatus =
  | "READY"
  | "UNLINKED"
  | "REAUTH_REQUIRED"
  | "INACTIVE";

export const KAKAO_RECIPIENT_FILTERS = [
  { label: "수신 가능", value: "READY" },
  { label: "미연결", value: "UNLINKED" },
  { label: "수신 불가", value: "UNAVAILABLE" },
] as const;

export type KakaoRecipientFilterStatus = typeof KAKAO_RECIPIENT_FILTERS[number]["value"];

export interface KakaoRecipientItem {
  email: string | null;
  hiId: string | null;
  nickname: string;
  recipientStatus: KakaoRecipientConnectionStatus;
  selectorsCode: string | null;
  selectorsId: number;
  userId: number | null;
}

export interface KakaoRecipientRequest {
  keyword?: string;
  page: number;
  size: number;
  status?: KakaoRecipientFilterStatus;
}

export interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResult<T> {
  code: string;
  data: T | null;
  message: string | null;
  success: boolean;
}
