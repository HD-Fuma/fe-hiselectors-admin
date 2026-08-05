export type CreatorPoolView = "cards" | "list";

export function CreatorResultToolbar({
  count,
  onViewChange,
  view,
}: {
  count: number;
  onViewChange: (view: CreatorPoolView) => void;
  view: CreatorPoolView;
}) {
  return (
    <div className="fuma-creator-toolbar">
      <strong className="fuma-creator-toolbar__summary">크리에이터 목록</strong>
      <span>총 {count}건</span>
      <div className="fuma-creator-toolbar__controls">
        <span className="fuma-creator-toolbar__sort">AI 적합도순</span>
        <div
          aria-label="보기 방식"
          className="fuma-creator-toolbar__views"
          role="group"
        >
          <button
            aria-pressed={view === "cards"}
            className="fuma-creator-toolbar__view"
            onClick={() => onViewChange("cards")}
            type="button"
          >
            카드 보기
          </button>
          <button
            aria-pressed={view === "list"}
            className="fuma-creator-toolbar__view"
            onClick={() => onViewChange("list")}
            type="button"
          >
            목록 보기
          </button>
        </div>
      </div>
    </div>
  );
}
