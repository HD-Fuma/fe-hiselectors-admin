import { useEffect, useState, type ReactNode } from "react";
import { getAdminApplications } from "../../entities/application";
import { getCampaigns, type Campaign } from "../../entities/campaign";
import { adaptContentInspection, getCurrentGenerationContents } from "../../entities/content";
import { getContentPerformanceSummary } from "../../entities/performance";
import { getAdministratorSession } from "../../lib/adminAuthentication";
import { formatNumber } from "../../lib/formatters";
import "../../styles/dashboard.css";

interface DashboardData {
  activeCampaigns: number | null;
  currentGenerationContentCount: number | null;
  currentGenerationName: string | null;
  pendingApplications: number | null;
  pendingContents: number | null;
  todayCampaigns: Campaign[] | null;
}

const EMPTY_DASHBOARD: DashboardData = {
  activeCampaigns: null,
  currentGenerationContentCount: null,
  currentGenerationName: null,
  pendingApplications: null,
  pendingContents: null,
  todayCampaigns: null,
};

function dateInSeoul(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).format(date);
}

function count(value: number | null) {
  return value == null ? "—" : formatNumber(value);
}

function DashboardCard({
  children,
  className,
  eyebrow,
  status,
  title,
}: {
  children: ReactNode;
  className: string;
  eyebrow: string;
  status: string;
  title: string;
}) {
  return (
    <section className={`fuma-dashboard-card ${className}`}>
      <header>
        <div><span>{eyebrow}</span><strong>{title}</strong></div>
        <em>{status}</em>
      </header>
      {children}
    </section>
  );
}

function DashboardMetric({
  label,
  unit,
  value,
}: {
  label: string;
  unit: string;
  value: number | null;
}) {
  return (
    <div className="fuma-dashboard__metric">
      <span>{label}</span>
      <strong>{count(value)}<small>{unit}</small></strong>
    </div>
  );
}

export function DashboardPage() {
  const administratorName = getAdministratorSession()?.name ?? "관리자";
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const today = dateInSeoul();

  useEffect(() => {
    const controller = new AbortController();

    void Promise.allSettled([
      getCurrentGenerationContents(controller.signal),
      getAdminApplications({ page: 0, size: 1, status: "PENDING" }, controller.signal),
      getCampaigns({ endDate: today, page: 0, size: 100, startDate: today }, controller.signal),
      getCampaigns({ page: 0, size: 1, status: "ACTIVE" }, controller.signal),
      getContentPerformanceSummary(controller.signal),
    ]).then(([contents, applications, campaigns, activeCampaigns, summary]) => {
      if (controller.signal.aborted) return;

      setData({
        activeCampaigns: activeCampaigns.status === "fulfilled"
          ? activeCampaigns.value.totalElements
          : null,
        currentGenerationContentCount: summary.status === "fulfilled"
          ? summary.value.currentGenerationContentCount
          : null,
        currentGenerationName: summary.status === "fulfilled"
          ? summary.value.currentGenerationName
          : null,
        pendingApplications: applications.status === "fulfilled"
          ? applications.value.totalElements
          : null,
        pendingContents: contents.status === "fulfilled"
          ? contents.value.map(adaptContentInspection)
            .filter(({ inspectionStatus }) => inspectionStatus === "검수 대기").length
          : null,
        todayCampaigns: campaigns.status === "fulfilled"
          ? campaigns.value.content.filter(
            ({ endDate, startDate }) => startDate === today || endDate === today,
          )
          : null,
      });
    });

    return () => controller.abort();
  }, [today]);

  const startingCampaigns = data.todayCampaigns == null
    ? null
    : data.todayCampaigns.filter(({ startDate }) => startDate === today).length;
  const endingCampaigns = data.todayCampaigns == null
    ? null
    : data.todayCampaigns.filter(({ endDate }) => endDate === today).length;
  const todayCampaignCount = data.todayCampaigns?.length ?? null;

  return (
    <section aria-labelledby="dashboard-title" className="fuma-dashboard">
      <h1 className="hsas-visually-hidden" id="dashboard-title">대시보드</h1>
      <p className="fuma-dashboard__greeting">안녕하세요, <strong>{administratorName}님</strong></p>
      <div className="fuma-dashboard__grid">
        <DashboardCard
          className="fuma-dashboard-card--inspection"
          eyebrow="AI ANALYSIS"
          status={data.pendingContents == null ? "확인 중" : `${count(data.pendingContents)}건 대기`}
          title="검수 리포트"
        >
          <DashboardMetric label="검수할 콘텐츠 수" unit="건" value={data.pendingContents} />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--applications"
          eyebrow="APPLICATION"
          status={data.pendingApplications == null ? "확인 중" : `${count(data.pendingApplications)}명 대기`}
          title="지원자 승인"
        >
          <DashboardMetric label="승인 대기 지원자" unit="명" value={data.pendingApplications} />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--active"
          eyebrow="CAMPAIGN"
          status={data.activeCampaigns == null ? "확인 중" : `${count(data.activeCampaigns)}건 운영`}
          title="진행 중 캠페인"
        >
          <DashboardMetric label="활성 캠페인 수" unit="건" value={data.activeCampaigns} />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--today"
          eyebrow="TODAY"
          status={data.todayCampaigns == null ? "확인 중" : `${count(todayCampaignCount)}건`}
          title="오늘 캠페인"
        >
          <div className="fuma-dashboard__today-metrics">
            <DashboardMetric label="오늘 시작" unit="건" value={startingCampaigns} />
            <DashboardMetric label="오늘 종료" unit="건" value={endingCampaigns} />
          </div>
          {data.todayCampaigns && data.todayCampaigns.length > 0 ? (
            <ul className="fuma-dashboard__campaign-list">
              {data.todayCampaigns.slice(0, 3).map((campaign) => (
                <li key={campaign.id}>
                  <span>{campaign.title}</span>
                  <small>{campaign.startDate === today && campaign.endDate === today
                    ? "시작·종료"
                    : campaign.startDate === today ? "시작" : "종료"}</small>
                </li>
              ))}
            </ul>
          ) : data.todayCampaigns ? (
            <p className="fuma-dashboard__empty">오늘 일정 없음</p>
          ) : null}
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--generation"
          eyebrow="CURRENT GENERATION"
          status={data.currentGenerationName ?? "확인 중"}
          title="현재 기수"
        >
          <DashboardMetric
            label="등록 콘텐츠"
            unit="건"
            value={data.currentGenerationContentCount}
          />
        </DashboardCard>
      </div>
    </section>
  );
}
