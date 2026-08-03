import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import {
  NAV_GROUPS,
  getGroupMenuItems,
  type NavGroup,
} from "../../app/navigation";

interface MegaMenuProps {
  activeGroup: NavGroup;
  onClose: () => void;
}

export function MegaMenu({ activeGroup, onClose }: MegaMenuProps) {
  const [selectedGroup, setSelectedGroup] = useState(activeGroup);
  const selectedGroupMeta = NAV_GROUPS.find(({ id }) => id === selectedGroup);
  const menuItems = getGroupMenuItems(selectedGroup);

  return (
    <div className="hsas-mega-menu-backdrop">
      <section
        className="hsas-mega-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hsas-mega-menu-title"
        data-ui="mega-menu"
      >
        <header className="hsas-mega-menu__title-bar">
          <h2 id="hsas-mega-menu-title" className="hsas-mega-menu__title">
            전체메뉴
          </h2>
          <button type="button" className="hsas-mega-menu__close" aria-label="전체메뉴 닫기" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="hsas-mega-menu__body">
          <nav className="hsas-mega-menu__groups" aria-label="전체메뉴 업무군">
            {NAV_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                className={
                  group.id === selectedGroup
                    ? "hsas-mega-menu__group hsas-mega-menu__group--active"
                    : "hsas-mega-menu__group"
                }
                aria-pressed={group.id === selectedGroup}
                onClick={() => setSelectedGroup(group.id)}
              >
                {group.label}
              </button>
            ))}
          </nav>
          <nav className="hsas-mega-menu__children" aria-label="전체메뉴 하위 메뉴">
            <h3 className="hsas-mega-menu__group-title">{selectedGroupMeta?.label}</h3>
            <ul className="hsas-mega-menu__child-list">
              {menuItems.map((item) => (
                <li key={item.menuLabel}>
                  <Link to={item.path} onClick={onClose}>
                    {item.menuLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </div>
  );
}
