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
}

export const CAMPAIGN_PRODUCTS: CampaignProduct[] = [
  {
    id: "2200098405",
    name: "[파인인터내셔날] 남성 사이드 로고 스트레치 패딩 자켓 811C4PF334BK",
    saleStatus: "진행",
    media: "Hmall",
    vendor: "주식회사 현대백화점",
    mdName: "스포츠골프(복합몰)",
  },
  {
    id: "2200089867",
    name: "[파인인터내셔날] 여성 아트 패턴 스트레이트 플리츠 스커트 821C4PN354BK",
    saleStatus: "진행",
    media: "Hmall",
    vendor: "주식회사 현대백화점",
    mdName: "스포츠골프(복합몰)",
  },
  {
    id: "2200089740",
    name: "[파인인터셔날] 여성 컬러풀 밴드 SET 플리츠 뒤 스커트 821C4PC373BL",
    saleStatus: "진행",
    media: "Hmall",
    vendor: "주식회사 현대백화점",
    mdName: "스포츠골프(복합몰)",
  },
];

export const CAMPAIGNS: CampaignFixture[] = [
  {
    id: "cp-001",
    name: "2026 가을 골프웨어 프로모션",
    startDate: "2026-08-10",
    endDate: "2026-09-30",
    products: CAMPAIGN_PRODUCTS.slice(0, 2),
    status: "시작 전",
  },
  {
    id: "cp-002",
    name: "여름 바캉스 스타일링",
    startDate: "2026-07-15",
    endDate: "2026-08-31",
    products: [...CAMPAIGN_PRODUCTS],
    status: "진행 중",
  },
  {
    id: "cp-003",
    name: "초여름 패션 리뷰",
    startDate: "2026-05-01",
    endDate: "2026-06-30",
    products: [CAMPAIGN_PRODUCTS[2]],
    status: "종료",
  },
];

export function findCampaignFixture(id: string | undefined) {
  return CAMPAIGNS.find((campaign) => campaign.id === id);
}
