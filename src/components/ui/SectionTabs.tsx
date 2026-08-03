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
    <nav aria-label="섹션" className="hsas-section-tabs">
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <span
            aria-current={isActive ? "page" : undefined}
            className={`hsas-section-tabs__tab${
              isActive ? " hsas-section-tabs__tab--active" : ""
            }`}
            key={item.id}
          >
            {item.label}
          </span>
        );
      })}
    </nav>
  );
}
