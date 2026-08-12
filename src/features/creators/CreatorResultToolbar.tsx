import { SegmentedControl } from "../../components/ui/Controls";
import { SelectionModeButton } from "../../components/ui/SelectionModeButton";

export type CreatorPoolView = "cards" | "list";

export function CreatorResultToolbar({
  count = 0,
  selectedCount = 0,
  selectionMode = false,
  onBatchProposal = () => undefined,
  onSelectionModeChange = () => undefined,
  onViewChange,
  view,
}: {
  count?: number;
  selectedCount?: number;
  selectionMode?: boolean;
  onBatchProposal?: () => void;
  onSelectionModeChange?: () => void;
  onViewChange: (view: CreatorPoolView) => void;
  view: CreatorPoolView;
}) {
  return (
    <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-creator-toolbar">
      <strong>크리에이터 풀</strong>
      <div className="fuma-settlement-result-meta">
        <span>{selectionMode ? `${selectedCount}/${count}명` : `총 ${count}건`}</span>
      </div>
      <div className="fuma-creator-toolbar__controls">
        <SelectionModeButton active={selectionMode} onClick={onSelectionModeChange} />
        {selectionMode ? (
          <button className="fuma-creator-toolbar__proposal" disabled={selectedCount === 0} onClick={onBatchProposal} type="button">
            일괄 제안
          </button>
        ) : null}
        <span aria-hidden="true" className="fuma-creator-toolbar__divider" />
        <SegmentedControl
          ariaLabel="보기 방식"
          onChange={onViewChange}
          options={[
            { label: "카드", value: "cards" },
            { label: "목록", value: "list" },
          ]}
          value={view}
        />
      </div>
    </div>
  );
}
