export type CampaignStatus = "시작 전" | "진행 중" | "종료";

export interface CampaignProduct {
  id: string;
  name: string;
  saleStatus: "진행" | "판매 종료";
  media: "Hmall";
  vendor: string;
  mdName: string;
}

export interface CampaignFixture {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  products: CampaignProduct[];
  status: CampaignStatus;
  deleteEligible: boolean;
  deleteBlockedReason: string | null;
}

export const CAMPAIGN_PRODUCTS: CampaignProduct[] = [
  {
    id: "2200098405",
    name: "[세인트앤드류스] 남성 사이드 로고 스트레치 패딩 팬츠 811C4PF334BK",
    saleStatus: "진행",
    media: "Hmall",
    vendor: "주식회사 현대백화점",
    mdName: "스포츠&골프(복합점)",
  },
  {
    id: "2200089867",
    name: "[세인트앤드류스] 여성 도트 히든 스트라이프 플리츠 스커트 821C4PN354BK",
    saleStatus: "진행",
    media: "Hmall",
    vendor: "주식회사 현대백화점",
    mdName: "스포츠&골프(복합점)",
  },
  {
    id: "2200089740",
    name: "[세인트앤드류스] 여성 컬러드 밴드 SET 플리츠 큐롯 스커트 821C4PC373BL",
    saleStatus: "진행",
    media: "Hmall",
    vendor: "주식회사 현대백화점",
    mdName: "스포츠&골프(복합점)",
  },
];

export const CAMPAIGNS: CampaignFixture[] = [
  {
    id: "cp-001",
    name: "2026 가을 골프웨어 셀렉션",
    startDate: "2026-08-10",
    endDate: "2026-09-30",
    products: CAMPAIGN_PRODUCTS.slice(0, 2),
    status: "시작 전",
    deleteEligible: true,
    deleteBlockedReason: null,
  },
  {
    id: "cp-002",
    name: "여름 바캉스 스타일링",
    startDate: "2026-07-15",
    endDate: "2026-08-31",
    products: [...CAMPAIGN_PRODUCTS],
    status: "진행 중",
    deleteEligible: true,
    deleteBlockedReason: null,
  },
  {
    id: "cp-003",
    name: "초여름 패션 리뷰",
    startDate: "2026-05-01",
    endDate: "2026-06-30",
    products: [CAMPAIGN_PRODUCTS[2]],
    status: "종료",
    deleteEligible: false,
    deleteBlockedReason: "종료 일시가 오늘 이후인 캠페인만 삭제할 수 있습니다.",
  },
];

export function findCampaignFixture(id: string | undefined) {
  return CAMPAIGNS.find((campaign) => campaign.id === id);
}
