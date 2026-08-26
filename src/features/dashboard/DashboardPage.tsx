import { useEffect, useState } from "react";
import { adaptContentInspection, getCurrentGenerationContents } from "../../entities/content";
import { getAdministratorSession } from "../../lib/adminAuthentication";
import { formatNumber } from "../../lib/formatters";
import "../../styles/dashboard.css";

export function DashboardPage() {
  const administratorName = getAdministratorSession()?.name ?? "관리자";
  const [pendingContentCount, setPendingContentCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void getCurrentGenerationContents(controller.signal)
      .then((contents) => {
        if (controller.signal.aborted) return;
        setPendingContentCount(contents
          .map(adaptContentInspection)
          .filter(({ inspectionStatus }) => inspectionStatus === "검수 대기").length);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const pendingCountLabel = pendingContentCount == null ? "—" : formatNumber(pendingContentCount);

  return (
    <section aria-labelledby="dashboard-title" className="fuma-dashboard">
      <h1 className="hsas-visually-hidden" id="dashboard-title">대시보드</h1>
      <p className="fuma-dashboard__greeting">안녕하세요, <strong>{administratorName}님</strong></p>
      <aside aria-label="검수 리포트" className="fuma-dashboard__inspection-report">
        <header>
          <div>
            <span>AI ANALYSIS</span>
            <strong>검수 리포트</strong>
          </div>
          <em>{pendingContentCount == null ? "확인 중" : `${pendingCountLabel}건 대기`}</em>
        </header>
        <div className="fuma-dashboard__inspection-count">
          <span>검수할 콘텐츠 수</span>
          <strong>{pendingCountLabel}<small>건</small></strong>
        </div>
      </aside>
    </section>
  );
}
