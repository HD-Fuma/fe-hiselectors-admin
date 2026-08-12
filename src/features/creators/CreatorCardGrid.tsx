import { CreatorEvidenceCard } from "./CreatorEvidenceCard";
import type { CreatorFixture } from "../../entities/creator/model/fixtures";

export function CreatorCardGrid({
  actionFor,
  creators,
  onOpen = () => undefined,
  onSelect = () => undefined,
  selectionMode = false,
  selectedIds = new Set<string>(),
}: {
  actionFor?: (creator: CreatorFixture) => { label: string; to: string };
  creators: readonly CreatorFixture[];
  onOpen?: (creator: CreatorFixture) => void;
  onSelect?: (creatorId: string) => void;
  selectionMode?: boolean;
  selectedIds?: ReadonlySet<string>;
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
          actionFor={actionFor}
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
