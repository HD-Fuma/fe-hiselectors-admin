import { Link } from "react-router-dom";
import {
  NAV_GROUPS,
  getGroupMenuItems,
  type AdminRouteMeta,
} from "../../app/navigation";

interface MyMenuProps {
  activeRoute: AdminRouteMeta;
  currentPath: string;
}

export function MyMenu({ activeRoute, currentPath }: MyMenuProps) {
  const group = NAV_GROUPS.find(({ id }) => id === activeRoute.group);
  const menuItems = getGroupMenuItems(activeRoute.group);

  return (
    <aside className="hsas-my-menu" data-shell-part="menu">
      <div className="hsas-my-menu__title">마이메뉴</div>
      <nav
        className="hsas-my-menu__navigation"
        aria-label="관리자 메뉴"
        data-selected-group={activeRoute.group}
      >
        <section aria-labelledby="hsas-current-menu-group">
          <h2 id="hsas-current-menu-group" className="hsas-my-menu__group-title">
            {group?.label}
          </h2>
          <ul className="hsas-my-menu__list">
            {menuItems.map((item) => {
              const isSectionSelected = item.menuLabel === activeRoute.menuLabel;
              const isCurrentPage = item.path === currentPath;

              return (
                <li key={item.menuLabel}>
                  <Link
                    className={
                      isSectionSelected
                        ? "hsas-my-menu__link hsas-my-menu__link--active"
                        : "hsas-my-menu__link"
                    }
                    to={item.path}
                    aria-current={isCurrentPage ? "page" : undefined}
                    data-section-selected={isSectionSelected ? "true" : undefined}
                  >
                    {item.menuLabel}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </nav>
    </aside>
  );
}
