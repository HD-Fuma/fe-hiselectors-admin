import { useState } from "react";
import { assetUrl } from "../../../lib/assetUrl";

export function CreatorProfilePhoto({
  creatorName,
  src,
}: {
  creatorName: string;
  src: string;
}) {
  const resolvedSrc = assetUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !resolvedSrc || failedSrc === resolvedSrc;

  if (failed) {
    return (
      <span
        aria-label={`${creatorName} 프로필 이미지 없음`}
        className="fuma-creator-profile-fallback"
        role="img"
      >
        {creatorName.slice(0, 1)}
      </span>
    );
  }

  return (
    <img
      alt={`${creatorName} 프로필 이미지`}
      onError={() => setFailedSrc(resolvedSrc)}
      src={resolvedSrc}
    />
  );
}

export function CreatorContentPhoto({
  creatorName,
  src,
  title,
}: {
  creatorName: string;
  src: string;
  title: string;
}) {
  const resolvedSrc = assetUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !resolvedSrc || failedSrc === resolvedSrc;

  if (failed) {
    return (
      <span
        aria-label={`${creatorName} 대표 게시글: ${title} 이미지 없음`}
        className="fuma-creator-media__fallback"
        role="img"
      >
        <span>{title}</span>
      </span>
    );
  }

  return (
    <img
      alt={`${creatorName} 대표 게시글: ${title}`}
      onError={() => setFailedSrc(resolvedSrc)}
      src={resolvedSrc}
    />
  );
}
