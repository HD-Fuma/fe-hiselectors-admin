export type CreatorPoolView = "cards" | "list";

export function CreatorResultToolbar({
  count,
  selectedCount,
  selectionMode,
  onBatchProposal,
  onSelectionModeChange,
  onViewChange,
  view,
}: {
  count: number;
  selectedCount: number;
  selectionMode: boolean;
  onBatchProposal: () => void;
  onSelectionModeChange: () => void;
  onViewChange: (view: CreatorPoolView) => void;
  view: CreatorPoolView;
}) {
  return (
    <div className="fuma-creator-toolbar">
      <strong className="fuma-creator-toolbar__summary">크리에이터 풀</strong>
      <span>총 {count}건</span>
      <div className="fuma-creator-toolbar__controls">
        <button aria-pressed={selectionMode} className="fuma-creator-toolbar__select-mode" onClick={onSelectionModeChange} type="button">
          {selectionMode ? "선택 완료" : "선택"}
        </button>
        {selectionMode ? <>
          <span className="fuma-creator-toolbar__selected">{selectedCount}명 선택</span>
          <button className="fuma-creator-toolbar__proposal" disabled={selectedCount === 0} onClick={onBatchProposal} type="button">
            선택한 크리에이터에게 제안 보내기
          </button>
        </> : null}
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
