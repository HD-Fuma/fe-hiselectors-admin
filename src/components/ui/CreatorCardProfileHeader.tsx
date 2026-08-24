import type { SocialPlatform } from "../social/PlatformIcon";
import { PlatformIcon } from "../social/PlatformIcon";
import { CreatorProfilePhoto } from "./CreatorProfilePhoto";

export interface CreatorCardProfileHeaderProps {
  displayName: string;
  platform: SocialPlatform;
  profileImageUrl: string;
  snsId?: string;
}

export function CreatorCardProfileHeader({
  displayName,
  platform,
  profileImageUrl,
  snsId,
}: CreatorCardProfileHeaderProps) {
  return (
    <header className="fuma-creator-card__header">
      <span className="fuma-creator-card__portrait">
        <CreatorProfilePhoto creatorName={displayName} src={profileImageUrl} />
      </span>
      <div className="fuma-creator-card__identity">
        <div className="fuma-creator-card__badges">
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
