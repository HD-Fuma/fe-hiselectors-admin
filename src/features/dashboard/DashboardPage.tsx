import { useEffect, useState, type ReactNode } from "react";
import { getAdminApplications } from "../../entities/application";
import { getCampaigns } from "../../entities/campaign";
import { adaptContentInspection, getCurrentGenerationContents } from "../../entities/content";
import { getContentPerformanceSummary } from "../../entities/performance";
import { getAdministratorSession } from "../../lib/adminAuthentication";
import { formatNumber } from "../../lib/formatters";
import "../../styles/dashboard.css";

interface DashboardData {
  activeCampaigns: number | null;
  averageInspectionHours: number | null;
  completedContents: number | null;
  currentGenerationContentCount: number | null;
  currentGenerationInspectionCount: number | null;
  currentGenerationName: string | null;
  inspectionDurationSampleCount: number | null;
  pendingApplications: number | null;
  pendingContents: number | null;
  previousGenerationContentCount: number | null;
  previousGenerationName: string | null;
  processedApplications: number | null;
  totalApplications: number | null;
}

const EMPTY_DASHBOARD: DashboardData = {
  activeCampaigns: null,
  averageInspectionHours: null,
  completedContents: null,
  currentGenerationContentCount: null,
  currentGenerationInspectionCount: null,
  currentGenerationName: null,
  inspectionDurationSampleCount: null,
  pendingApplications: null,
  pendingContents: null,
  previousGenerationContentCount: null,
  previousGenerationName: null,
  processedApplications: null,
  totalApplications: null,
};

function count(value: number | null) {
  return value == null ? "—" : formatNumber(value);
}

function rate(numerator: number | null, denominator: number | null) {
  return numerator == null || denominator == null || denominator === 0
    ? null
    : (numerator / denominator) * 100;
}

