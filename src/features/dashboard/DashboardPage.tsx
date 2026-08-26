import {
  BarChart3,
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
  detail,
  icon: Icon,
  label,
  to,
  value,
}: {
  detail?: string | null;
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
        {detail && <span>{detail}</span>}
      </span>
    </Link>
  );
}

function TodayTask({
  detail,
  icon: Icon,
  label,
  to,
  value,
}: {
  detail?: string;
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
          {detail && <small>{detail}</small>}
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

  return (
    <section className="fuma-page fuma-dashboard">
      <PageHeader title="대시보드" />
      <div className="fuma-page__body">
        <section aria-labelledby="dashboard-priority-title" className="fuma-dashboard__priority">
          <h2 id="dashboard-priority-title">우선 처리</h2>
          <ul className="fuma-dashboard__tasks">
            <TodayTask icon={CircleHelp} label="승인 대기 지원자" to="/applicants" value={data.pendingApplications} />
            <TodayTask icon={ShieldCheck} label="검수 대기 콘텐츠" to="/content/inspections" value={data.pendingContents} />
          </ul>
        </section>

        <section aria-labelledby="dashboard-campaigns-title" className="fuma-dashboard__campaigns">
          <header>
            <h2 id="dashboard-campaigns-title">오늘 시작·종료하는 캠페인</h2>
            <strong>{count(todayCampaignCount)}</strong>
          </header>
          <dl>
            <div><dt>시작</dt><dd>{count(startingCampaigns ?? null)}건</dd></div>
            <div><dt>종료</dt><dd>{count(endingCampaigns ?? null)}건</dd></div>
          </dl>
          {data.todayCampaigns && data.todayCampaigns.length > 0 ? (
            <ul>
              {data.todayCampaigns.slice(0, 3).map((campaign) => (
                <li key={campaign.id}>
                  <Link to="/campaigns">
                    <span>{campaign.title}</span>
                    <small>{campaign.startDate === today && campaign.endDate === today
                      ? "시작·종료"
                      : campaign.startDate === today ? "시작" : "종료"}</small>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>{data.todayCampaigns ? "오늘 일정 없음" : "불러오는 중"}</p>
          )}
        </section>

        <section aria-labelledby="dashboard-stats-title" className="fuma-dashboard-panel fuma-dashboard-panel--stats">
          <h2 id="dashboard-stats-title">운영 현황</h2>
          <div aria-label="주요 통계" className="fuma-dashboard__stats">
            <DashboardStat
              detail={todayCampaignCount == null ? null : `시작 ${startingCampaigns ?? 0}건 · 종료 ${endingCampaigns ?? 0}건`}
              icon={ClipboardList}
              label="오늘 시작·종료하는 캠페인"
              to="/campaigns"
              value={todayCampaignCount}
            />
            <DashboardStat icon={BarChart3} label="진행 중 캠페인" to="/campaigns" value={data.activeCampaigns} />
            <DashboardStat icon={UsersRound} label="전체 셀렉터스" to="/selectors" value={data.selectors} />
            <DashboardStat detail={data.currentGenerationName} icon={Images} label="현재 기수 콘텐츠" to="/performance/contents" value={data.currentGenerationContentCount} />
          </div>
        </section>

        <section aria-labelledby="dashboard-shortcuts-title" className="fuma-dashboard__shortcut-section">
          <h2 id="dashboard-shortcuts-title">바로가기</h2>
          <nav aria-label="관리자 바로가기" className="fuma-dashboard__shortcuts">
            {DASHBOARD_LINKS.map(({ label, to }) => (
              <Link key={to} to={to}><span>{label}</span><b aria-hidden>→</b></Link>
            ))}
          </nav>
        </section>
      </div>
    </section>
  );
}
