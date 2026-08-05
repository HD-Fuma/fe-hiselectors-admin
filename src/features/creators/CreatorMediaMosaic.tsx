import type { CreatorFeaturedContentFixture } from "./fixtures";
import { CreatorMediaArtwork } from "./CreatorArtwork";
import { PlatformIcon } from "./PlatformIcon";

const compactNumber = new Intl.NumberFormat("ko-KR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// eslint-disable-next-line react-refresh/only-export-components
export function formatCompactNumber(value: number) {
  return compactNumber.format(value);
}

export function CreatorMediaMosaic({
  contents,
  creatorName,
}: {
  contents: readonly CreatorFeaturedContentFixture[];
  creatorName: string;
}) {
  return (
    <div aria-label={`${creatorName} 인기 콘텐츠`} className="fuma-creator-mosaic" role="list">
      {contents.slice(0, 3).map((content, index) => (
        <figure
          className={`fuma-creator-media fuma-creator-media--${index === 0 ? "main" : "support"}`}
          key={content.id}
          role="listitem"
        >
          <CreatorMediaArtwork
            creatorName={creatorName}
            title={content.title}
            visual={content.visual}
          />
          <figcaption className="fuma-creator-media__caption">
            <span className="fuma-creator-media__source">
              <PlatformIcon decorative platform={content.platform} />
              {content.platform}
            </span>
            <span className="fuma-creator-media__views">
              {formatCompactNumber(content.views)}
            </span>
          </figcaption>
          {content.mediaType === "동영상" ? (
            <span aria-label="동영상" className="fuma-creator-media__play" role="img">
              ▶
            </span>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
