import {
  BarChart3,
  Bell,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Images,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { getAdminApplications } from "../../entities/application";
import { getCampaigns, type Campaign } from "../../entities/campaign";
import { adaptContentInspection, getCurrentGenerationContents } from "../../entities/content";
import { getContentPerformanceSummary } from "../../entities/performance";
import { getSelectors } from "../../entities/selectors";
import { formatNumber } from "../../lib/formatters";
import "../../styles/dashboard.css";

interface DashboardData {
  activeCampaigns: number | null;
  currentGenerationContentCount: number | null;
  currentGenerationName: string | null;
  pendingApplications: number | null;
  pendingContents: number | null;
  selectors: number | null;
  todayCampaigns: Campaign[] | null;
}

const EMPTY_DASHBOARD: DashboardData = {
  activeCampaigns: null,
  currentGenerationContentCount: null,
  currentGenerationName: null,
  pendingApplications: null,
  pendingContents: null,
  selectors: null,
  todayCampaigns: null,
};

const DASHBOARD_LINKS = [
  { to: "/campaigns/new", label: "캠페인 생성" },
  { to: "/applicants", label: "지원자 승인" },
  { to: "/content/inspections", label: "콘텐츠 검수" },
  { to: "/creators", label: "크리에이터 풀" },
  { to: "/performance/selectors", label: "셀렉터스 성과" },
  { to: "/settlements", label: "정산 관리" },
] as const;

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

function DashboardStat({
  description,
  icon: Icon,
  label,
  to,
  value,
}: {
  description: string;
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
  label: string;
  to: string;
  value: number | null;
}) {
  return (
    <Link className="fuma-dashboard-stat" to={to}>
      <span className="fuma-dashboard-stat__icon"><Icon aria-hidden /></span>
      <span className="fuma-dashboard-stat__copy">
        <small>{label}</small>
        <strong>{count(value)}</strong>
        <span>{description}</span>
      </span>
    </Link>
  );
}

function TodayTask({
  description,
  icon: Icon,
  label,
  to,
  value,
}: {
  description: string;
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
  label: string;
  to: string;
  value: number | null;
}) {
  return (
    <li>
      <Link className="fuma-dashboard-task" to={to}>
        <span className="fuma-dashboard-task__icon"><Icon aria-hidden /></span>
        <span className="fuma-dashboard-task__copy">
          <strong>{label}</strong>
          <small>{description}</small>
        </span>
        <b>{count(value)}<small>건</small></b>
      </Link>
    </li>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const today = dateInSeoul();

  useEffect(() => {
    const controller = new AbortController();

    Promise.allSettled([
      getAdminApplications({ page: 0, size: 1, status: "PENDING" }, controller.signal),
      getCurrentGenerationContents(controller.signal),
      // ponytail: 관리자 API의 최대 100건으로 충분하며, 일일 캠페인이 이를 넘으면 집계 API를 추가한다.
      getCampaigns({ endDate: today, page: 0, size: 100, startDate: today }, controller.signal),
      getCampaigns({ page: 0, size: 1, status: "ACTIVE" }, controller.signal),
      getSelectors({ page: 0, size: 1 }, controller.signal),
      getContentPerformanceSummary(controller.signal),
    ]).then(([applications, contents, campaigns, activeCampaigns, selectors, summary]) => {
      if (controller.signal.aborted) return;
      const todayCampaigns = campaigns.status === "fulfilled"
        ? campaigns.value.content.filter(
          (campaign) => campaign.startDate === today || campaign.endDate === today,
        )
        : null;

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
            .filter((content) => content.inspectionStatus === "검수 대기").length
          : null,
        selectors: selectors.status === "fulfilled" ? selectors.value.totalElements : null,
        todayCampaigns,
      });
    });

    return () => controller.abort();
  }, [today]);

  const todayCampaignCount = data.todayCampaigns?.length ?? null;
  const startingCampaigns = data.todayCampaigns?.filter(({ startDate }) => startDate === today).length;
  const endingCampaigns = data.todayCampaigns?.filter(({ endDate }) => endDate === today).length;
  const pendingTotal = [data.pendingApplications, data.pendingContents, todayCampaignCount]
    .every((value) => value != null)
    ? (data.pendingApplications ?? 0) + (data.pendingContents ?? 0) + (todayCampaignCount ?? 0)
    : null;
  const todayLabel = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
    timeZone: "Asia/Seoul",
  }).format(new Date());

  return (
    <section className="fuma-page fuma-dashboard">
      <PageHeader title="대시보드" />
      <div className="fuma-page__body">
        <header className="fuma-dashboard__welcome">
          <div>
            <span>{todayLabel}</span>
            <h2>오늘도 중요한 업무부터 확인하세요.</h2>
          </div>
          <div className="fuma-dashboard__today-total">
            <small>오늘 확인할 업무</small>
            <strong>{count(pendingTotal)}<span>건</span></strong>
          </div>
        </header>

        <section aria-label="주요 통계" className="fuma-dashboard__stats">
          <DashboardStat description="현재 진행 중" icon={BarChart3} label="진행 중 캠페인" to="/campaigns" value={data.activeCampaigns} />
          <DashboardStat description="등록된 전체 인원" icon={UsersRound} label="전체 셀렉터스" to="/selectors" value={data.selectors} />
          <DashboardStat description={data.currentGenerationName ?? "현재 활동 기수"} icon={Images} label="현재 기수 콘텐츠" to="/performance/contents" value={data.currentGenerationContentCount} />
          <DashboardStat description="지원자·검수·오늘 캠페인" icon={CheckCircle2} label="오늘 확인할 업무" to="/applicants" value={pendingTotal} />
        </section>

        <div className="fuma-dashboard__columns">
          <section aria-labelledby="dashboard-tasks-title" className="fuma-dashboard-panel">
            <header className="fuma-dashboard-panel__header">
              <div><span>TODAY</span><h2 id="dashboard-tasks-title">오늘 할 일</h2></div>
              <small>확인이 필요한 업무를 모았습니다.</small>
            </header>
            <ul className="fuma-dashboard__tasks">
              <TodayTask description="심사를 기다리는 지원자" icon={CircleHelp} label="승인 대기 지원자" to="/applicants" value={data.pendingApplications} />
              <TodayTask description="현재 기수의 미처리 콘텐츠" icon={ShieldCheck} label="검수 대기 콘텐츠" to="/content/inspections" value={data.pendingContents} />
              <TodayTask
                description={todayCampaignCount == null ? "오늘 일정 확인 중" : `시작 ${startingCampaigns ?? 0}건 · 종료 ${endingCampaigns ?? 0}건`}
                icon={ClipboardList}
                label="오늘 시작·종료하는 캠페인"
                to="/campaigns"
                value={todayCampaignCount}
              />
            </ul>
          </section>

          <section aria-labelledby="dashboard-shortcuts-title" className="fuma-dashboard-panel">
            <header className="fuma-dashboard-panel__header">
              <div><span>QUICK MENU</span><h2 id="dashboard-shortcuts-title">바로가기</h2></div>
            </header>
            <nav aria-label="관리자 바로가기" className="fuma-dashboard__shortcuts">
              {DASHBOARD_LINKS.map(({ label, to }) => (
                <Link key={to} to={to}><span>{label}</span><b aria-hidden>→</b></Link>
              ))}
            </nav>
            <div className="fuma-dashboard__notice">
              <Bell aria-hidden />
              <span><strong>운영 현황</strong>각 수치는 현재 DB 조회 결과를 기준으로 표시됩니다.</span>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
