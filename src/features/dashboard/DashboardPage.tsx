import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { HsECharts, type EChartsOption } from "../../components/charts/HsECharts";
import { ECHARTS_TOOLTIP_STYLE } from "../../components/charts/chartColors";
import { getAdminApplications } from "../../entities/application";
import { getCampaigns } from "../../entities/campaign";
import {
  adaptContentInspection,
  getCurrentGenerationContents,
  type ContentInspectionFixture,
} from "../../entities/content";
import { getContentPerformanceSummary } from "../../entities/performance";
import { getSelectorPerformanceSummary } from "../../entities/selectors";
import { getAdministratorSession } from "../../lib/adminAuthentication";
import { formatCompactCount, formatNumber, formatWon } from "../../lib/formatters";
import "../../styles/dashboard.css";

interface DashboardData {
  activeCampaigns: number | null;
  applicationBreakdown: {
    instagram: number | null;
    youtube: number | null;
  };
  contentBreakdown: {
    instagram: number;
    youtube: number;
  } | null;
  currentGenerationContentCount: number | null;
  inspectionContents: ContentInspectionFixture[] | null;
  pendingApplications: number | null;
  pendingContents: number | null;
  revenueTrend: DailyRevenuePoint[] | null;
  todayContentBreakdown: {
    editedCount: number;
    newCount: number;
  } | null;
  todaySales: number | null;
}

interface DailyRevenuePoint {
  date: string;
  salesAmount: number;
  settlementAmount: number;
}

const EMPTY_DASHBOARD: DashboardData = {
  activeCampaigns: null,
  applicationBreakdown: { instagram: null, youtube: null },
  contentBreakdown: null,
  currentGenerationContentCount: null,
  inspectionContents: null,
  pendingApplications: null,
  pendingContents: null,
  revenueTrend: null,
  todayContentBreakdown: null,
  todaySales: null,
};

function count(value: number | null) {
  return value == null ? "—" : formatNumber(value);
}

function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function recentDateKeys(date = new Date()) {
  return Array.from({ length: 7 }, (_, index) => (
    localDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 6 + index))
  ));
}

function isLocalDate(value: string, dateKey: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && localDateKey(date) === dateKey;
}

