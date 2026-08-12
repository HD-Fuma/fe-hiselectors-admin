import { CONTENT_INSPECTIONS } from "../../content";
import { CREATORS } from "../../creator";
import { CONTENT_INFLUENCE, campaignNameById } from "../../performance";
import { SETTLEMENTS, type SettlementPaymentStatus } from "../../settlement";
import { COHORTS, type SelectorFixture } from "./fixtures";

export interface SelectorSocialLink {
  handle: string;
  platform: string;
  url: string;
}

export interface SelectorContentRecord {
  campaign: string;
  format: string;
  id: string;
  publishedAt: string;
  status: string;
  thumbnailUrl: string;
  title: string;
}

export interface SelectorCohortActivityRecord {
  campaignCount: number;
  cohort: string;
  contentCount: number;
  period: string;
  result: string;
}

export interface SelectorSettlementRecord {
  amount: number;
  id: string;
  month: string;
  status: SettlementPaymentStatus;
}

export interface SelectorDetailData {
  cohortHistory: SelectorCohortActivityRecord[];
  contents: SelectorContentRecord[];
  profileImageUrl: string;
  settlements: SelectorSettlementRecord[];
  snsLinks: SelectorSocialLink[];
  totalSettlement: number;
}

const FALLBACK_CONTENT_TITLES = [
  "이번 주 데일리 스타일링 모음",
  "직접 사용해 본 리빙 아이템 후기",
  "주말을 위한 간단한 홈카페 레시피",
  "여행 가방에 꼭 챙긴 추천 아이템",
] as const;

function sequenceFromId(id: string) {
  return Number.parseInt(id.replace(/\D/g, ""), 10) || 1;
}

function creatorIdFromSelectorId(selectorId: string) {
  return selectorId.replace(/^sl-/, "cr-");
}

function creatorForSelector(selector: SelectorFixture) {
  return CREATORS.find(
    (creator) => creator.id === creatorIdFromSelectorId(selector.id) && creator.name === selector.name,
  );
}

function fallbackThumbnail(sequence: number, index: number) {
  const creatorNumber = ((sequence + index - 1) % 4) + 1;
  const mediaNumber = (index % 3) + 1;
  return `/creator-media/kr-cr-${String(creatorNumber).padStart(3, "0")}-${String(mediaNumber).padStart(2, "0")}.jpg`;
}

function fallbackContentFormat(selector: SelectorFixture, index: number) {
  const hasInstagram = selector.sns.includes("Instagram");
  const hasYouTube = selector.sns.includes("YouTube");

  if (hasInstagram && hasYouTube) {
    return index % 2 === 0 ? "인스타 릴스" : "유튜브 쇼츠";
  }
  if (hasYouTube) {
    return index % 2 === 0 ? "유튜브 롱폼" : "유튜브 쇼츠";
  }
  return index % 3 === 0 ? "인스타 릴스" : index % 3 === 1 ? "인스타 피드" : "인스타 이미지";
}

function createSnsLinks(selector: SelectorFixture, sequence: number): SelectorSocialLink[] {
  const creator = creatorForSelector(selector);
  const platforms = selector.sns.split(" / ");

  return platforms.map((platform) => {
    if (creator && creator.profile.platform === platform) {
      return {
        handle: creator.profile.handle,
        platform,
        url: creator.profile.profileUrl,
      };
    }

    const handle = `@selectores_${String(sequence).padStart(3, "0")}`;
    return {
      handle,
      platform,
      url: platform === "YouTube"
        ? `https://www.youtube.com/${handle}`
        : `https://www.instagram.com/${handle.slice(1)}`,
    };
  });
}

