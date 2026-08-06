import { useLocation } from "react-router-dom";
import { findRequirementCoverage } from "../../app/requirementRows";

interface PageHeaderProps {
  title: string;
  screenCode: string;
}

export function PageHeader({ title, screenCode }: PageHeaderProps) {
  const location = useLocation();
  const requirement = findRequirementCoverage(location.pathname, location.search);

  return (
    <header
      className="hsas-page-header"
      data-requirement-rows={requirement?.rows.join(",")}
    >
      <div className="hsas-page-header__identity">
        <h1 className="hsas-page-header__title">{title}</h1>
        <span className="hsas-page-header__code">{screenCode}</span>
      </div>
    </header>
  );
}
