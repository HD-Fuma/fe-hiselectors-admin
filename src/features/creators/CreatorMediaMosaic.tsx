import type { CreatorFeaturedContentFixture } from "./fixtures";
import { CreatorContentPhoto } from "./CreatorArtwork";

export function CreatorMediaMosaic({
  contents,
  creatorName,
}: {
  contents: readonly CreatorFeaturedContentFixture[];
  creatorName: string;
}) {
  const slots = Array.from({ length: 3 }, (_, index) => contents[index] ?? null);

  return (
    <div aria-label={`${creatorName} 인기 콘텐츠`} className="fuma-creator-mosaic" role="list">
      {slots.map((content, index) => (
        <figure className="fuma-creator-media" key={content?.id ?? `empty-${index}`} role="listitem">
          {content ? (
            <>
              <CreatorContentPhoto
                creatorName={creatorName}
                src={content.thumbnailUrl}
                title={content.title}
              />
              {content.mediaType === "동영상" ? (
                <span aria-label="동영상" className="fuma-creator-media__play" role="img">
                  ▶
                </span>
              ) : null}
            </>
          ) : (
            <span
              aria-label={`${creatorName} 인기 콘텐츠 없음`}
              className="fuma-creator-media__fallback fuma-creator-media__fallback--empty"
              role="img"
            >
              <span>콘텐츠 없음</span>
            </span>
          )}
        </figure>
      ))}
    </div>
  );
}
