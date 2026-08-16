import { PlatformIcon } from "../../../components/social/PlatformIcon";
import { DenseTable, type DenseTableColumn } from "../../../components/ui/DenseTable";
import { SidePanel } from "../../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../../components/ui/StatusPill";
import { formatNumber, formatWon } from "../../../lib/formatters";
import type {
  SettlementEstimate,
  SettlementPaymentStatus,
  SettlementSelectorDetail,
} from "../../settlement";
import { getSelectorDetailData, type SelectorSocialLink } from "../model/detailData";
import type { SelectorFixture } from "../model/fixtures";

function selectorStatusTone(
  status: SelectorFixture["status"],
): NonNullable<StatusPillProps["tone"]> {
  if (status === "활동 중") {
    return "approved";
  }
  if (status === "경고") {
    return "pending";
  }
  if (status === "박탈") {
    return "rejected";
  }
  return "neutral";
}

interface SelectorSettlementTableRow {
  id: string;
  ordinal: number;
  settlementMonth: string | null | undefined;
  confirmedPurchaseCount: number | null | undefined;
  totalSales: number | null | undefined;
  commissionRate: number | null | undefined;
  estimatedCommission: number | null | undefined;
  status: SelectorSettlementStatus | "-";
}

type SelectorSettlementStatus = SettlementPaymentStatus | "계산 중" | "지급 대기" | "지급 보류";

function settlementStatusTone(
  status: SelectorSettlementStatus | "-",
): NonNullable<StatusPillProps["tone"]> {
  if (status === "지급 완료") return "approved";
  if (status === "확정" || status === "지급 대기") return "pending";
  if (status === "지급 보류") return "danger";
  return "neutral";
}

function settlementStatusLabel(
  status: SettlementEstimate["status"] | null | undefined,
): SelectorSettlementStatus | "-" {
  if (!status) return "-";
  if (status === "SETTLED") return "지급 완료";
  if (status === "PAYMENT_PENDING") return "지급 대기";
  if (status === "PAYMENT_HOLD") return "지급 보류";
  return "계산 중";
}

function settlementProfileSnsLink(
  profile: SettlementSelectorDetail["profile"],
): SelectorSocialLink | null {
  const platform = profile.snsCode === "INSTAGRAM"
    ? "Instagram"
    : profile.snsCode === "YOUTUBE"
      ? "YouTube"
      : null;

  if (!platform) return null;

  const accountId = profile.accountId ?? "";
  const normalizedAccountId = accountId.replace(/^@/, "");
  const url = accountId.startsWith("http")
    ? accountId
    : platform === "YouTube"
      ? `https://www.youtube.com/${normalizedAccountId}`
      : `https://www.instagram.com/${normalizedAccountId}`;

  return {
    handle: displayText(accountId),
    platform,
    url,
  };
}

function displayDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

function displayText(value: string | number | null | undefined) {
  return value == null || value === "" ? "-" : String(value);
}

function displayNumber(value: number | null | undefined) {
  return value == null ? "-" : formatNumber(value);
}

function displayWon(value: number | null | undefined) {
  return value == null ? "-" : formatWon(value);
}

function displayRate(value: number | null | undefined) {
  return value == null ? "-" : `${formatNumber(value)}%`;
}

function displayCount(value: number | null | undefined) {
  const formatted = displayNumber(value);
  return formatted === "-" ? formatted : `${formatted}건`;
}

const SETTLEMENT_COLUMNS: DenseTableColumn<SelectorSettlementTableRow>[] = [
  {
    key: "ordinal",
    header: "순번",
    width: 55,
    align: "center",
    render: (settlement) => displayNumber(settlement.ordinal),
  },
  {
    key: "settlementMonth",
    header: "정산 대상월",
    width: 85,
    align: "center",
    render: (settlement) => displayText(settlement.settlementMonth),
  },
  {
    key: "confirmedPurchaseCount",
    header: "정산 건수",
    width: 105,
    align: "center",
    render: (settlement) => displayNumber(settlement.confirmedPurchaseCount),
  },
  {
    key: "totalSales",
    header: "정산 대상 매출",
    width: 125,
    align: "center",
    render: (settlement) => displayWon(settlement.totalSales),
  },
  {
    key: "commissionRate",
    header: "수수료율",
    width: 75,
    align: "center",
    render: (settlement) => displayRate(settlement.commissionRate),
  },
  {
    key: "estimatedCommission",
    header: "정산 수수료",
    width: 115,
    align: "center",
    render: (settlement) => displayWon(settlement.estimatedCommission),
  },
  {
    key: "status",
    header: "정산 상태",
    width: 90,
    align: "center",
    render: (settlement) => (
      <StatusPill tone={settlementStatusTone(settlement.status)}>
        {settlement.status}
      </StatusPill>
    ),
  },
];

