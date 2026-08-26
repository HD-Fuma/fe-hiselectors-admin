import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { HsECharts, type EChartsOption } from "../../components/charts/HsECharts";
import { ECHARTS_TOOLTIP_STYLE } from "../../components/charts/chartColors";
import { getAdminApplications } from "../../entities/application";
import { getCampaigns } from "../../entities/campaign";
import { adaptContentInspection, getCurrentGenerationContents } from "../../entities/content";
import { getContentPerformanceSummary } from "../../entities/performance";
import {
  getSettlementEstimateSummary,
  type SettlementMonthlySummary,
} from "../../entities/settlement";
import { getAdministratorSession } from "../../lib/adminAuthentication";
import { formatCompactCount, formatNumber, formatWon } from "../../lib/formatters";
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
  settlementTrend: SettlementMonthlySummary[] | null;
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
  settlementTrend: null,
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

function currentActivityMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(activityMonth: string) {
  const [, month] = activityMonth.split("-");
  return `${Number(month)}월`;
}

interface SettlementTrendTooltipPoint {
  axisValueLabel?: unknown;
  seriesName?: unknown;
  value?: unknown;
}

function settlementTrendTooltip(params: unknown) {
  const points = (Array.isArray(params) ? params : [params]).filter(
    (point): point is SettlementTrendTooltipPoint => typeof point === "object" && point !== null,
  );
  const title = typeof points[0]?.axisValueLabel === "string"
    ? points[0].axisValueLabel
    : "";
  return [
    title,
    ...points.map((point) => `${String(point.seriesName ?? "")}: ${formatWon(Number(point.value ?? 0))}`),
  ].filter(Boolean).join("<br/>");
}

function DashboardCard({
  action,
  children,
  className,
  eyebrow,
  status,
  title,
}: {
  action?: ReactNode;
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
        <div className="fuma-dashboard-card__header-actions">
          <em>{status}</em>
          {action}
        </div>
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

function SettlementTrend({ monthlyTrend }: { monthlyTrend: readonly SettlementMonthlySummary[] | null }) {
  if (monthlyTrend == null) {
    return <p className="fuma-dashboard-trend__empty">매출·정산 추이를 불러오는 중입니다.</p>;
  }

  if (monthlyTrend.length === 0) {
    return <p className="fuma-dashboard-trend__empty">표시할 월별 매출·정산 데이터가 없습니다.</p>;
  }

  const latest = monthlyTrend[monthlyTrend.length - 1];
  const option: EChartsOption = {
    animation: false,
    grid: {
      bottom: 32,
      left: 56,
      right: 56,
      top: 18,
    },
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      axisPointer: {
        lineStyle: { color: "rgb(17 17 17 / 18%)", type: "dashed" },
        type: "line",
      },
      formatter: settlementTrendTooltip,
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: monthlyTrend.map(({ activityMonth }) => monthLabel(activityMonth)),
      axisLabel: {
        color: "rgb(32 34 36 / 48%)",
        fontSize: 10,
        fontWeight: 700,
        margin: 12,
      },
      axisLine: { lineStyle: { color: "rgb(32 34 36 / 10%)" } },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: [
      {
        type: "value",
        min: 0,
        axisLabel: {
          color: "rgb(32 34 36 / 42%)",
          fontSize: 9,
          formatter: (value: number) => formatCompactCount(value),
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "rgb(32 34 36 / 7%)", type: "dashed" } },
      },
      {
        type: "value",
        min: 0,
        axisLabel: {
          color: "rgb(32 34 36 / 34%)",
          fontSize: 9,
          formatter: (value: number) => formatCompactCount(value),
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        type: "line",
        name: "확정 매출",
        data: monthlyTrend.map(({ confirmedSalesAmount }) => confirmedSalesAmount),
        lineStyle: { color: "#111111", width: 3 },
        itemStyle: {
          borderColor: "#111111",
          borderWidth: 2,
          color: "#ffffff",
        },
        smooth: 0.35,
        symbol: "circle",
        symbolSize: 7,
      },
      {
        type: "line",
        name: "예상 정산액",
        data: monthlyTrend.map(({ settlementAmount }) => settlementAmount),
        lineStyle: { color: "#92969a", type: "dashed", width: 2 },
        showSymbol: false,
        smooth: 0.35,
        yAxisIndex: 1,
      },
    ],
  };
  const accessibleSummary = monthlyTrend.map((month) => (
    `${month.activityMonth} 확정 매출 ${formatWon(month.confirmedSalesAmount)}, 예상 정산액 ${formatWon(month.settlementAmount)}`
  )).join(". ");

  return (
    <div className="fuma-dashboard-trend">
      <ul aria-label="최근 월 매출 및 정산액" className="fuma-dashboard-trend__latest">
        <li className="is-sales">
          <i />
          <span>최근 확정 매출</span>
          <strong>{formatWon(latest.confirmedSalesAmount)}</strong>
        </li>
        <li className="is-settlement">
          <i />
          <span>최근 예상 정산액</span>
          <strong>{formatWon(latest.settlementAmount)}</strong>
        </li>
      </ul>
      <div
        aria-label={`최근 ${monthlyTrend.length}개월 확정 매출 및 예상 정산액 추이. ${accessibleSummary}`}
        className="fuma-dashboard-trend__plot"
        role="img"
      >
        <HsECharts height={170} option={option} style={{ height: "170px", width: "100%" }} />
      </div>
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
      getSettlementEstimateSummary({ activityMonth: currentActivityMonth() }, controller.signal),
    ]).then(([
      contents,
      applications,
      approvedApplications,
      rejectedApplications,
      activeCampaigns,
      summary,
      settlementSummary,
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
        settlementTrend: settlementSummary.status === "fulfilled"
          ? [...settlementSummary.value.monthlyTrend]
            .sort((left, right) => left.activityMonth.localeCompare(right.activityMonth))
            .slice(-6)
          : null,
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
          <div className="fuma-dashboard-inspection__focus">
            <span>검수할 콘텐츠 수</span>
            <strong>{count(data.pendingContents)}<small>건</small></strong>
          </div>
          <Link className="fuma-dashboard__primary-action" to="/content/inspections">
            검수 시작하기
            <span aria-hidden="true">→</span>
          </Link>
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--applications"
          eyebrow="APPLICATION"
          status={data.pendingApplications == null ? "확인 중" : `${count(data.pendingApplications)}명 대기`}
          title="지원자 승인"
        >
          <DashboardMetric label="승인 대기 지원자" unit="명" value={count(data.pendingApplications)} />
          <Link className="fuma-dashboard__primary-action" to="/applicants">
            지원자 검토하기
            <span aria-hidden="true">→</span>
          </Link>
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
          action={(
            <Link
              className="fuma-dashboard__primary-action fuma-dashboard__primary-action--compact"
              to="/settlements"
            >
              정산 관리 →
            </Link>
          )}
          className="fuma-dashboard-card--trend"
          eyebrow="REVENUE"
          status={data.settlementTrend == null
            ? "확인 중"
            : data.settlementTrend.length > 0
              ? `최근 ${data.settlementTrend.length}개월`
              : "데이터 없음"}
          title="매출·정산 추이"
        >
          <SettlementTrend monthlyTrend={data.settlementTrend} />
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
