export type CampaignStatusCode = "SCHEDULED" | "ACTIVE" | "ENDED";
export type ProductStatusCode = "ON_SALE" | "SOLD_OUT" | "STOPPED";

export interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CampaignProduct {
  id: number;
  code: string | null;
  productName: string | null;
  brandName: string | null;
  category: string | null;
  regularPrice: number | null;
  salePrice: number | null;
  status: ProductStatusCode;
  thumbnailUrl: string | null;
  detailUrl: string | null;
}

export interface Campaign {
  id: number;
  status: CampaignStatusCode;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  thumbnailUrl: string | null;
  productIds: number[];
  products: CampaignProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignParticipant {
  selectorId: number;
  nickname: string;
  platform: string | null;
  accountId: string | null;
  followerCount: number | null;
}

export interface CampaignSearchRequest {
  keyword?: string;
  startDate?: string;
  endDate?: string;
  status?: CampaignStatusCode;
  page: number;
  size: number;
}

export interface CampaignSaveRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  thumbnailUrl: string | null;
  productIds: number[];
}

export interface CampaignUpdateRequest extends CampaignSaveRequest {
  removeThumbnail?: boolean;
}

export interface CampaignPerformanceSummary {
  confirmedSales: number;
  confirmedOrderCount: number;
  soldQuantity: number;
  contributingSelectorCount: number;
  canceledOrReturnedOrderCount: number;
  canceledOrReturnedRate: number;
}

export interface CampaignPerformanceDailyMetric {
  date: string;
  confirmedSales: number;
  confirmedOrderCount: number;
  soldQuantity: number;
}

export interface CampaignProductPerformance {
  productId: number;
  productCode: string | null;
  productName: string | null;
  brandName: string | null;
  thumbnailUrl: string | null;
  confirmedSales: number;
  confirmedOrderCount: number;
  soldQuantity: number;
  contributingSelectorCount: number;
}

export interface CampaignSelectorPerformance {
  selectorId: number;
  selectorCode: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
  confirmedSales: number;
  confirmedOrderCount: number;
  soldQuantity: number;
  productCount: number;
}

export interface CampaignPerformanceDetail {
  campaignId: number;
  startDate: string;
  endDate: string;
  summary: CampaignPerformanceSummary;
  daily: CampaignPerformanceDailyMetric[];
  products: CampaignProductPerformance[];
  selectors: CampaignSelectorPerformance[];
}

export const CAMPAIGN_STATUS_OPTIONS = [
  { label: "시작 전", value: "SCHEDULED" },
  { label: "진행 중", value: "ACTIVE" },
  { label: "종료", value: "ENDED" },
] as const;

export function campaignStatusLabel(status: CampaignStatusCode) {
  return CAMPAIGN_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function productStatusLabel(status: ProductStatusCode) {
  if (status === "ON_SALE") return "판매중";
  if (status === "SOLD_OUT") return "품절";
  return "판매중지";
}
