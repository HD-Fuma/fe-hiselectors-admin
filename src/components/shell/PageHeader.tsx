import { useLocation } from "react-router-dom";
import { findAdminRoute } from "../../app/navigation";
import { findRequirementCoverage } from "../../app/requirementRows";

interface PageHeaderProps {
  title: string;
  screenCode: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  const location = useLocation();
  const requirement = findRequirementCoverage(location.pathname, location.search);
  const pageTitle = findAdminRoute(location.pathname)?.title ?? title;

  return (
    <header
      className="hsas-page-header"
      data-requirement-rows={requirement?.rows.join(",")}
      >
      <div className="hsas-page-header__identity">
        <h1 className="hsas-page-header__title">{pageTitle}</h1>
      </div>
    </header>
  );
}
