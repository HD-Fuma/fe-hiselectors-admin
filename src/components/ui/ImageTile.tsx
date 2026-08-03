export interface ImageTileProps {
  alt: string;
  src?: string;
  empty?: boolean;
  actions?: string[];
}

export function ImageTile({ actions, alt, empty = false, src }: ImageTileProps) {
  const showImage = Boolean(src) && !empty;

  return (
    <div aria-label={alt} className="hsas-image-tile" role="group">
      <div className="hsas-image-tile__preview">
        {showImage ? (
          <img alt={alt} className="hsas-image-tile__image" src={src} />
        ) : (
          <div className="hsas-image-tile__placeholder">
            <span aria-hidden="true" className="hsas-image-tile__placeholder-icon">
              +
            </span>
            <span>이미지 등록</span>
          </div>
        )}
      </div>
      {actions ? (
        <div className="hsas-image-tile__actions">
          {actions.map((action, index) => (
            <button
              className="hsas-image-tile__action"
              key={`${action}-${index}`}
              type="button"
            >
              {action}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
