import { getAdministratorSession } from "../../lib/adminAuthentication";
import "../../styles/dashboard.css";

export function DashboardPage() {
  const administratorName = getAdministratorSession()?.name ?? "관리자";

  return (
    <section aria-labelledby="dashboard-title" className="fuma-dashboard">
      <h1 className="hsas-visually-hidden" id="dashboard-title">대시보드</h1>
      <p className="fuma-dashboard__greeting">안녕하세요, <strong>{administratorName}님</strong></p>
    </section>
  );
}
