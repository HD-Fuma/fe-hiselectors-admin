import { useState } from "react";

export function CreatorProfilePhoto({
  creatorName,
  src,
}: {
  creatorName: string;
  src: string;
}) {
  const [failed, setFailed] = useState(!src);

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
      onError={() => setFailed(true)}
      src={src}
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
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <span
        aria-label={`${creatorName} 인기 콘텐츠: ${title} 이미지 없음`}
        className="fuma-creator-media__fallback"
        role="img"
      >
        <span>{title}</span>
      </span>
    );
  }

  return (
    <img
      alt={`${creatorName} 인기 콘텐츠: ${title}`}
      onError={() => setFailed(true)}
      src={src}
    />
  );
}
