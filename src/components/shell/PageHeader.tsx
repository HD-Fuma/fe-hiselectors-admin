import { RotateCw, Star } from "lucide-react";

interface PageHeaderProps {
  title: string;
  screenCode: string;
}

export function PageHeader({ title, screenCode }: PageHeaderProps) {
  return (
    <header className="hsas-page-header">
      <div className="hsas-page-header__identity">
        <button type="button" className="hsas-page-header__favorite" aria-label="현재 화면 즐겨찾기">
          <Star aria-hidden="true" />
        </button>
        <h1 className="hsas-page-header__title">{title}</h1>
        <span className="hsas-page-header__code">{screenCode}</span>
      </div>
      <div className="hsas-page-header__actions">
        <button type="button" className="hsas-page-header__refresh">
          <RotateCw aria-hidden="true" />
          새로고침
        </button>
      </div>
    </header>
  );
}
