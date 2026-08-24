import type {
  CampaignPerformanceDetail,
  CampaignSelectorPerformance,
} from "../../entities/campaign";
import type { SelectorDetail } from "../../entities/selectors";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;
const PREVIEW_SALES = 12_845_000;
const PREVIEW_ORDERS = 38;
const PREVIEW_QUANTITY = 46;

function parseDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function previewDates(startDate: string, endDate: string) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const dayCount = Math.max(1, Math.floor((end.getTime() - start.getTime()) / DAY_IN_MILLISECONDS) + 1);
  const pointCount = Math.min(7, dayCount);

  return Array.from({ length: pointCount }, (_, index) => {
    const offset = pointCount === 1
      ? 0
      : Math.round((dayCount - 1) * index / (pointCount - 1));
    return formatDate(new Date(start.getTime() + offset * DAY_IN_MILLISECONDS));
  });
}

function distribute(total: number, count: number, weights: readonly number[]) {
  const selectedWeights = weights.slice(0, count);
  const weightTotal = selectedWeights.reduce((sum, weight) => sum + weight, 0);
  let allocated = 0;

  return selectedWeights.map((weight, index) => {
    if (index === selectedWeights.length - 1) return total - allocated;
    const value = Math.round(total * weight / weightTotal);
    allocated += value;
    return value;
  });
}

export function isEmptyCampaignPerformance(performance: CampaignPerformanceDetail) {
  return performance.summary.confirmedSales === 0
    && performance.summary.confirmedOrderCount === 0
    && performance.products.length === 0
    && performance.selectors.length === 0;
}

/** Local visual-QA fixture. It is never used unless the explicit preview flag is enabled. */
export function createCampaignPerformancePreview(
  performance: CampaignPerformanceDetail,
): CampaignPerformanceDetail {
  const dates = previewDates(performance.startDate, performance.endDate);
  const sales = distribute(PREVIEW_SALES, dates.length, [8, 10, 12, 16, 11, 14, 13]);
  const orders = distribute(PREVIEW_ORDERS, dates.length, [4, 5, 5, 7, 5, 6, 6]);
  const quantities = distribute(PREVIEW_QUANTITY, dates.length, [5, 6, 6, 8, 6, 7, 8]);

  return {
    ...performance,
    summary: {
      confirmedSales: PREVIEW_SALES,
      confirmedOrderCount: PREVIEW_ORDERS,
      soldQuantity: PREVIEW_QUANTITY,
      contributingSelectorCount: 4,
      canceledOrReturnedOrderCount: 2,
      canceledOrReturnedRate: 5,
    },
    daily: dates.map((date, index) => ({
      date,
      confirmedSales: sales[index],
      confirmedOrderCount: orders[index],
      soldQuantity: quantities[index],
    })),
    products: [
      {
        productId: -101,
        productCode: "PREVIEW-101",
        productName: "그로서리 선물세트",
        brandName: "더현대",
        thumbnailUrl: null,
        confirmedSales: 4_850_000,
        confirmedOrderCount: 14,
        soldQuantity: 17,
        contributingSelectorCount: 4,
      },
      {
        productId: -102,
        productCode: "PREVIEW-102",
        productName: "시그니처 텀블러",
        brandName: "킨토",
        thumbnailUrl: null,
        confirmedSales: 3_460_000,
        confirmedOrderCount: 10,
        soldQuantity: 12,
        contributingSelectorCount: 3,
      },
      {
        productId: -103,
        productCode: "PREVIEW-103",
        productName: "데일리 토트백",
        brandName: "마르헨제이",
        thumbnailUrl: null,
        confirmedSales: 2_825_000,
        confirmedOrderCount: 8,
        soldQuantity: 10,
        contributingSelectorCount: 3,
      },
      {
        productId: -104,
        productCode: "PREVIEW-104",
        productName: "홈 프래그런스 세트",
        brandName: "센트온",
        thumbnailUrl: null,
        confirmedSales: 1_710_000,
        confirmedOrderCount: 6,
        soldQuantity: 7,
        contributingSelectorCount: 2,
      },
    ],
    selectors: [
      {
        selectorId: -201,
        selectorCode: "PREVIEW-S01",
        nickname: "민지의 취향",
        profileImageUrl: "/creator-media/kr-cr-001-profile.jpg",
        confirmedSales: 4_120_000,
        confirmedOrderCount: 12,
        soldQuantity: 15,
        productCount: 4,
      },
      {
        selectorId: -202,
        selectorCode: "PREVIEW-S02",
        nickname: "오늘의 소희",
        profileImageUrl: "/creator-media/kr-cr-002-profile.jpg",
        confirmedSales: 3_430_000,
        confirmedOrderCount: 10,
        soldQuantity: 12,
        productCount: 3,
      },
      {
        selectorId: -203,
        selectorCode: "PREVIEW-S03",
        nickname: "윤슬 셀렉트",
        profileImageUrl: "/creator-media/kr-cr-003-profile.jpg",
        confirmedSales: 2_975_000,
        confirmedOrderCount: 9,
        soldQuantity: 11,
        productCount: 3,
      },
      {
        selectorId: -204,
        selectorCode: "PREVIEW-S04",
        nickname: "하루픽",
        profileImageUrl: "/creator-media/kr-cr-004-profile.jpg",
        confirmedSales: 2_320_000,
        confirmedOrderCount: 7,
        soldQuantity: 8,
        productCount: 2,
      },
    ],
  };
}

export function createCampaignPerformancePreviewSelectorDetail(
  selector: CampaignSelectorPerformance,
): SelectorDetail {
  const nickname = selector.nickname || `셀렉터스 ${selector.selectorId}`;
  const selectorCode = selector.selectorCode || `PREVIEW-${Math.abs(selector.selectorId)}`;

  return {
    id: selector.selectorId,
    selectorsCode: selectorCode,
    nickname,
    roleId: "ACTIVE",
    roleName: "활동 중",
    applicationId: null,
    userId: null,
    createdAt: "2026-08-01T09:00:00",
    updatedAt: "2026-08-24T09:00:00",
    generations: [],
    snsAccount: {
      id: selector.selectorId,
      snsCode: "INSTAGRAM",
      accountId: selectorCode.toLowerCase(),
      followerCount: null,
      profileImageUrl: selector.profileImageUrl,
      lastCollectedAt: "2026-08-24T09:00:00",
    },
    totalPenaltyCount: 0,
    activePenaltyCount: 0,
    blacklistTarget: false,
    contents: [],
    performance: {
      contentCount: 0,
      totalViewCount: 0,
      totalLikeCount: 0,
      totalCommentCount: 0,
    },
  };
}
