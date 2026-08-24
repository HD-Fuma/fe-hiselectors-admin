export type NotificationChannel = "KAKAO_MESSAGE" | "EMAIL";

export type NotificationStatus = "REQUESTED" | "SENT" | "FAILED";

export type KakaoRecipientStatus = "READY" | "REAUTH_REQUIRED" | "INACTIVE";

export type NotificationInitiatedByType = "ADMIN" | "SYSTEM";

export interface NotificationHistoryItem {
  notificationId: number;
  purposeCode: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  receiver: string;
  body: string;
  referenceId: number | null;
  requestAt: string;
  sentAt: string | null;
  recipientUserId: number | null;
  recipientName: string | null;
  recipientHiId: string | null;
  recipientStatus: KakaoRecipientStatus | null;
  initiatedByType: NotificationInitiatedByType;
  initiatedById: number | null;
}

export interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResult<T> {
  success: boolean;
  code: string;
  message: string | null;
  data: T | null;
}

export interface NotificationHistoryRequest {
  purpose?: string;
  status?: NotificationStatus;
  from?: string;
  to?: string;
  recipientKeyword?: string;
  page: number;
  size: number;
}

export const NOTIFICATION_PURPOSES = [
  { value: "ACTIVITY_GUIDE", label: "활동 안내" },
  { value: "CONTENT_EDIT_DONE", label: "콘텐츠 수정 완료" },
  { value: "CONTENT_EDIT_REQUEST", label: "콘텐츠 수정 요청" },
  { value: "DEAD_LINK_NOTICE", label: "링크 오류 안내" },
  { value: "SELECTION_APPROVED", label: "선정 승인" },
  { value: "SELECTION_REJECTED", label: "선정 반려" },
  { value: "SETTLEMENT_MISSING", label: "정산 정보 안내" },
] as const;

export const NOTIFICATION_STATUSES = [
  { value: "REQUESTED", label: "발송 요청" },
  { value: "SENT", label: "발송 완료" },
  { value: "FAILED", label: "발송 실패" },
] as const;

export const NOTIFICATION_CHANNELS = [
  { value: "KAKAO_MESSAGE", label: "카카오 메시지" },
  { value: "EMAIL", label: "이메일" },
] as const;
