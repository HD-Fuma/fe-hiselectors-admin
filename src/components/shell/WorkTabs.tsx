import { Link } from "react-router-dom";
import type { AdminRouteMeta } from "../../app/navigation";

interface WorkTabsProps {
  activeRoute: AdminRouteMeta;
  currentPath: string;
}

export function WorkTabs({ activeRoute, currentPath }: WorkTabsProps) {
  return (
    <nav className="hsas-work-tabs" data-shell-part="work-tabs" aria-label="작업 탭">
      <Link className="hsas-work-tabs__tab hsas-work-tabs__tab--active" to={currentPath} aria-current="page">
        {activeRoute.workTabLabel}
      </Link>
    </nav>
  );
}
