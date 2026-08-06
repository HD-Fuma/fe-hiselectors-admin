import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export interface WorkTab {
  id: string;
  label: string;
  to: string;
}

interface WorkTabsProps {
  activeTabId: string;
  onClose: (tabId: string) => void;
  tabs: readonly WorkTab[];
}

export function WorkTabs({ activeTabId, onClose, tabs }: WorkTabsProps) {
  const workTabsRef = useRef<HTMLElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = workTabsRef.current;
    const activeTab = activeTabRef.current;

    if (!rail || !activeTab) {
      return;
    }

    const railBounds = rail.getBoundingClientRect();
    const activeTabBounds = activeTab.getBoundingClientRect();
    if (activeTabBounds.left < railBounds.left) {
      rail.scrollLeft += activeTabBounds.left - railBounds.left;
    } else if (activeTabBounds.right > railBounds.right) {
      rail.scrollLeft += activeTabBounds.right - railBounds.right;
    }
  }, [activeTabId, tabs]);

  return (
    <nav
      className="hsas-work-tabs"
      data-shell-part="work-tabs"
      aria-label="작업 탭"
      ref={workTabsRef}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            className={`hsas-work-tabs__tab${isActive ? " hsas-work-tabs__tab--active" : ""}`}
            key={tab.id}
            ref={isActive ? activeTabRef : undefined}
          >
            <Link to={tab.to} aria-current={isActive ? "page" : undefined}>
              {tab.label}
            </Link>
            {tabs.length > 1 ? (
              <button
                aria-label={`${tab.label} 탭 닫기`}
                className="hsas-work-tabs__close"
                onClick={() => onClose(tab.id)}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
