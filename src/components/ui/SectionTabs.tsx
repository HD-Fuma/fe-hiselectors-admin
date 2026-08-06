export interface SectionTabItem {
  id: string;
  label: string;
  targetId?: string;
}

export interface SectionTabsProps {
  items: SectionTabItem[];
  activeId: string;
  onChange?: (id: string) => void;
}

export function SectionTabs({ activeId, items, onChange }: SectionTabsProps) {
  return (
    <nav aria-label="섹션" className="hsas-section-tabs">
      {items.map((item) => {
        const isActive = item.id === activeId;
        const targetId = item.targetId ?? (onChange ? item.id : undefined);
        const className = `hsas-section-tabs__tab${
          isActive ? " hsas-section-tabs__tab--active" : ""
        }`;

        if (!targetId) {
          return (
            <span aria-current={isActive ? "page" : undefined} className={className} key={item.id}>
              {item.label}
            </span>
          );
        }

        return (
          <a
            aria-current={isActive ? "page" : undefined}
            className={className}
            href={`#${targetId}`}
            key={item.id}
            onClick={() => onChange?.(item.id)}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
