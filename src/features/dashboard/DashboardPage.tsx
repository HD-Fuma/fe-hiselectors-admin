import {
  BarChart3,
  Bell,
  ClipboardList,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import "../../styles/dashboard.css";

const DASHBOARD_LINKS = [
  {
    to: "/creators",
    title: "모집·선발",
    description: "크리에이터 풀과 지원자를 관리합니다.",
    action: "크리에이터 풀 바로가기",
    icon: UsersRound,
  },
  {
    to: "/campaigns",
    title: "운영",
    description: "캠페인과 콘텐츠 검수 현황을 확인합니다.",
    action: "캠페인 관리 바로가기",
    icon: ClipboardList,
  },
  {
    to: "/performance/selectors",
    title: "성과·정산",
    description: "셀렉터스 성과와 정산 내역을 확인합니다.",
    action: "셀렉터스 성과 바로가기",
    icon: BarChart3,
  },
  {
    to: "/notifications",
    title: "알림·메시지",
    description: "알림 발송 내역과 수신 현황을 확인합니다.",
    action: "발송 내역 바로가기",
    icon: Bell,
  },
] as const;

export function DashboardPage() {
  return (
    <section className="fuma-page fuma-dashboard">
      <PageHeader title="대시보드" />
      <div className="fuma-page__body">
        <section aria-labelledby="dashboard-overview-title">
          <h2 id="dashboard-overview-title">주요 업무</h2>
          <p className="fuma-dashboard__description">
            필요한 관리 화면으로 바로 이동할 수 있습니다.
          </p>
          <div className="fuma-dashboard__grid">
            {DASHBOARD_LINKS.map(({ action, description, icon: Icon, title, to }) => (
              <Link aria-label={action} className="fuma-dashboard-card" key={to} to={to}>
                <Icon aria-hidden="true" />
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
