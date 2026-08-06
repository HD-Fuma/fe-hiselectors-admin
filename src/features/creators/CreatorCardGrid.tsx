import { CreatorEvidenceCard } from "./CreatorEvidenceCard";
import type { CreatorFixture } from "./fixtures";

export function CreatorCardGrid({
  creators,
}: {
  creators: readonly CreatorFixture[];
}) {
  return (
    <ul
      aria-label="크리에이터 목록"
      className="fuma-creator-grid"
      data-visual-contract="creator-card-grid"
      role="list"
    >
      {creators.map((creator) => (
        <CreatorEvidenceCard creator={creator} key={creator.id} />
      ))}
    </ul>
  );
}
