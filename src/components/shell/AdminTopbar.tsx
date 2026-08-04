import { LogOut, Settings } from "lucide-react";
import { NAV_GROUPS, type AdminRouteMeta } from "../../app/navigation";

interface AdminTopbarProps {
  activeRoute: AdminRouteMeta;
}

export function AdminTopbar({ activeRoute }: AdminTopbarProps) {
  const group = NAV_GROUPS.find(({ id }) => id === activeRoute.group);

  return (
    <header className="hsas-admin-topbar" data-shell-part="topbar">
      <div className="hsas-admin-topbar__context">
        {group?.label} / {activeRoute.title}
      </div>
      <div className="hsas-admin-topbar__utilities">
        <div className="hsas-admin-topbar__account">
          <strong className="hsas-admin-topbar__account-name">관리자</strong>
          <span className="hsas-admin-topbar__account-role">FUMA 운영자</span>
        </div>
        <button
          type="button"
          className="hsas-admin-topbar__utility-button"
          aria-label="설정"
        >
          <Settings aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hsas-admin-topbar__utility-button"
          aria-label="로그아웃"
        >
          <LogOut aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
