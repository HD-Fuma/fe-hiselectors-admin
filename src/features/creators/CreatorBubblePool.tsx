import { PlatformIcon } from "../../components/social/PlatformIcon";
import { CreatorProfilePhoto } from "../../components/ui/CreatorProfilePhoto";
import type { CreatorSummary } from "../../entities/creator";
import { formatNumber } from "../../lib/formatters";
import "../../styles/creator-pool.css";

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
  const categoryLabels = new Map(categoryOptions.map(({ label, value }) => [value, label]));
  const categoryOrder = new Map(categoryOptions.map(({ value }, index) => [value, index]));
  const groups = new Map<string, { creators: CreatorSummary[]; label: string }>();

  creators.forEach((creator) => {
    const key = creator.category ?? "__uncategorized";
    const group = groups.get(key);
    if (group) group.creators.push(creator);
    else groups.set(key, {
      creators: [creator],
      label: creator.category ? categoryLabels.get(creator.category) ?? "기타" : "미분류",
    });
  });

  const orderedGroups = [...groups.entries()].sort(([left], [right]) => (
    (categoryOrder.get(left) ?? categoryOptions.length)
    - (categoryOrder.get(right) ?? categoryOptions.length)
  ));

  return (
    <div aria-label="크리에이터 버블" className="fuma-creator-bubble-pool" role="region">
      {orderedGroups.length ? orderedGroups.map(([category, group], groupIndex) => {
        const headingId = `creator-bubble-category-${groupIndex}`;
        return (
          <section
            aria-labelledby={headingId}
            className="fuma-creator-bubble-pool__cluster"
            key={category}
          >
            <h3 id={headingId}>{group.label}</h3>
            <div className="fuma-creator-bubble-pool__items">
              {group.creators.map((creator) => {
                const name = creator.creatorName || creator.accountId;
                const platform = creator.snsCode === "INSTAGRAM" ? "Instagram" : "YouTube";
                const audience = creator.snsCode === "INSTAGRAM" ? "팔로워" : "구독자";
                const selected = selectedCreatorIds.has(creator.id);
                return (
                  <button
                    aria-label={`${name} ${selected ? "선택 해제" : "선택"}`}
                    aria-pressed={selected}
                    className={`fuma-creator-bubble${selected ? " fuma-creator-bubble--selected" : ""}`}
                    key={creator.id}
                    onClick={() => onToggle(creator)}
                    type="button"
                  >
                    {selected ? (
                      <span aria-hidden="true" className="fuma-creator-bubble__check">✓</span>
                    ) : null}
                    <span className="fuma-creator-bubble__photo">
                      <CreatorProfilePhoto creatorName={name} src={creator.profileImageUrl ?? ""} />
                      <span className="fuma-creator-bubble__platform">
                        <PlatformIcon decorative platform={platform} />
                      </span>
                    </span>
                    <strong>{name}</strong>
                    <span className="fuma-creator-bubble__audience">
                      {creator.followerCount == null
                        ? `${audience} 정보 없음`
                        : `${audience} ${formatNumber(creator.followerCount)}명`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      }) : <p className="fuma-creator-bubble-pool__empty">{emptyMessage}</p>}
    </div>
  );
}
