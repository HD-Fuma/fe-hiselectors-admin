interface MediaTilesProps {
  count: number;
  kinds: string[];
  label: string;
  urls?: string[];
}

function MediaSilhouette({ index, kind }: { index: number; kind: string }) {
  const isVideo = kind === "동영상";
  const accent = index % 2 === 0 ? "#50575b" : "#747b7e";

  return (
    <svg
      aria-label={`${kind} 미리보기 ${index + 1}`}
      className="fuma-media-tile__visual"
      role="img"
      viewBox="0 0 130 104"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#f3f5f5" height="104" width="130" />
      <rect fill="#e4e8e8" height="70" width="100" x="15" y="17" />
      <path d="M48 28h34l8 13-9 46H49l-9-46 8-13Z" fill={accent} />
      <path d="M56 28v59M74 28v59" stroke="#afb5b7" strokeWidth="1" />
      {isVideo ? (
        <g>
          <circle cx="65" cy="52" fill="rgba(255,255,255,.9)" r="15" />
          <path d="m61 44 11 8-11 8V44Z" fill="#168f78" />
        </g>
      ) : null}
    </svg>
  );
}

export function MediaTiles({ count, kinds, label, urls = [] }: MediaTilesProps) {
  const tiles = Array.from({ length: count }, (_, index) => ({
    index,
    kind: kinds[index] ?? "이미지",
    url: urls[index],
  }));

  return (
    <section aria-label={`${label} 미디어`} className="fuma-media-tiles">
      <div className="fuma-media-tiles__summary">
        <strong>미디어</strong>
        <span>{count}개</span>
      </div>
      <div className="fuma-media-tiles__track" role="list">
        {tiles.map(({ index, kind, url }) => (
          <figure className="fuma-media-tile" key={`${kind}-${index}`} role="listitem">
            {url ? (
              <img
                alt={`${label} ${kind} ${index + 1}`}
                className="fuma-media-tile__visual"
                src={url}
              />
            ) : (
              <MediaSilhouette index={index} kind={kind} />
            )}
            <figcaption>
              <span>{kind}</span>
              <span>{index + 1}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