export function SelectorDetailPanel({
  onClose,
  selector,
  settlementDetail,
  settlementDetailError = false,
  settlementDetailLoading = false,
}: {
  onClose: () => void;
  selector?: SelectorFixture;
  settlementDetail?: SettlementSelectorDetail | null;
  settlementDetailError?: boolean;
  settlementDetailLoading?: boolean;
}) {
  const fixtureDetail = selector ? getSelectorDetailData(selector) : null;
  const apiProfile = settlementDetail?.profile;
  const settlementSummary = settlementDetail?.settlementSummary;
  const primarySns = settlementDetail !== undefined
    ? apiProfile ? settlementProfileSnsLink(apiProfile) : null
    : fixtureDetail?.snsLinks[0] ?? null;
  const audienceLabel = primarySns?.platform === "YouTube" ? "구독자" : "팔로워";
  const settlementHistory = settlementDetail?.histories;
  const hasApiSettlementDetail = settlementDetail !== undefined;
  const settlementRows: SelectorSettlementTableRow[] = hasApiSettlementDetail
    ? (settlementHistory?.content ?? []).map((settlement, index) => ({
      id: String(settlement.settlementId),
      ordinal: (settlementHistory?.number ?? 0) * (settlementHistory?.size ?? 12) + index + 1,
      settlementMonth: settlement.settlementMonth,
      confirmedPurchaseCount: settlement.confirmedPurchaseCount,
      totalSales: settlement.totalSales,
      commissionRate: settlement.commissionRate,
      estimatedCommission: settlement.estimatedCommission,
      status: settlementStatusLabel(settlement.status),
    }))
    : selector && fixtureDetail
    ? fixtureDetail.settlements.map((settlement, index) => ({
      id: settlement.id,
      ordinal: index + 1,
      settlementMonth: settlement.month,
      confirmedPurchaseCount: undefined,
      totalSales: undefined,
      commissionRate: undefined,
      estimatedCommission: settlement.amount,
      status: settlement.status,
    }))
    : [];
  const settlementCount = hasApiSettlementDetail
    ? settlementHistory?.totalElements ?? 0
    : fixtureDetail?.settlements.length ?? 0;
  const settlementEmptyMessage = hasApiSettlementDetail
    ? settlementDetailLoading
      ? <span aria-live="polite" role="status">정산 내역을 불러오는 중입니다.</span>
      : settlementDetailError
        ? <span role="alert">셀렉터스 상세 정보 조회에 실패했습니다.</span>
        : "조회된 정산 내역이 없습니다."
    : undefined;

  return (
    <SidePanel onClose={onClose} title="셀렉터스 상세">
      {selector && fixtureDetail ? (
        <div className="fuma-detail-panel__content fuma-selector-detail-panel">
          <section
            aria-label="셀렉터스 프로필"
            className="fuma-creator-detail-hero fuma-selector-detail-hero fuma-unified-detail-hero"
          >
            <div className="fuma-creator-detail-hero__portrait">
              <img
                alt={`${apiProfile?.selectorsNickname ?? selector.name} 프로필`}
                src={apiProfile?.profileImageUrl || fixtureDetail.profileImageUrl}
              />
              {primarySns ? (
                <span className="fuma-creator-detail-hero__platform">
                  <PlatformIcon platform={primarySns.platform as "Instagram" | "YouTube"} />
                </span>
              ) : null}
            </div>
            <div className="fuma-creator-detail-hero__content">
              <div className="fuma-creator-detail-hero__identity">
                <div className="fuma-creator-detail-hero__title-row">
                  <h2>{apiProfile?.selectorsNickname ?? selector.name}</h2>
                  <StatusPill tone={selectorStatusTone(selector.status)}>{selector.status}</StatusPill>
                </div>
                {primarySns ? (
                  <a className="fuma-creator-detail-hero__channel" href={primarySns.url} rel="noreferrer" target="_blank">
                    <PlatformIcon decorative platform={primarySns.platform as "Instagram" | "YouTube"} />
                    <span>{primarySns.platform}</span>
                    <span>{primarySns.handle}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
                <div aria-label="셀렉터스 정보" className="fuma-creator-detail-hero__categories">
                  <strong>{selector.category ?? "셀렉터스"}</strong>
                  <span aria-hidden="true">/</span>
                  <span>
                    {apiProfile?.selectorsId ?? selector.id}
                    {" · "}
                    {apiProfile?.selectorsCode ?? selector.selectorCode}
                    {" · "}
                    {apiProfile?.selectorsNickname ?? selector.shopNickname}
                  </span>
                </div>
              </div>
              <p className="fuma-unified-detail-hero__summary">
                {selector.cohort} · {selector.status} · 마지막 수집 {displayDateTime(apiProfile?.lastCollectedAt ?? selector.recentActivity)}
                {settlementDetail ? ` · 정산 기준 ${displayText(settlementSummary?.currentMonth)} · 다음 지급 ${displayText(settlementSummary?.nextPaymentMonth)}` : null}
              </p>
              <dl className="fuma-creator-detail-hero__metrics">
                {settlementDetail ? (
                  <>
                    <div><dt>{audienceLabel}</dt><dd>{displayNumber(apiProfile?.followerCount)}</dd></div>
                    <div><dt>누적 구매 전환</dt><dd>{displayCount(settlementSummary?.cumulativePurchaseConversionCount)}</dd></div>
                    <div><dt>이번달 구매 전환</dt><dd>{displayCount(settlementSummary?.currentMonthPurchaseConversionCount)}</dd></div>
                    <div><dt>누적 지급 수수료</dt><dd>{displayWon(settlementSummary?.cumulativePaidCommission)}</dd></div>
                    <div>
                      <dt>다음달 지급 예정 수수료</dt>
                      <dd>
                        {displayWon(settlementSummary?.nextMonthScheduledCommission)}
                        {settlementSummary?.nextPaymentSettlementStatus
                          ? ` (${settlementStatusLabel(settlementSummary.nextPaymentSettlementStatus)})`
                          : ""}
                      </dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div><dt>{audienceLabel}</dt><dd>{displayNumber(selector.followers)}</dd></div>
                    <div><dt>등록 콘텐츠</dt><dd>{displayCount(selector.contentCount)}</dd></div>
                    <div><dt>구매 전환</dt><dd>{displayCount(selector.conversions)}</dd></div>
                    <div><dt>누적 정산</dt><dd>{formatWon(fixtureDetail.totalSettlement)}</dd></div>
                  </>
                )}
              </dl>
            </div>
          </section>

          <section aria-labelledby="selector-contents-title" className="fuma-content-section fuma-selector-detail-section">
            <header className="fuma-content-section__header">
              <h3 id="selector-contents-title">업로드 콘텐츠</h3>
              <span>최근 {fixtureDetail.contents.length}건</span>
            </header>
            <div className="fuma-selector-content-list">
              {fixtureDetail.contents.map((content) => (
                <article key={content.id}>
                  <div className="fuma-selector-content-list__media">
                    <img alt="" src={content.thumbnailUrl} />
                    <span>{content.format}</span>
                  </div>
                  <div className="fuma-selector-content-list__body">
                    <div className="fuma-selector-content-list__meta">
                      <time>{content.publishedAt}</time>
                      <StatusPill tone={content.status === "승인" ? "approved" : "pending"}>
                        {content.status}
                      </StatusPill>
                    </div>
                    <h4>{content.title}</h4>
                    <p>{content.campaign}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="fuma-selector-detail-columns">
            <section aria-labelledby="selector-cohort-history-title" className="fuma-content-section fuma-selector-detail-section">
              <header className="fuma-content-section__header">
                <h3 id="selector-cohort-history-title">이전 기수 활동 내역</h3>
                <span>{fixtureDetail.cohortHistory.length}개 기수</span>
              </header>
              <div className="fuma-selector-cohort-history">
                {fixtureDetail.cohortHistory.length > 0 ? fixtureDetail.cohortHistory.map((activity) => (
                  <article key={activity.cohort}>
                    <div>
                      <strong>{activity.cohort}</strong>
                      <StatusPill tone="neutral">{activity.result}</StatusPill>
                    </div>
                    <p>{activity.period}</p>
                    <dl>
                      <div>
                        <dt>참여 캠페인</dt>
                        <dd>{activity.campaignCount}건</dd>
                      </div>
                      <div>
                        <dt>등록 콘텐츠</dt>
                        <dd>{activity.contentCount}건</dd>
                      </div>
                    </dl>
                  </article>
                )) : (
                  <p className="fuma-selector-detail-empty">이전 기수 활동 내역이 없습니다.</p>
                )}
              </div>
            </section>

            <section aria-labelledby="selector-settlement-history-title" className="fuma-content-section fuma-selector-detail-section">
              <header className="fuma-content-section__header">
                <h3 id="selector-settlement-history-title">정산 내역</h3>
                <span>총 {settlementCount.toLocaleString("ko-KR")}건</span>
              </header>
              <div
                aria-label="셀렉터스 정산 내역"
                className="fuma-wide-table fuma-settlement-table"
                role="region"
              >
                <DenseTable
                  columns={SETTLEMENT_COLUMNS}
                  emptyMessage={settlementEmptyMessage}
                  rowKey={(settlement) => settlement.id}
                  rows={settlementRows}
                />
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="fuma-detail-panel__content">
          <section className="fuma-empty-state" aria-label="셀렉터스 없음">
            <h2>대상을 찾을 수 없습니다</h2>
            <p>요청한 셀렉터스 정보를 확인할 수 없습니다.</p>
          </section>
        </div>
      )}
    </SidePanel>
  );
}
