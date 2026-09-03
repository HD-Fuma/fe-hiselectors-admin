import { useMemo } from "react";
import {
  BubblePoolCanvas,
  type BubblePoolItem,
} from "../../components/ui/BubblePoolCanvas";
import type { CreatorSummary } from "../../entities/creator";
import { recentDiscoveryGlowUntil } from "./recentDiscoveryGlow";

interface CreatorBubblePoolProps {
  creators: readonly CreatorSummary[];
  categoryOptions: readonly { label: string; value: string }[];
  selectedCreatorIds: ReadonlySet<number>;
  onToggle: (creator: CreatorSummary) => void;
  emptyMessage?: string;
}

export function CreatorBubblePool({
  categoryOptions,
  creators,
  emptyMessage = "크리에이터가 없습니다.",
  onToggle,
  selectedCreatorIds,
}: CreatorBubblePoolProps) {
  const creatorsById = useMemo(
    () => new Map(creators.map((creator) => [creator.id, creator])),
    [creators],
  );
  const items = useMemo<BubblePoolItem[]>(() => {
    const categoryLabels = new Map(categoryOptions.map(({ label, value }) => [value, label]));
    return creators.map((creator) => {
      const name = creator.creatorName || creator.accountId;
      return {
        id: creator.id,
        accountLabel: creator.accountId,
        audienceCount: creator.followerCount,
        audienceLabel: creator.snsCode === "YOUTUBE" ? "구독자" : "팔로워",
        categoryLabel: creator.category
          ? categoryLabels.get(creator.category) ?? "기타"
          : "기타",
        displayName: name,
        dockSubtitle: creator.accountId,
        dockTitle: name,
        glowUntil: recentDiscoveryGlowUntil(creator.firstDiscoveredAt),
        platform: creator.snsCode,
        profileImageUrl: creator.profileImageUrl,
      };
    });
  }, [categoryOptions, creators]);

  return (
    <BubblePoolCanvas
      emptyMessage={emptyMessage}
      itemNoun="크리에이터"
      items={items}
      onActivate={(id) => {
        const creator = creatorsById.get(id);
        if (creator) onToggle(creator);
      }}
      selectedIds={selectedCreatorIds}
    />
  );
}
