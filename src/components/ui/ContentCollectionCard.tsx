import { Images, Play } from "lucide-react";
import type { ReactNode } from "react";
import type { SocialPlatform } from "../social/PlatformIcon";
import { assetUrl } from "../../lib/assetUrl";
import { CreatorCardProfileHeader } from "./CreatorCardProfileHeader";

interface ContentCollectionCardBaseProps {
  caption: string;
  footerEnd: ReactNode;
  footerStart: ReactNode;
  mediaAlt: string;
  mediaCount?: number;
  mediaFallbackUrl?: string;
  mediaUrl?: string;
  showPlay?: boolean;
  status?: ReactNode;
  title: string;
  duration?: string;
}

interface ContentCollectionCardCreatorProps {
  variant?: "creator";
  author: string;
  badgeLabel: string;
  platform: SocialPlatform;
  profileImageUrl: string;
  snsId?: string;
}

interface ContentCollectionCardCustomHeaderProps {
  variant: "custom";
  header: ReactNode;
}

type ContentCollectionCardProps = ContentCollectionCardBaseProps & (
  ContentCollectionCardCreatorProps | ContentCollectionCardCustomHeaderProps
);

export function ContentCollectionCard(props: ContentCollectionCardProps) {
  const {
    caption,
    duration,
    footerEnd,
    footerStart,
    mediaAlt,
    mediaCount = 1,
    mediaFallbackUrl,
    mediaUrl,
    showPlay = false,
    status,
    title,
  } = props;

  return (
    <>
      {props.variant === "custom" ? props.header : (
        <CreatorCardProfileHeader
          badgeLabel={props.badgeLabel}
          displayName={props.author}
          platform={props.platform}
          profileImageUrl={props.profileImageUrl}
          snsId={props.snsId}
        />
      )}
      {status}
      <div className="fuma-content-collection__media">
        {mediaUrl ? (
          <img
            alt={mediaAlt}
            onError={mediaFallbackUrl ? (event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = assetUrl(mediaFallbackUrl);
            } : undefined}
            src={assetUrl(mediaUrl)}
          />
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
