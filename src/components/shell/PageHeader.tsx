import { useOutletContext } from "react-router-dom";
import type { AdminRouteMeta } from "./navigationModel";

interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  const activeRoute = useOutletContext<AdminRouteMeta | undefined>();
  const pageTitle = activeRoute?.title ?? title;

  return (
    <header className="hsas-page-header">
      <div className="hsas-page-header__identity">
        <h1 className="hsas-page-header__title">{pageTitle}</h1>
      </div>
    </header>
  );
}