function dayLabel(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}.${Number(day)}`;
}

interface RevenueTrendTooltipPoint {
  axisValueLabel?: unknown;
  seriesName?: unknown;
  value?: unknown;
}

function revenueTrendTooltip(params: unknown) {
  const points = (Array.isArray(params) ? params : [params]).filter(
    (point): point is RevenueTrendTooltipPoint => typeof point === "object" && point !== null,
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
  title,
  to,
}: {
  action?: ReactNode;
  children: ReactNode;
  className: string;
  eyebrow: string;
  title: string;
  to?: string;
}) {
  const content = (
    <>
      <header>
        <div><span>{eyebrow}</span><strong>{title}</strong></div>
        {action ? (
          <div className="fuma-dashboard-card__header-actions">
            {action}
          </div>
        ) : null}
      </header>
      {children}
    </>
  );

  if (to) {
    return (
      <Link
        aria-label={`${title} 상세 화면으로 이동`}
        className={`fuma-dashboard-card fuma-dashboard-card--clickable ${className}`}
        to={to}
      >
        {content}
      </Link>
    );
  }

  return (
    <section className={`fuma-dashboard-card ${className}`}>
      {content}
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

function DashboardBreakdown({
  items,
  unit,
}: {
  items: readonly { label: string; value: number | null }[];
  unit: string;
}) {
  return (
    <dl className="fuma-dashboard__breakdown">
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{count(value)}<small>{unit}</small></dd>
        </div>
      ))}
    </dl>
  );
}

function RevenueTrend({ dailyTrend }: { dailyTrend: readonly DailyRevenuePoint[] | null }) {
  if (dailyTrend == null) {
    return <p className="fuma-dashboard-trend__empty">매출·정산 추이를 불러오는 중입니다.</p>;
  }

  if (dailyTrend.length === 0) {
    return <p className="fuma-dashboard-trend__empty">표시할 일별 매출·정산 데이터가 없습니다.</p>;
  }

  const latest = dailyTrend[dailyTrend.length - 1];
  const option: EChartsOption = {
    animation: true,
    animationDuration: 700,
    animationEasing: "cubicOut",
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
      confine: true,
      formatter: revenueTrendTooltip,
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: dailyTrend.map(({ date }) => dayLabel(date)),
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
        name: "매출",
        data: dailyTrend.map(({ salesAmount }) => salesAmount),
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
        name: "정산액",
        data: dailyTrend.map(({ settlementAmount }) => settlementAmount),
        itemStyle: { color: "#5f6368" },
        lineStyle: { color: "#5f6368", type: "dashed", width: 2 },
        showSymbol: false,
        smooth: 0.35,
        yAxisIndex: 1,
      },
    ],
  };
  const accessibleSummary = dailyTrend.map((day) => (
    `${day.date} 매출 ${formatWon(day.salesAmount)}, 정산액 ${formatWon(day.settlementAmount)}`
  )).join(". ");

  return (
    <div className="fuma-dashboard-trend">
      <ul aria-label="오늘 매출 및 정산액" className="fuma-dashboard-trend__latest">
        <li className="is-sales">
          <i />
          <span>오늘 매출</span>
          <strong>{formatWon(latest.salesAmount)}</strong>
        </li>
        <li className="is-settlement">
          <i />
          <span>오늘 정산액</span>
          <strong>{formatWon(latest.settlementAmount)}</strong>
        </li>
      </ul>
      <div
        aria-label={`최근 ${dailyTrend.length}일 매출 및 정산액 추이. ${accessibleSummary}`}
        className="fuma-dashboard-trend__plot"
        role="img"
      >
        <HsECharts height={150} option={option} style={{ height: "150px", width: "100%" }} />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const administratorName = getAdministratorSession()?.name ?? "관리자";
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);

  useEffect(() => {
    const controller = new AbortController();
    const today = localDateKey();
    const revenueDates = recentDateKeys();
    const revenueTrend = Promise.all(revenueDates.map(async (date) => {
      const summary = await getSelectorPerformanceSummary({
        endDate: date,
        startDate: date,
      }, controller.signal);
      return {
        date,
        salesAmount: summary.kpis.totalSales,
        settlementAmount: summary.kpis.accruedCommissionAmount,
      };
    }));

    void Promise.allSettled([
      getCurrentGenerationContents(controller.signal),
      getAdminApplications({
        minimumCriteriaOnly: false,
        page: 0,
        size: 1,
        snsCode: "INSTAGRAM",
        status: "PENDING",
      }, controller.signal),
      getAdminApplications({
        minimumCriteriaOnly: false,
        page: 0,
        size: 1,
        snsCode: "YOUTUBE",
        status: "PENDING",
      }, controller.signal),
      getCampaigns({ page: 0, size: 1, status: "ACTIVE" }, controller.signal),
      getContentPerformanceSummary(controller.signal),
      revenueTrend,
    ]).then(([
      contents,
      instagramApplications,
      youtubeApplications,
      activeCampaigns,
      summary,
      dailyRevenue,
    ]) => {
      if (controller.signal.aborted) return;

      const inspectionRows = contents.status === "fulfilled"
        ? contents.value.map((content) => ({ content, inspection: adaptContentInspection(content) }))
        : null;
      const pendingInspectionRows = inspectionRows?.filter(({ inspection }) => (
        inspection.inspectionStatus === "검수 대기"
      )) ?? null;
      const contentBreakdown = pendingInspectionRows?.reduce((breakdown, { content }) => {
        const platform = content.snsCode === "YOUTUBE" ? "youtube" : "instagram";
        breakdown[platform] += 1;
        return breakdown;
      }, {
        instagram: 0,
        youtube: 0,
      }) ?? null;
      const todayContentBreakdown = contents.status === "fulfilled"
        ? contents.value.reduce((breakdown, content) => {
          if (!isLocalDate(content.latestVersionStoredAt, today)) return breakdown;
          if (content.latestVersionNo === 1) breakdown.newCount += 1;
          else breakdown.editedCount += 1;
          return breakdown;
        }, { editedCount: 0, newCount: 0 })
        : null;
      const pendingApplicationsByPlatform = instagramApplications.status === "fulfilled"
        && youtubeApplications.status === "fulfilled"
        ? instagramApplications.value.totalElements + youtubeApplications.value.totalElements
        : null;

      setData({
        activeCampaigns: activeCampaigns.status === "fulfilled"
          ? activeCampaigns.value.totalElements
          : null,
        applicationBreakdown: {
          instagram: instagramApplications.status === "fulfilled"
            ? instagramApplications.value.totalElements
            : null,
          youtube: youtubeApplications.status === "fulfilled"
            ? youtubeApplications.value.totalElements
            : null,
        },
        contentBreakdown,
        currentGenerationContentCount: summary.status === "fulfilled"
          ? summary.value.currentGenerationContentCount
          : null,
        inspectionContents: inspectionRows?.map(({ inspection }) => inspection) ?? null,
        pendingApplications: pendingApplicationsByPlatform,
        pendingContents: pendingInspectionRows?.length ?? null,
        revenueTrend: dailyRevenue.status === "fulfilled" ? dailyRevenue.value : null,
        todayContentBreakdown,
        todaySales: dailyRevenue.status === "fulfilled"
          ? dailyRevenue.value[dailyRevenue.value.length - 1]?.salesAmount ?? null
          : null,
      });
    });

    return () => controller.abort();
  }, []);

  const inspectionStartContent = data.inspectionContents
    ?.filter((content) => content.inspectionStatus === "검수 대기")
    .slice()
    .reverse()[0];

  return (
    <section aria-labelledby="dashboard-title" className="fuma-dashboard">
      <h1 className="hsas-visually-hidden" id="dashboard-title">대시보드</h1>
      <p className="fuma-dashboard__greeting">안녕하세요, <strong>{administratorName}님</strong></p>
      <div className="fuma-dashboard__grid">
        <DashboardCard
          className="fuma-dashboard-card--inspection"
          eyebrow="AI ANALYSIS"
          title="콘텐츠 검수"
        >
          <div className="fuma-dashboard-inspection__focus">
            <span>검수할 콘텐츠 수</span>
            <strong>{count(data.pendingContents)}<small>건</small></strong>
          </div>
          <DashboardBreakdown
            items={[
              { label: "Instagram", value: data.contentBreakdown?.instagram ?? null },
              { label: "YouTube", value: data.contentBreakdown?.youtube ?? null },
            ]}
            unit="건"
          />
          <Link
            className="fuma-dashboard__primary-action"
            state={inspectionStartContent && data.inspectionContents ? {
              content: inspectionStartContent,
              contents: data.inspectionContents,
              from: "/dashboard",
              inspectionSession: true,
            } : undefined}
            to={inspectionStartContent
              ? `/content/inspections/${inspectionStartContent.id}`
              : "/content/inspections"}
          >
            검수 시작하기
            <span aria-hidden="true">→</span>
          </Link>
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--applications"
          eyebrow="APPLICATION"
          title="지원자 승인"
        >
          <DashboardMetric label="승인 대기 지원자" unit="명" value={count(data.pendingApplications)} />
          <DashboardBreakdown
            items={[
              { label: "Instagram", value: data.applicationBreakdown.instagram },
              { label: "YouTube", value: data.applicationBreakdown.youtube },
            ]}
            unit="명"
          />
          <Link className="fuma-dashboard__primary-action" to="/applicants">
            지원자 검토하기
            <span aria-hidden="true">→</span>
          </Link>
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--active"
          eyebrow="CAMPAIGN"
          title="진행 중 캠페인"
        >
          <DashboardMetric label="활성 캠페인 수" unit="건" value={count(data.activeCampaigns)} />
        </DashboardCard>

        <DashboardCard
          action={(
            <Link
              className="fuma-dashboard__primary-action fuma-dashboard__primary-action--compact"
              to="/performance/contents"
            >
              콘텐츠 성과
            </Link>
          )}
          className="fuma-dashboard-card--generation"
          eyebrow="CONTENT"
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
              정산 관리
            </Link>
          )}
          className="fuma-dashboard-card--trend"
          eyebrow="REVENUE"
          title="매출·정산 추이"
        >
          <RevenueTrend dailyTrend={data.revenueTrend} />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--daily"
          eyebrow="TODAY"
          title="오늘 들어온 콘텐츠"
        >
          <DashboardBreakdown
            items={[
              { label: "신규", value: data.todayContentBreakdown?.newCount ?? null },
              { label: "수정", value: data.todayContentBreakdown?.editedCount ?? null },
            ]}
            unit="건"
          />
        </DashboardCard>

        <DashboardCard
          className="fuma-dashboard-card--daily"
          eyebrow="TODAY"
          title="오늘 발생한 매출"
        >
          <DashboardMetric
            label="오늘 00:00부터 현재까지"
            value={data.todaySales == null ? "—" : formatWon(data.todaySales)}
          />
        </DashboardCard>
      </div>
    </section>
  );
}
