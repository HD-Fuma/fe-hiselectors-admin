import { useEffect, useMemo } from "react";
import {
  BubblePoolCanvas,
  type BubblePoolItem,
} from "../../components/ui/BubblePoolCanvas";
import { categoryLabel } from "../../entities/creator";
import type { SelectorSummary } from "../../entities/selectors";
import "../../styles/selector-pool.css";

const CATEGORY_KEYS = ["category", "categoryName", "categoryCode", "representativeCategory"];
const UNCATEGORIZED_LABEL = "기타";

// 백엔드 필드명이 확정 전이라 카테고리로 쓸 수 있는 키를 순서대로 훑는다.
function rawCategory(selector: SelectorSummary) {
  const record = selector as unknown as Record<string, unknown>;
  for (const key of CATEGORY_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function categoryOf(selector: SelectorSummary) {
  const raw = rawCategory(selector);
  return (raw ? categoryLabel(raw) : null) || UNCATEGORIZED_LABEL;
}

export interface SelectorPoolCanvasProps {
  /** 마우스를 올린 셀렉터스 상세를 미리 받아 두라는 신호. */
  onPrefetch?: (selector: SelectorSummary) => void;
  onSelect: (selector: SelectorSummary) => void;
  selectors: SelectorSummary[];
}

/** 버블 뷰 전체 목록에서는 블랙리스트를 보여 주지 않는다. */
export function selectorsForPool(selectors: readonly SelectorSummary[]) {
  return selectors.filter((selector) => selector.roleId !== "BLACKLIST");
}

export function SelectorPoolCanvas({
  onPrefetch,
  onSelect,
  selectors: allSelectors,
}: SelectorPoolCanvasProps) {
  const selectors = useMemo(() => selectorsForPool(allSelectors), [allSelectors]);
  const selectorsById = useMemo(
    () => new Map(selectors.map((selector) => [selector.id, selector])),
    [selectors],
  );
  const items = useMemo<readonly BubblePoolItem[]>(() => selectors.map((selector) => ({
    accountLabel: selector.snsAccountId || "-",
    audienceCount: selector.followerCount,
    audienceLabel: "팔로워",
    categoryLabel: categoryOf(selector),
    displayName: selector.snsDisplayName || selector.nickname,
    dockSubtitle: selector.snsDisplayName || selector.snsAccountId || "-",
    dockTitle: selector.nickname,
    id: selector.id,
    platform: selector.snsCode,
    profileImageUrl: selector.profileImageUrl,
  })), [selectors]);

  useEffect(() => {
    if (import.meta.env.DEV && selectors.length && !rawCategory(selectors[0])) {
      console.warn(
        `[selector-pool] 목록 응답에 카테고리 필드가 없습니다. 응답 키: ${Object.keys(selectors[0]).join(", ")}`,
      );
    }
  }, [selectors]);

  const selectById = (id: number) => {
    const selector = selectorsById.get(id);
    if (selector) onSelect(selector);
  };
  const prefetchById = onPrefetch ? (id: number) => {
    const selector = selectorsById.get(id);
    if (selector) onPrefetch(selector);
  } : undefined;

  return (
    <BubblePoolCanvas
      itemNoun="셀렉터스"
      items={items}
      onActivate={selectById}
      onPrefetch={prefetchById}
    />
  );
}
