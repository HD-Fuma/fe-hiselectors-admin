import { PlatformIcon } from "../../../components/social/PlatformIcon";
import { CreatorProfilePhoto } from "../../../components/ui/CreatorProfilePhoto";
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
import type {
  SelectorContent,
  SelectorDetail,
  SelectorGeneration,
  SelectorPerformance,
  SelectorSnsAccount,
  SelectorSnsCode,
} from "../api";

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
  activityMonth: string | null | undefined;
  confirmedPurchaseCount: number | null | undefined;
  confirmedSalesAmount: number | null | undefined;
  id: string;
  ordinal: number;
  settlementAmount: number | null | undefined;
  settlementRate: number | null | undefined;
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
    key: "activityMonth",
    header: "활동월",
    width: 85,
    align: "center",
    render: (settlement) => displayText(settlement.activityMonth),
  },
  {
    key: "confirmedPurchaseCount",
    header: "정산 건수",
    width: 105,
    align: "center",
    render: (settlement) => displayNumber(settlement.confirmedPurchaseCount),
  },
  {
    key: "confirmedSalesAmount",
    header: "매출 실적",
    width: 125,
    align: "center",
    render: (settlement) => displayWon(settlement.confirmedSalesAmount),
  },
  {
    key: "settlementRate",
    header: "수수료율",
    width: 75,
    align: "center",
    render: (settlement) => displayRate(settlement.settlementRate),
  },
  {
    key: "settlementAmount",
    header: "정산 수수료",
    width: 115,
    align: "center",
    render: (settlement) => displayWon(settlement.settlementAmount),
  },
  {
    key: "status",
    header: "지급 상태",
    width: 90,
    align: "center",
    render: (settlement) => (
      <StatusPill tone={settlementStatusTone(settlement.status)}>
        {settlement.status}
      </StatusPill>
    ),
  },
];

function apiSelectorStatusTone(roleId: string): NonNullable<StatusPillProps["tone"]> {
  if (roleId === "ACTIVE") return "approved";
  if (roleId === "BLACKLIST") return "rejected";
  return "neutral";
}

function apiPlatform(snsCode: SelectorSnsCode | null) {
  if (snsCode === "INSTAGRAM") return "Instagram";
  if (snsCode === "YOUTUBE") return "YouTube";
  return null;
}

const SNS_ACCOUNT_COLUMNS: DenseTableColumn<SelectorSnsAccount>[] = [
  {
    key: "snsCode",
    header: "플랫폼",
    width: 110,
    align: "center",
    render: (account) => {
      const platform = apiPlatform(account.snsCode);
      return platform ? (
        <span className="fuma-platform-label">
          <PlatformIcon platform={platform} />
          <span aria-hidden="true">{platform}</span>
        </span>
      ) : "-";
    },
  },
  { key: "accountId", header: "계정 ID", render: (account) => displayText(account.accountId) },
  { key: "followerCount", header: "팔로워", width: 100, align: "right", render: (account) => displayNumber(account.followerCount) },
  { key: "lastCollectedAt", header: "마지막 수집", width: 145, align: "center", render: (account) => displayDateTime(account.lastCollectedAt) },
];

const GENERATION_COLUMNS: DenseTableColumn<SelectorGeneration>[] = [
  { key: "generationName", header: "기수", width: 90, align: "center" },
  { id: "period", header: "모집 기간", render: (generation) => `${generation.startDate.slice(0, 10)} ~ ${generation.endDate.slice(0, 10)}` },
  {
    key: "status",
    header: "상태",
    width: 90,
    align: "center",
    render: (generation) => (
      <StatusPill tone={generation.status === "ACTIVE" ? "approved" : "neutral"}>
        {generation.status === "ACTIVE" ? "활성" : "비활성"}
      </StatusPill>
    ),
  },
  { key: "joinedAt", header: "참여 등록일", width: 145, align: "center", render: (generation) => displayDateTime(generation.joinedAt) },
];

const PERFORMANCE_COLUMNS: DenseTableColumn<SelectorPerformance>[] = [
  { key: "contentCount", header: "콘텐츠", align: "right", render: (performance) => displayCount(performance.contentCount) },
  { key: "totalViewCount", header: "누적 조회", align: "right", render: (performance) => displayNumber(performance.totalViewCount) },
  { key: "totalLikeCount", header: "누적 좋아요", align: "right", render: (performance) => displayNumber(performance.totalLikeCount) },
  { key: "totalCommentCount", header: "누적 댓글", align: "right", render: (performance) => displayNumber(performance.totalCommentCount) },
];

