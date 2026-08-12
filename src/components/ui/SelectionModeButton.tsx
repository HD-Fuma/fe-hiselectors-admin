export function SelectionModeButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className="fuma-creator-toolbar__select-mode"
      onClick={onClick}
      type="button"
    >
      {active ? "선택 취소" : "선택"}
    </button>
  );
}
