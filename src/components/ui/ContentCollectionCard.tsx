import { Images, Play } from "lucide-react";
import type { ReactNode } from "react";
import type { SocialPlatform } from "../social/PlatformIcon";
import { assetUrl } from "../../lib/assetUrl";
import { CreatorCardProfileHeader } from "./CreatorCardProfileHeader";

interface ContentCollectionCardProps {
  author: string;
  badgeLabel: string;
  caption: string;
  footerEnd: ReactNode;
  footerStart: ReactNode;
  mediaAlt: string;
  mediaCount?: number;
  mediaUrl?: string;
  platform: SocialPlatform;
  profileImageUrl: string;
  showPlay?: boolean;
  snsId?: string;
  status?: ReactNode;
  title: string;
  duration?: string;
}

export function ContentCollectionCard({
  author,
  badgeLabel,
  caption,
  duration,
  footerEnd,
  footerStart,
  mediaAlt,
  mediaCount = 1,
  mediaUrl,
  platform,
  profileImageUrl,
  showPlay = false,
  snsId,
  status,
  title,
}: ContentCollectionCardProps) {
  return (
    <>
      <CreatorCardProfileHeader
        badgeLabel={badgeLabel}
        displayName={author}
        platform={platform}
        profileImageUrl={profileImageUrl}
        snsId={snsId}
      />
      {status}
      <div className="fuma-content-collection__media">
        {mediaUrl ? (
          <img alt={mediaAlt} src={assetUrl(mediaUrl)} />
        ) : (
          <span className="fuma-content-collection__media-empty">
            <Images aria-hidden="true" size={24} />
          </span>
        )}
        {showPlay ? (
          <span className="fuma-content-collection__play">
            <Play aria-hidden="true" size={15} />
          </span>
        ) : null}
        {duration ? <span className="fuma-content-collection__duration">{duration}</span> : null}
        {mediaCount > 1 ? (
          <span className="fuma-content-collection__media-count">1 / {mediaCount}</span>
        ) : null}
      </div>
      <div className="fuma-content-collection__copy">
        <strong>{title}</strong>
        <p className="fuma-content-collection__caption">{caption}</p>
      </div>
      <footer className="fuma-content-collection__meta">
        <span>{footerStart}</span>
        {footerEnd}
      </footer>
    </>
  );
}