const CONTENT_COLUMNS: DenseTableColumn<SelectorContent>[] = [
  {
    key: "snsCode",
    header: "플랫폼",
    width: 105,
    align: "center",
    render: (content) => {
      const platform = apiPlatform(content.snsCode);
      return platform ? (
        <span className="fuma-platform-label">
          <PlatformIcon platform={platform} />
          <span aria-hidden="true">{platform}</span>
        </span>
      ) : "-";
    },
  },
  { key: "contentType", header: "유형", width: 90, align: "center", render: (content) => displayText(content.contentType) },
  {
    key: "contentUrl",
    header: "콘텐츠",
    render: (content) => content.contentUrl
      ? <a href={content.contentUrl} rel="noreferrer" target="_blank">보기 ↗</a>
      : "-",
  },
  { key: "createdAt", header: "등록일", width: 135, align: "center", render: (content) => displayDateTime(content.createdAt) },
  { key: "viewCount", header: "조회", width: 78, align: "right", render: (content) => displayNumber(content.viewCount) },
  { key: "likeCount", header: "좋아요", width: 78, align: "right", render: (content) => displayNumber(content.likeCount) },
  { key: "commentCount", header: "댓글", width: 78, align: "right", render: (content) => displayNumber(content.commentCount) },
];

function SelectorApiDetailContent({ detail }: { detail: SelectorDetail }) {
  const primaryAccount = detail.snsAccount;
  const platform = apiPlatform(primaryAccount?.snsCode ?? null);
  const latestGeneration = detail.generations[0];

  return (
    <div className="fuma-detail-panel__content fuma-selector-detail-panel">
      <section
        aria-label="셀렉터스 프로필"
        className="fuma-creator-detail-hero fuma-selector-detail-hero fuma-unified-detail-hero"
      >
        <div className="fuma-creator-detail-hero__portrait">
          <CreatorProfilePhoto creatorName={detail.nickname} src={primaryAccount?.profileImageUrl ?? ""} />
          {platform ? (
            <span className="fuma-creator-detail-hero__platform">
              <PlatformIcon platform={platform} />
            </span>
          ) : null}
        </div>
        <div className="fuma-creator-detail-hero__content">
          <div className="fuma-creator-detail-hero__identity">
            <div className="fuma-creator-detail-hero__title-row">
              <h2>{detail.nickname}</h2>
              <StatusPill tone={apiSelectorStatusTone(detail.roleId)}>
                {detail.roleName || detail.roleId}
              </StatusPill>
            </div>
            {platform && primaryAccount ? (
              <div className="fuma-creator-detail-hero__channel">
                <PlatformIcon decorative platform={platform} />
                <span>{platform}</span>
                <span>{displayText(primaryAccount.accountId)}</span>
              </div>
            ) : null}
            <div aria-label="셀렉터스 정보" className="fuma-creator-detail-hero__categories">
              <strong>셀렉터스</strong>
              <span aria-hidden="true">/</span>
              <span>{detail.id} · {detail.selectorsCode} · {detail.nickname}</span>
            </div>
          </div>
          <p className="fuma-unified-detail-hero__summary">
            {latestGeneration?.generationName ?? "참여 기수 없음"} · {detail.roleName || detail.roleId} · 등록 {displayDateTime(detail.createdAt)}
          </p>
          <dl className="fuma-creator-detail-hero__metrics">
            <div><dt>대표 SNS 팔로워</dt><dd>{displayNumber(primaryAccount?.followerCount)}</dd></div>
            <div><dt>누적 패널티</dt><dd>{displayCount(detail.totalPenaltyCount)}</dd></div>
            <div><dt>활성 패널티</dt><dd>{displayCount(detail.activePenaltyCount)}</dd></div>
            <div>
              <dt>블랙리스트</dt>
              <dd>
                <StatusPill tone={detail.blacklistTarget ? "rejected" : "neutral"}>
                  {detail.blacklistTarget ? "대상" : "비대상"}
                </StatusPill>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="fuma-selector-detail-columns">
        <section aria-labelledby="selector-performance-title" className="fuma-content-section fuma-selector-detail-section">
          <header className="fuma-content-section__header">
            <h3 id="selector-performance-title">간략 성과</h3>
            <span>누적 기준</span>
          </header>
          <div aria-label="셀렉터스 성과" className="fuma-wide-table fuma-settlement-table" role="region">
            <DenseTable
              columns={PERFORMANCE_COLUMNS}
              rowKey={() => detail.id}
              rows={[detail.performance]}
            />
          </div>
        </section>

        <section aria-labelledby="selector-api-contents-title" className="fuma-content-section fuma-selector-detail-section">
          <header className="fuma-content-section__header">
            <h3 id="selector-api-contents-title">등록 콘텐츠</h3>
            <span>총 {displayCount(detail.performance.contentCount)}</span>
          </header>
          <div aria-label="셀렉터스 콘텐츠" className="fuma-wide-table fuma-settlement-table" role="region">
            <DenseTable
              columns={CONTENT_COLUMNS}
              emptyMessage={detail.performance.contentCount == null
                ? "콘텐츠 수집 전입니다."
                : "등록된 콘텐츠가 없습니다."}
              rowKey={(content) => content.id}
              rows={detail.contents}
            />
          </div>
        </section>

        <section aria-labelledby="selector-sns-accounts-title" className="fuma-content-section fuma-selector-detail-section">
          <header className="fuma-content-section__header">
            <h3 id="selector-sns-accounts-title">SNS 계정</h3>
            <span>총 {primaryAccount ? 1 : 0}건</span>
          </header>
          <div aria-label="셀렉터스 SNS 계정" className="fuma-wide-table fuma-settlement-table" role="region">
            <DenseTable
              columns={SNS_ACCOUNT_COLUMNS}
              emptyMessage="연결된 SNS 계정이 없습니다."
              rowKey={(account) => account.id}
              rows={primaryAccount ? [primaryAccount] : []}
            />
          </div>
        </section>

        <section aria-labelledby="selector-generation-history-title" className="fuma-content-section fuma-selector-detail-section">
          <header className="fuma-content-section__header">
            <h3 id="selector-generation-history-title">참여 기수 이력</h3>
            <span>총 {detail.generations.length}건</span>
          </header>
          <div aria-label="셀렉터스 참여 기수 이력" className="fuma-wide-table fuma-settlement-table" role="region">
            <DenseTable
              columns={GENERATION_COLUMNS}
              emptyMessage="참여 기수 이력이 없습니다."
              rowKey={(generation) => generation.generationId}
              rows={detail.generations}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export function SelectorDetailPanel({
  onClose,
  selector,
  selectorDetail,
  selectorDetailError = "",
  selectorDetailLoading = false,
  settlementDetail,
  settlementDetailError = false,
  settlementDetailLoading = false,
}: {
  onClose: () => void;
  selector?: SelectorFixture;
  selectorDetail?: SelectorDetail | null;
  selectorDetailError?: string;
  selectorDetailLoading?: boolean;
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
      activityMonth: settlement.activityMonth,
      confirmedPurchaseCount: settlement.confirmedPurchaseCount,
      confirmedSalesAmount: settlement.confirmedSalesAmount,
      settlementAmount: settlement.settlementAmount,
      settlementRate: settlement.settlementRate,
      status: settlementStatusLabel(settlement.status),
    }))
    : selector && fixtureDetail
    ? fixtureDetail.settlements.map((settlement, index) => ({
      id: settlement.id,
      ordinal: index + 1,
      activityMonth: settlement.month,
      confirmedPurchaseCount: undefined,
      confirmedSalesAmount: undefined,
      settlementAmount: settlement.amount,
      settlementRate: undefined,
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
      {selectorDetailLoading ? (
        <div className="fuma-detail-panel__content">
          <section aria-live="polite" className="fuma-empty-state" role="status">
            <h2>셀렉터스 정보를 불러오는 중입니다</h2>
          </section>
        </div>
      ) : selectorDetailError ? (
        <div className="fuma-detail-panel__content">
          <section className="fuma-empty-state" role="alert">
            <h2>상세 정보를 불러오지 못했습니다</h2>
            <p>{selectorDetailError}</p>
          </section>
        </div>
      ) : selectorDetail ? (
        <SelectorApiDetailContent detail={selectorDetail} />
      ) : selector && fixtureDetail ? (
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
                {settlementDetail ? ` · 활동월 ${displayText(settlementSummary?.currentMonth)} · 지급월 ${displayText(settlementSummary?.nextPaymentMonth)}` : null}
              </p>
              <dl className="fuma-creator-detail-hero__metrics">
                {settlementDetail ? (
                  <>
                    <div><dt>{audienceLabel}</dt><dd>{displayNumber(apiProfile?.followerCount)}</dd></div>
                    <div><dt>누적 구매 전환</dt><dd>{displayCount(settlementSummary?.cumulativePurchaseConversionCount)}</dd></div>
                    <div><dt>이번달 구매 전환</dt><dd>{displayCount(settlementSummary?.currentMonthPurchaseConversionCount)}</dd></div>
                    <div><dt>누적 지급 수수료</dt><dd>{displayWon(settlementSummary?.cumulativePaidCommission)}</dd></div>
                    <div><dt>이번달 지급 예정 수수료</dt><dd>{displayWon(settlementSummary?.nextMonthScheduledCommission)}</dd>
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
