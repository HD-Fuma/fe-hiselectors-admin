import { CreatorEvidenceCard } from "./CreatorEvidenceCard";
import type { CreatorFixture } from "./fixtures";

export function CreatorCardGrid({
  creators,
  onOpen,
  onSelect,
  selectionMode,
  selectedIds,
}: {
  creators: readonly CreatorFixture[];
  onOpen: (creator: CreatorFixture) => void;
  onSelect: (creatorId: string) => void;
  selectionMode: boolean;
  selectedIds: ReadonlySet<string>;
}) {
  return (
    <ul
      aria-label="크리에이터 목록"
        className="fuma-creator-grid"
        data-selection-mode={selectionMode}
      data-visual-contract="creator-card-grid"
      role="list"
    >
      {creators.map((creator) => (
        <CreatorEvidenceCard
          creator={creator}
          key={creator.id}
          onOpen={onOpen}
          onSelect={onSelect}
          selected={selectedIds.has(creator.id)}
          selectionMode={selectionMode}
        />
      ))}
    </ul>
  );
}