function createContentRecords(selector: SelectorFixture, sequence: number): SelectorContentRecord[] {
  const creator = creatorForSelector(selector);
  const relatedContents = CONTENT_INFLUENCE.filter((content) => content.selectorId === selector.id);
  const canonicalRecords: SelectorContentRecord[] = relatedContents.map((content, index) => {
    const inspection = CONTENT_INSPECTIONS.find((item) => item.id === content.id);
    const featuredContent = creator?.featuredContents[index % creator.featuredContents.length];

    return {
      campaign: campaignNameById(content.campaignId),
      format: inspection?.contentFormat ?? (content.platform === "YouTube" ? "유튜브 롱폼" : "인스타 피드"),
      id: content.id,
      publishedAt: inspection?.submittedAt ?? `${selector.recentActivity} 14:00`,
      status: inspection?.inspectionStatus ?? "승인",
      thumbnailUrl: inspection?.currentSnapshot.mediaUrls[0]
        ?? featuredContent?.thumbnailUrl
        ?? fallbackThumbnail(sequence, index),
      title: inspection?.contentTitle ?? content.title,
    };
  });

  const featuredRecords: SelectorContentRecord[] = (creator?.featuredContents ?? []).map(
    (content, index) => ({
      campaign: index % 2 === 0 ? "셀렉터스 추천 상품" : "시즌 테마 기획전",
      format: creator?.profile.platform === "YouTube"
        ? content.mediaType === "동영상" ? "유튜브 쇼츠" : "유튜브 커뮤니티"
        : content.mediaType === "동영상" ? "인스타 릴스" : "인스타 피드",
      id: content.id,
      publishedAt: `2026-08-${String(Math.max(1, 8 - index)).padStart(2, "0")} 1${index}:20`,
      status: "승인",
      thumbnailUrl: content.thumbnailUrl,
      title: content.title,
    }),
  );

  const fallbackRecords: SelectorContentRecord[] = FALLBACK_CONTENT_TITLES.map((title, index) => ({
    campaign: index % 2 === 0 ? "8월 셀렉터스 추천전" : "여름 라이프스타일 기획전",
    format: fallbackContentFormat(selector, index),
    id: `${selector.id}-content-${index + 1}`,
    publishedAt: `2026-08-${String(Math.max(1, 9 - index)).padStart(2, "0")} 1${index}:30`,
    status: index === 0 ? "검수 대기" : "승인",
    thumbnailUrl: fallbackThumbnail(sequence, index),
    title,
  }));

  const records = [...canonicalRecords, ...featuredRecords, ...fallbackRecords];
  return records
    .filter((record, index) => records.findIndex((item) => item.title === record.title) === index)
    .slice(0, 4);
}

function createCohortHistory(selector: SelectorFixture, sequence: number): SelectorCohortActivityRecord[] {
  const currentGeneration = Number.parseInt(selector.cohort.match(/\d+/)?.[0] ?? "1", 10);
  const previousGenerationCount = Math.min(2, Math.max(0, currentGeneration - 1));

  return Array.from({ length: previousGenerationCount }, (_, index) => {
    const generation = currentGeneration - index - 1;
    const cohort = COHORTS.find((item) => item.generationId === generation);
    const fallbackPeriods: Record<number, string> = {
      1: "2026-01-05 ~ 2026-03-31",
      2: "2026-04-01 ~ 2026-06-30",
    };

    return {
      campaignCount: 2 + ((sequence + index) % 4),
      cohort: `테스트기수${generation}`,
      contentCount: Math.max(4, Math.round(selector.contentCount * (0.58 - index * 0.12))),
      period: cohort ? `${cohort.startDate} ~ ${cohort.endDate}` : fallbackPeriods[generation] ?? "-",
      result: sequence % 9 === 0 && index === 0 ? "경고 후 수료" : "수료",
    };
  });
}

function createSettlementHistory(selector: SelectorFixture, sequence: number): SelectorSettlementRecord[] {
  const realSettlements: SelectorSettlementRecord[] = SETTLEMENTS
    .filter((settlement) => settlement.selectorId === selector.id)
    .map((settlement) => ({
      amount: settlement.expectedAmount,
      id: settlement.id,
      month: settlement.attributionMonth,
      status: settlement.paymentStatus,
    }));
  const baseAmount = realSettlements[0]?.amount ?? 280000 + (sequence % 8) * 47000;
  const months = [
    "2026-08",
    "2026-07",
    "2026-06",
    "2026-05",
    "2026-04",
    "2026-03",
    "2026-02",
    "2026-01",
    "2025-12",
    "2025-11",
    "2025-10",
    "2025-09",
  ];
  const generatedSettlements = months
    .filter((month) => !realSettlements.some((settlement) => settlement.month === month))
    .map((month, index): SelectorSettlementRecord => ({
      amount: Math.max(180000, baseAmount - (index + 1) * 32000),
      id: `${selector.id}-${month}`,
      month,
      status: month === "2026-08" ? "확정" : "지급 완료",
    }));

  return [...realSettlements, ...generatedSettlements]
    .sort((left, right) => right.month.localeCompare(left.month));
}

export function getSelectorDetailData(selector: SelectorFixture): SelectorDetailData {
  const sequence = sequenceFromId(selector.id);
  const creator = creatorForSelector(selector);
  const settlements = createSettlementHistory(selector, sequence);

  return {
    cohortHistory: createCohortHistory(selector, sequence),
    contents: createContentRecords(selector, sequence),
    profileImageUrl: creator?.profile.profileImageUrl
      ?? `/creator-media/kr-cr-${String(((sequence - 1) % 4) + 1).padStart(3, "0")}-profile.jpg`,
    settlements,
    snsLinks: createSnsLinks(selector, sequence),
    totalSettlement: settlements.reduce((total, settlement) => total + settlement.amount, 0),
  };
}
