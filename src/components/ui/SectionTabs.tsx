export interface SectionTabItem {
  id: string;
  label: string;
}

export interface SectionTabsProps {
  items: SectionTabItem[];
  activeId: string;
}

export function SectionTabs({ activeId, items }: SectionTabsProps) {
  return (
    <div aria-label="Sections" className="hsas-section-tabs" role="tablist">
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <button
            aria-selected={isActive}
            className={`hsas-section-tabs__tab${
              isActive ? " hsas-section-tabs__tab--active" : ""
            }`}
            key={item.id}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
