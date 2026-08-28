import { PlatformIcon, type SocialPlatform } from "../social/PlatformIcon";
import { CreatorProfilePhoto } from "./CreatorProfilePhoto";

export function SocialAccountCell({
  displayName,
  handle,
  onOpen,
  platform,
  profileImageUrl,
  profileUrl,
}: {
  displayName: string;
  handle: string;
  onOpen?: () => void;
  platform: SocialPlatform;
  profileImageUrl: string;
  profileUrl: string | null;
}) {
  const profile = (
    <>
      <span className="fuma-creator-account-cell__portrait">
        <CreatorProfilePhoto creatorName={displayName} src={profileImageUrl} />
        <PlatformIcon platform={platform} />
      </span>
      <span className="fuma-creator-account-cell__identity">
        <strong>{displayName}</strong>
        <small>{handle}</small>
      </span>
    </>
  );

  return (
    <div className="fuma-creator-account-cell">
      {onOpen ? (
        <button
          aria-label={`${displayName} 프로필 보기`}
          className="fuma-creator-account-cell__profile"
          onClick={onOpen}
          type="button"
        >
          {profile}
        </button>
      ) : (
        <div className="fuma-creator-account-cell__profile is-static">{profile}</div>
      )}
      {profileUrl ? (
        <a
          aria-label={`${displayName} SNS 계정 열기 (새 창)`}
          className="fuma-creator-account-cell__external"
          href={profileUrl}
          rel="noreferrer"
          target="_blank"
        >
          <span aria-hidden="true">↗</span>
        </a>
      ) : null}
    </div>
  );
}