function decimal(value: number | null) {
  return value == null
    ? "—"
    : value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

function growth(value: number | null) {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${decimal(value)}`;
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
  detail,
  label,
  unit,
  value,
}: {
  detail?: string;
  label: string;
  unit?: string;
  value: string;
}) {
  return (
    <div className="fuma-dashboard__metric">
      <span>{label}</span>
      <strong>{value}{unit ? <small>{unit}</small> : null}</strong>
      {detail ? <small className="fuma-dashboard__metric-detail">{detail}</small> : null}
    </div>
  );
}

export function DashboardPage() {
  const administratorName = getAdministratorSession()?.name ?? "관리자";
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.allSettled([
      getCurrentGenerationContents(controller.signal),
      getAdminApplications({ page: 0, size: 1 }, controller.signal),
      getAdminApplications({ page: 0, size: 1, status: "APPROVED" }, controller.signal),
      getAdminApplications({ page: 0, size: 1, status: "REJECTED" }, controller.signal),
      getCampaigns({ page: 0, size: 1, status: "ACTIVE" }, controller.signal),
      getContentPerformanceSummary(controller.signal),
    ]).then(([
      contents,
      applications,
      approvedApplications,
      rejectedApplications,
      activeCampaigns,
      summary,
    ]) => {
      if (controller.signal.aborted) return;

      const inspectionRows = contents.status === "fulfilled"
        ? contents.value.map((content) => ({ content, inspection: adaptContentInspection(content) }))
        : null;
      const completedContents = inspectionRows?.filter(({ inspection }) => (
        inspection.inspectionStatus === "승인" || inspection.inspectionStatus === "위반"
      )).length ?? null;
      const inspectionDurations = inspectionRows?.flatMap(({ content }) => {
        if (!content.inspectedAt) return [];
        const duration = Date.parse(content.inspectedAt) - Date.parse(content.storedAt);
        return Number.isFinite(duration) && duration >= 0 ? [duration] : [];
      }) ?? null;
      const totalApplications = applications.status === "fulfilled"
        ? applications.value.totalElements
        : null;
      const processedApplications = approvedApplications.status === "fulfilled"
        && rejectedApplications.status === "fulfilled"
        ? approvedApplications.value.totalElements + rejectedApplications.value.totalElements
        : null;

      setData({
        activeCampaigns: activeCampaigns.status === "fulfilled"
          ? activeCampaigns.value.totalElements
          : null,
        averageInspectionHours: inspectionDurations?.length
          ? inspectionDurations.reduce((sum, duration) => sum + duration, 0)
            / inspectionDurations.length / 3_600_000
          : null,
        completedContents,
        currentGenerationContentCount: summary.status === "fulfilled"
          ? summary.value.currentGenerationContentCount
          : null,
        currentGenerationInspectionCount: inspectionRows?.length ?? null,
        currentGenerationName: summary.status === "fulfilled"
          ? summary.value.currentGenerationName
          : null,
        inspectionDurationSampleCount: inspectionDurations?.length ?? null,
        pendingApplications: totalApplications != null && processedApplications != null
          ? Math.max(0, totalApplications - processedApplications)
          : null,
        pendingContents: inspectionRows?.filter(({ inspection }) => (
          inspection.inspectionStatus === "검수 대기"
        )).length ?? null,
        previousGenerationContentCount: summary.status === "fulfilled"
          ? summary.value.previousGenerationContentCount
          : null,
        previousGenerationName: summary.status === "fulfilled"
          ? summary.value.previousGenerationName
          : null,
        processedApplications,
        totalApplications,
      });
    });

    return () => controller.abort();
  }, []);

  const contentInspectionCompletionRate = rate(
    data.completedContents,
    data.currentGenerationInspectionCount,
  );
  const applicationProcessingRate = rate(data.processedApplications, data.totalApplications);
  const contentGrowthRate = data.currentGenerationContentCount == null
    || data.previousGenerationContentCount == null
    || data.previousGenerationContentCount === 0
    ? null
    : ((data.currentGenerationContentCount - data.previousGenerationContentCount)
      / data.previousGenerationContentCount) * 100;

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
          <DashboardMetric label="검수할 콘텐츠 수" unit="건" value={count(data.pendingContents)} />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--applications"
          eyebrow="APPLICATION"
          status={data.pendingApplications == null ? "확인 중" : `${count(data.pendingApplications)}명 대기`}
          title="지원자 승인"
        >
          <DashboardMetric label="승인 대기 지원자" unit="명" value={count(data.pendingApplications)} />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--active"
          eyebrow="CAMPAIGN"
          status={data.activeCampaigns == null ? "확인 중" : `${count(data.activeCampaigns)}건 운영`}
          title="진행 중 캠페인"
        >
          <DashboardMetric label="활성 캠페인 수" unit="건" value={count(data.activeCampaigns)} />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--generation"
          eyebrow="CONTENT"
          status={data.currentGenerationName ?? "확인 중"}
          title="현재 기수 콘텐츠"
        >
          <DashboardMetric
            label="등록된 콘텐츠 수"
            unit="건"
            value={count(data.currentGenerationContentCount)}
          />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--kpi"
          eyebrow="QUALITY"
          status={data.currentGenerationName ?? "현재 기수"}
          title="검수 완료율"
        >
          <DashboardMetric
            detail={`${count(data.completedContents)} / ${count(data.currentGenerationInspectionCount)}건`}
            label="완료 콘텐츠 ÷ 전체 콘텐츠"
            unit="%"
            value={decimal(contentInspectionCompletionRate)}
          />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--kpi"
          eyebrow="SPEED"
          status="검수 기록 기준"
          title="평균 검수시간"
        >
          <DashboardMetric
            detail={`${count(data.inspectionDurationSampleCount)}건 기준`}
            label="검수 완료 - 콘텐츠 저장"
            unit="시간"
            value={decimal(data.averageInspectionHours)}
          />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--kpi"
          eyebrow="APPLICATION"
          status="전체 기준"
          title="지원자 처리율"
        >
          <DashboardMetric
            detail={`${count(data.processedApplications)} / ${count(data.totalApplications)}명`}
            label="승인·거절 ÷ 전체 지원자"
            unit="%"
            value={decimal(applicationProcessingRate)}
          />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--kpi"
          eyebrow="GROWTH"
          status={data.previousGenerationName ?? "이전 기수"}
          title="콘텐츠 증감률"
        >
          <DashboardMetric
            detail={`${count(data.previousGenerationContentCount)}건 → ${count(data.currentGenerationContentCount)}건`}
            label="이전 기수 대비 현재 기수"
            unit="%"
            value={growth(contentGrowthRate)}
          />
        </DashboardCard>
      </div>
    </section>
  );
}
