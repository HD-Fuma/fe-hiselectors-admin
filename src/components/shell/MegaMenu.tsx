import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableElements(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.tabIndex >= 0 && !element.hasAttribute("hidden"),
  );
}

export function MegaMenu({ activeGroup, onClose }: MegaMenuProps) {
  const [selectedGroup, setSelectedGroup] = useState(activeGroup);
  const dialogRef = useRef<HTMLElement>(null);
  const selectedGroupMeta = NAV_GROUPS.find(({ id }) => id === selectedGroup);
  const menuItems = getGroupMenuItems(selectedGroup);

  useEffect(() => {
    const dialog = dialogRef.current;
    const shell = document.querySelector<HTMLElement>('[data-ui="admin-shell"]');
    if (!dialog || !shell) {
      return undefined;
    }

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const shellState = {
      ariaHidden: shell.getAttribute("aria-hidden"),
      inert: shell.hasAttribute("inert"),
    };

    shell.setAttribute("aria-hidden", "true");
    shell.setAttribute("inert", "");
    (focusableElements(dialog)[0] ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const elements = focusableElements(dialog);
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);

    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);

      if (shellState.ariaHidden == null) {
        shell.removeAttribute("aria-hidden");
      } else {
        shell.setAttribute("aria-hidden", shellState.ariaHidden);
      }

      if (!shellState.inert) {
        shell.removeAttribute("inert");
      }

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="hsas-mega-menu-backdrop">
      <section
        className="hsas-mega-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hsas-mega-menu-title"
        data-ui="mega-menu"
        ref={dialogRef}
        tabIndex={-1}
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
    </div>,
    document.body,
  );
}
