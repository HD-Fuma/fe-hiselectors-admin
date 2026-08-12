import { CreatorProfilePhoto } from "./CreatorArtwork";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import type { CreatorPlatform } from "./fixtures";

export function CreatorCardProfileHeader({
  badgeLabel,
  displayName,
  platform,
  profileImageUrl,
  snsId,
}: {
  badgeLabel: string;
  displayName: string;
  platform: CreatorPlatform;
  profileImageUrl: string;
  snsId?: string;
}) {
  return (
    <header className="fuma-creator-card__header">
      <span className="fuma-creator-card__portrait">
        <CreatorProfilePhoto creatorName={displayName} src={profileImageUrl} />
      </span>
      <div className="fuma-creator-card__identity">
        <div className="fuma-creator-card__badges">
          <span>{badgeLabel}</span>
          <span className="fuma-creator-card__platform">
            <PlatformIcon platform={platform} />
            {platform}
          </span>
        </div>
        <h2 className="fuma-creator-card__name">
          {displayName}
          {snsId ? <small className="fuma-creator-card__sns-id">({snsId})</small> : null}
          {" "}<span aria-hidden="true">›</span>
        </h2>
      </div>
    </header>
  );
}
