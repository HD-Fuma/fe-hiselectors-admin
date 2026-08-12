import { PlatformIcon } from "../../../components/social/PlatformIcon";
import { SidePanel } from "../../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../../components/ui/StatusPill";
import { formatNumber, formatWon } from "../../../lib/formatters";
import { SettlementTable, type SettlementTableRow } from "../../settlement";
import { getSelectorDetailData } from "../model/detailData";
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

export function SelectorDetailPanel({
  onClose,
  selector,
}: {
  onClose: () => void;
  selector?: SelectorFixture;
}) {
  const detail = selector ? getSelectorDetailData(selector) : null;
  const primarySns = detail?.snsLinks[0] ?? null;
  const audienceLabel = selector?.sns === "YouTube" ? "구독자" : "팔로워";
  const settlementRows: SettlementTableRow[] = selector && detail
    ? detail.settlements.map((settlement) => ({
      attributionMonth: settlement.month,
      expectedAmount: settlement.amount,
      id: settlement.id,
      paymentStatus: settlement.status,
      selectorId: selector.id,
      selectorName: selector.name,
    }))
    : [];

  return (
    <SidePanel onClose={onClose} title="셀렉터스 상세">
      {selector && detail ? (
        <div className="fuma-detail-panel__content fuma-selector-detail-panel">
          <section
            aria-label="셀렉터스 프로필"
            className="fuma-creator-detail-hero fuma-selector-detail-hero fuma-unified-detail-hero"
          >
            <div className="fuma-creator-detail-hero__portrait">
              <img alt={`${selector.name} 프로필`} src={detail.profileImageUrl} />
              {primarySns ? (
                <span className="fuma-creator-detail-hero__platform">
                  <PlatformIcon platform={primarySns.platform as "Instagram" | "YouTube"} />
                </span>
              ) : null}
            </div>
            <div className="fuma-creator-detail-hero__content">
              <div className="fuma-creator-detail-hero__identity">
                <div className="fuma-creator-detail-hero__title-row">
                  <h2>{selector.name}</h2>
                  <StatusPill tone={selectorStatusTone(selector.status)}>{selector.status}</StatusPill>
                </div>
                {primarySns ? (
                  <a className="fuma-creator-detail-hero__channel" href={primarySns.url} rel="noreferrer" target="_blank">
                    <PlatformIcon decorative platform={primarySns.platform as "Instagram" | "YouTube"} />
                    <span>{primarySns.handle}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
                <div aria-label="셀렉터스 정보" className="fuma-creator-detail-hero__categories">
                  <strong>{selector.category ?? "셀렉터스"}</strong>
                  <span aria-hidden="true">/</span>
                  <span>{selector.id} · {selector.selectorCode} · {selector.shopNickname}</span>
                </div>
              </div>
              <p className="fuma-unified-detail-hero__summary">
                {selector.cohort} · {selector.status} · 최근 활동 {selector.recentActivity}
              </p>
              <dl className="fuma-creator-detail-hero__metrics">
                <div><dt>{audienceLabel}</dt><dd>{selector.followers ? formatNumber(selector.followers) : "-"}</dd></div>
                <div><dt>등록 콘텐츠</dt><dd>{formatNumber(selector.contentCount)}건</dd></div>
                <div><dt>구매 전환</dt><dd>{formatNumber(selector.conversions)}건</dd></div>
                <div><dt>누적 정산</dt><dd>{formatWon(detail.totalSettlement)}</dd></div>
              </dl>
            </div>
          </section>

          <section aria-labelledby="selector-contents-title" className="fuma-content-section fuma-selector-detail-section">
            <header className="fuma-content-section__header">
              <h3 id="selector-contents-title">업로드 콘텐츠</h3>
              <span>최근 {detail.contents.length}건</span>
            </header>
            <div className="fuma-selector-content-list">
              {detail.contents.map((content) => (
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
                <span>{detail.cohortHistory.length}개 기수</span>
              </header>
              <div className="fuma-selector-cohort-history">
                {detail.cohortHistory.length > 0 ? detail.cohortHistory.map((activity) => (
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
                <span>총 {detail.settlements.length}건</span>
              </header>
              <SettlementTable ariaLabel="셀렉터스 정산 내역" rows={settlementRows} />
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
