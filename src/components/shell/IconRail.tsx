import { LogOut, Menu, Pencil, Settings, Star } from "lucide-react";

interface IconRailProps {
  onOpenMegaMenu: () => void;
}

export function IconRail({ onOpenMegaMenu }: IconRailProps) {
  return (
    <nav className="hsas-icon-rail" data-shell-part="rail" aria-label="관리자 도구">
      <button type="button" className="hsas-icon-rail__button" aria-label="즐겨찾기">
        <Star aria-hidden="true" />
      </button>
      <button
        type="button"
        className="hsas-icon-rail__button"
        aria-label="전체메뉴"
        onClick={onOpenMegaMenu}
      >
        <Menu aria-hidden="true" />
      </button>
      <button type="button" className="hsas-icon-rail__button" aria-label="메뉴 편집">
        <Pencil aria-hidden="true" />
      </button>
      <button type="button" className="hsas-icon-rail__button" aria-label="설정">
        <Settings aria-hidden="true" />
      </button>
      <button type="button" className="hsas-icon-rail__button" aria-label="로그아웃">
        <LogOut aria-hidden="true" />
      </button>
    </nav>
  );
}
