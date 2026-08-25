import { useEffect, useRef, useState, type ReactNode } from "react";
import { PlatformIcon } from "../../../components/social/PlatformIcon";
import { CreatorProfilePhoto } from "../../../components/ui/CreatorProfilePhoto";
import { DenseTable, type DenseTableColumn } from "../../../components/ui/DenseTable";
import { Modal } from "../../../components/ui/Modal";
import { ResultToolbar } from "../../../components/ui/ResultToolbar";
import { SidePanel } from "../../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../../components/ui/StatusPill";
import { formatCompactCount, formatNumber, formatWon } from "../../../lib/formatters";
import {
  settlementStatusLabel,
  type SettlementSelectorDetail,
  type SettlementStatus,
} from "../../settlement";
import { getSelectorDetailData, type SelectorSocialLink } from "../model/detailData";
import type { SelectorFixture } from "../model/fixtures";
import type {
  SelectorContent,
  SelectorDetail,
  SelectorGeneration,
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
  status: string;
  statusCode?: SettlementStatus | null;
  updatedAt?: string | null;
}

function settlementStatusTone(
  status: string,
): NonNullable<StatusPillProps["tone"]> {
  if (status === "지급 완료" || status === "SETTLED") return "approved";
  if (status === "확정" || status === "지급 대기" || status === "PAYMENT_PENDING" || status === "CALCULATING") {
    return "pending";
  }
  if (
    status === "정산 보류"
    || status === "지급 보류"
    || status === "PAYMENT_HOLD_INFO"
    || status === "PAYMENT_HOLD_BLACK"
  ) return "danger";
  if (status === "지급 만료" || status === "EXPIRED") return "rejected";
  return "neutral";
}

function accountHandle(accountId: string) {
  const trimmed = accountId.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function snsAccountHref(
  platform: "Instagram" | "YouTube" | null,
  accountId: string | null | undefined,
) {
  if (!platform || !accountId) return null;
  if (accountId.startsWith("http")) return accountId;
  const normalizedAccountId = accountId.replace(/^@/, "").trim();
  if (!normalizedAccountId) return null;
  return platform === "YouTube"
    ? `https://www.youtube.com/channel/${normalizedAccountId}`
    : `https://www.instagram.com/${normalizedAccountId}`;
}

function audienceCountLabel(
  platform: "Instagram" | "YouTube" | null,
  followerCount: number | null | undefined,
) {
  if (followerCount == null) return null;
  const unit = platform === "YouTube" ? "구독자" : "팔로워";
  return `${unit} ${formatCompactCount(followerCount)}명`;
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

  const href = snsAccountHref(platform, profile.accountId);
  if (!href) return null;

  return {
    handle: displayText(profile.accountId),
    platform,
    url: href,
  };
}

function displayDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

function displayDateRange(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return "-";
  return `${start.slice(0, 10)} ~ ${end.slice(0, 10)}`;
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

function latestTimestamp(values: Array<string | null | undefined>) {
  return values.reduce<string | null>((latest, value) => {
    if (!value) return latest;
    return latest == null || value > latest ? value : latest;
  }, null);
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
    width: 130,
    align: "center",
    render: (settlement) => (
      <StatusPill tone={settlementStatusTone(settlement.status)}>
        {settlement.status}
      </StatusPill>
    ),
  },
];

/** 유튜브 주소에서 영상 ID를 뽑아 썸네일 주소를 만든다. 인스타는 공개 썸네일이 없다. */
function contentThumbnail(content: SelectorContent) {
  const url = content.contentUrl ?? "";
  const match = /(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([\w-]{11})/.exec(url);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function SelectorContentGallery({ contents }: { contents: SelectorContent[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  // 카드가 넘칠 때만 좌우 버튼을 보여준다.
  const [overflowing, setOverflowing] = useState(false);
  const newestFirst = [...contents].sort((left, right) => (
    (right.createdAt ?? "").localeCompare(left.createdAt ?? "")
  ));

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setOverflowing(track.scrollWidth - track.clientWidth > 4);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [contents]);

  if (!newestFirst.length) return null;

  const slide = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const step = track.firstElementChild instanceof HTMLElement
      ? track.firstElementChild.offsetWidth + 12
      : track.clientWidth;
    track.scrollBy({ behavior: "smooth", left: step * direction });
  };

  return (
    <div className="fuma-selector-content-carousel">
      {overflowing ? (
        <button aria-label="이전 콘텐츠" onClick={() => slide(-1)} type="button">‹</button>
      ) : null}
      <ul className="fuma-selector-content-gallery" ref={trackRef}>
      {newestFirst.map((content) => {
        const thumbnail = contentThumbnail(content);
        const platform = apiPlatform(content.snsCode);
        return (
          <li key={content.id}>
            <a href={content.contentUrl} rel="noreferrer" target="_blank">
              <span className="fuma-selector-content-gallery__thumb">
                {thumbnail ? (
                  <img alt="" loading="lazy" src={thumbnail} />
                ) : (
                  <span className="fuma-selector-content-gallery__fallback">
                    {platform ? <PlatformIcon decorative platform={platform} /> : null}
                  </span>
                )}
              </span>
              <strong>{content.title || content.contentType || "콘텐츠"}</strong>
              <span className="fuma-selector-content-gallery__meta">
                <span>{displayDateTime(content.createdAt).slice(0, 10)}</span>
                <span>조회 {displayNumber(content.viewCount)}</span>
                <span>좋아요 {displayNumber(content.likeCount)}</span>
              </span>
            </a>
          </li>
        );
      })}
      </ul>
      {overflowing ? (
        <button aria-label="다음 콘텐츠" onClick={() => slide(1)} type="button">›</button>
      ) : null}
    </div>
  );
}

/**
 * 성과 패널: 핵심 지표 3개(도달·반응·구매) + 조회수 추이 + 반응 구성.
 * 조회수와 반응수는 자릿수가 달라 한 축에 겹치지 않고 역할을 나눠 배치한다.
 */
const PERFORMANCE_BAR_LIMIT = 12;

function SelectorPerformancePanel({ detail }: { detail: SelectorDetail }) {
  const recent = [...detail.contents]
    .filter((content) => content.createdAt)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-PERFORMANCE_BAR_LIMIT);

  const views = detail.performance.totalViewCount ?? 0;
  const likes = detail.performance.totalLikeCount ?? 0;
  const comments = detail.performance.totalCommentCount ?? 0;
  const reactions = likes + comments;
  const contentCount = detail.performance.contentCount ?? detail.contents.length;
  const purchaseCount = detail.generations.reduce(
    (sum, generation) => sum + (generation.confirmedPurchaseCount ?? 0),
    0,
  );
  const totalSales = detail.generations.reduce(
    (sum, generation) => sum + (generation.totalSales ?? 0),
    0,
  );
  const perContent = contentCount ? Math.round(views / contentCount) : null;
  const reactionRate = views ? (reactions / views) * 100 : null;

  const stats = [
    {
      hint: contentCount ? `콘텐츠당 ${displayNumber(perContent)}회` : "콘텐츠 없음",
      key: "views",
      label: "도달",
      unit: "회",
      value: views,
    },
    {
      hint: reactionRate == null ? "조회 데이터 없음" : `반응률 ${reactionRate.toFixed(1)}%`,
      key: "reactions",
      label: "반응",
      unit: "개",
      value: reactions,
    },
    {
      hint: `매출 ${displayWon(totalSales)}`,
      key: "purchase",
      label: "구매확정",
      unit: "건",
      value: purchaseCount,
    },
  ];

  const width = 720;
  const height = 132;
  const padding = { bottom: 12, left: 4, right: 4, top: 12 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxView = Math.max(...recent.map((content) => content.viewCount ?? 0), 0);
  const coords = recent.map((content, index) => ({
    content,
    x: padding.left + (recent.length < 2 ? innerWidth / 2 : (index / (recent.length - 1)) * innerWidth),
    y: padding.top + innerHeight - ((content.viewCount ?? 0) / (maxView || 1)) * innerHeight,
  }));
  const line = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`)
    .join(" ");
  const area = coords.length
    ? `${line} L${coords[coords.length - 1].x.toFixed(1)} ${padding.top + innerHeight} L${coords[0].x.toFixed(1)} ${padding.top + innerHeight} Z`
    : "";
  const likeShare = reactions ? (likes / reactions) * 100 : 0;

  return (
    <section aria-label="셀렉터스 성과" className="fuma-selector-performance">
      <div className="fuma-selector-performance__stats fuma-selector-performance__stats--top">
        {stats.map((stat) => (
          <div key={stat.key}>
            <span className="fuma-selector-performance__label">{stat.label}</span>
            <strong>
              {displayNumber(stat.value)}
              <em>{stat.unit}</em>
            </strong>
            <span className="fuma-selector-performance__hint">{stat.hint}</span>
          </div>
        ))}
      </div>

      {coords.length > 1 || reactions > 0 ? (
      <div className="fuma-selector-performance__row">
      {coords.length > 1 ? (
      <div className="fuma-selector-performance__chart">
        <div className="fuma-selector-performance__chart-head">
          <strong>콘텐츠별 조회수</strong>
          <span>최근 {recent.length}건 · 최고 {displayNumber(maxView)}회</span>
        </div>
        {(
          <svg
            aria-label="콘텐츠별 조회수 추이"
            preserveAspectRatio="none"
            role="img"
            viewBox={`0 0 ${width} ${height}`}
          >
            <defs>
              <linearGradient id="selector-performance-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--hsas-teal)" stopOpacity="0.32" />
                <stop offset="100%" stopColor="var(--hsas-teal)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#selector-performance-fill)" />
            <path
              className="fuma-selector-performance__line"
              d={line}
              vectorEffect="non-scaling-stroke"
            />
            {coords.map((coord) => (
              <circle
                className="fuma-selector-performance__dot"
                cx={coord.x}
                cy={coord.y}
                key={coord.content.id}
                r="3.5"
              >
                <title>
                  {`${displayDateTime(coord.content.createdAt).slice(0, 10)} · 조회 ${displayNumber(coord.content.viewCount)}회`}
                </title>
              </circle>
            ))}
          </svg>
        )}
        <div className="fuma-selector-performance__axis">
          <span>{displayDateTime(recent[0].createdAt).slice(0, 10)}</span>
          <span>{displayDateTime(recent[recent.length - 1].createdAt).slice(0, 10)}</span>
        </div>
      </div>
      ) : null}

      {reactions > 0 ? (
      <div className="fuma-selector-performance__breakdown">
        <div className="fuma-selector-performance__chart-head">
          <strong>반응 구성</strong>
        </div>
        <div className="fuma-selector-performance__donut">
          <svg aria-label="좋아요와 댓글 비율" role="img" viewBox="0 0 120 120">
            <circle className="fuma-selector-performance__donut-track" cx="60" cy="60" r="46" />
            <circle
              className="fuma-selector-performance__donut-value"
              cx="60"
              cy="60"
              r="46"
              strokeDasharray={`${(likeShare / 100) * 289} 289`}
              transform="rotate(-90 60 60)"
            >
              <title>{`좋아요 ${displayNumber(likes)}개`}</title>
            </circle>
          </svg>
          <div className="fuma-selector-performance__donut-center">
            <strong>{displayNumber(reactions)}</strong>
            <span>총 반응</span>
          </div>
        </div>
        <div className="fuma-selector-performance__legend">
          <span className="is-like">좋아요 {displayNumber(likes)}개 · {likeShare.toFixed(0)}%</span>
          <span className="is-comment">댓글 {displayNumber(comments)}개 · {(100 - likeShare).toFixed(0)}%</span>
        </div>
      </div>
      ) : null}
      </div>
      ) : null}
    </section>
  );
}

/** 모달 전용 헤더: 프로필 | 신원 | 동의 요약 3열. 공용 히어로 CSS와 섞지 않는다. */
function SelectorModalHero({ detail }: { detail: SelectorDetail }) {
  const account = detail.snsAccount;
  const platform = apiPlatform(account?.snsCode ?? null);
  const accountId = account?.accountId?.trim() || "";
  const handle = accountId ? accountHandle(accountId) : null;
  const channelHref = snsAccountHref(platform, accountId || null);
  const audienceLabel = audienceCountLabel(platform, account?.followerCount);
  const latestGeneration = (detail.generations ?? [])[0];

  return (
    <header className="hsas-selector-hero">
      <div className="hsas-selector-hero__photo">
        <CreatorProfilePhoto creatorName={detail.nickname} src={account?.profileImageUrl ?? ""} />
        {platform ? (
          <span className="hsas-selector-hero__platform">
            <PlatformIcon platform={platform} />
          </span>
        ) : null}
      </div>
      <div className="hsas-selector-hero__identity">
        {latestGeneration ? <span className="hsas-selector-hero__badge">{latestGeneration.generationName}</span> : null}
        <h3>{detail.nickname}</h3>
        <p className="hsas-selector-hero__channel">
          {handle && channelHref ? (
            <a className="hsas-selector-hero__link" href={channelHref} rel="noreferrer" target="_blank">
              {platform ? <PlatformIcon decorative platform={platform} /> : null}
              <span>{handle}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ) : handle ? (
            <span className="hsas-selector-hero__link is-plain">
              {platform ? <PlatformIcon decorative platform={platform} /> : null}
              <span>{handle}</span>
            </span>
          ) : null}
          {audienceLabel ? <span className="hsas-selector-hero__followers">{audienceLabel}</span> : null}
        </p>
        <p className="hsas-selector-hero__code">
          셀렉터스 코드 <strong>{displayText(detail.selectorsCode)}</strong>
        </p>
      </div>
      <SelectorConsentChips detail={detail} />
    </header>
  );
}

function SelectorConsentChips({ detail }: { detail: SelectorDetail }) {
  const items = [
    { label: "SNS 인증", value: displayDateTime(detail.snsVerifiedAt).slice(0, 10) },
    { label: "개인정보 동의", value: displayDateTime(detail.privacyAgreedAt).slice(0, 10) },
    { label: "알림톡", value: detail.alimtalkAgreed ? "동의" : "미동의" },
    { label: "최근 수정", value: displayDateTime(detail.updatedAt).slice(0, 10) },
  ];

  return (
    <dl aria-label="동의 및 수신 정보" className="fuma-selector-consent-chips">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SelectorGenerationCards({ generations }: { generations: SelectorGeneration[] }) {
  // 활성 기수를 먼저, 그다음 최근 활동 순으로 보여준다.
  const ordered = [...generations].sort((left, right) => {
    if (left.status !== right.status) return left.status === "ACTIVE" ? -1 : 1;
    const leftDate = left.activityEndDate ?? left.joinedAt ?? "";
    const rightDate = right.activityEndDate ?? right.joinedAt ?? "";
    return rightDate.localeCompare(leftDate) || right.generationId - left.generationId;
  });

  if (!ordered.length) return null;

  const peakSales = Math.max(...ordered.map((generation) => generation.totalSales ?? 0), 0);

  return (
    <ol className="fuma-selector-timeline">
      {ordered.map((generation) => {
        const active = generation.status === "ACTIVE";
        const share = peakSales ? ((generation.totalSales ?? 0) / peakSales) * 100 : 0;

        return (
          <li className={active ? "is-active" : undefined} key={generation.generationId}>
            <span aria-hidden="true" className="fuma-selector-timeline__marker" />
            <div className="fuma-selector-timeline__body">
              <div className="fuma-selector-timeline__head">
                <strong>{generation.generationName}</strong>
                {active ? <StatusPill tone="approved">활동중</StatusPill> : null}
                <span>{displayDateRange(generation.joinedAt, generation.activityEndDate)}</span>
              </div>
              <div className="fuma-selector-timeline__metrics">
                <span><em>구매확정</em>{displayCount(generation.confirmedPurchaseCount)}</span>
                <span><em>매출</em>{displayWon(generation.totalSales)}</span>
                <span><em>지급 수수료</em>{displayWon(generation.paidCommissionAmount)}</span>
              </div>
              <div aria-hidden="true" className="fuma-selector-timeline__bar">
                <span style={{ width: `${share}%` }} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function apiPlatform(snsCode: SelectorSnsCode | null) {
  if (snsCode === "INSTAGRAM") return "Instagram";
  if (snsCode === "YOUTUBE") return "YouTube";
  return null;
}

const GENERATION_COLUMNS: DenseTableColumn<SelectorGeneration>[] = [
  { key: "generationName", header: "기수", align: "center" },
  {
    id: "activityPeriod",
    header: "활동 기간",
    align: "center",
    render: (generation) => displayDateRange(generation.joinedAt, generation.activityEndDate),
  },
  {
    key: "status",
    header: "상태",
    width: 80,
    align: "center",
    render: (generation) => (
      <StatusPill tone={generation.status === "ACTIVE" ? "approved" : "neutral"}>
        {generation.status === "ACTIVE" ? "활성" : "비활성"}
      </StatusPill>
    ),
  },
  {
    key: "confirmedPurchaseCount",
    header: "구매확정",
    align: "center",
    render: (generation) => displayCount(generation.confirmedPurchaseCount),
  },
  {
    key: "totalSales",
    header: "총 매출",
    align: "center",
    render: (generation) => displayWon(generation.totalSales),
  },
  {
    key: "paidCommissionAmount",
    header: "지급 수수료",
    align: "center",
    render: (generation) => displayWon(generation.paidCommissionAmount),
  },
];

const ACTIVE_GENERATION_PERFORMANCE_COLUMNS: DenseTableColumn<SelectorGeneration>[] = [
  {
    key: "confirmedPurchaseCount",
    header: "구매확정",
    align: "center",
    render: (generation) => displayCount(generation.confirmedPurchaseCount),
  },
  {
    key: "totalSales",
    header: "총 매출",
    align: "center",
    render: (generation) => displayWon(generation.totalSales),
  },
  {
    key: "paidCommissionAmount",
    header: "지급 수수료",
    align: "center",
    render: (generation) => displayWon(generation.paidCommissionAmount),
  },
  {
    id: "activityPeriod",
    header: "활동 기간",
    align: "center",
    render: (generation) => displayDateRange(generation.activityStartDate, generation.activityEndDate),
  },
];

interface SelectorConsentRow {
  alimtalkAgreed: boolean;
  privacyAgreedAt: string | null | undefined;
  snsVerifiedAt: string | null | undefined;
  updatedAt: string | null | undefined;
}

const CONSENT_COLUMNS: DenseTableColumn<SelectorConsentRow>[] = [
  {
    id: "snsVerifiedAt",
    header: "SNS 수집 동의",
    align: "center",
    render: (row) => displayDateTime(row.snsVerifiedAt),
  },
  {
    id: "privacyAgreedAt",
    header: "개인정보 활용 동의",
    align: "center",
    render: (row) => displayDateTime(row.privacyAgreedAt),
  },
  {
    id: "alimtalkAgreed",
    header: "광고성 정보 수신동의",
    align: "center",
    render: (row) => (
      <StatusPill tone={row.alimtalkAgreed ? "approved" : "neutral"}>
        {row.alimtalkAgreed ? "동의" : "미동의"}
      </StatusPill>
    ),
  },
  {
    id: "updatedAt",
    header: "최종 정보 갱신일",
    align: "center",
    render: (row) => displayDateTime(row.updatedAt),
  },
];

function contentLinkLabel(content: SelectorContent) {
  return content.title?.trim() || content.contentUrl.replace(/^https?:\/\/(?:www\.)?/, "");
}

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
  {
    key: "contentType",
    header: "유형",
    width: 90,
    align: "center",
    render: (content) => content.contentType
      ? <StatusPill tone="neutral">{content.contentType}</StatusPill>
      : "-",
  },
  {
    key: "contentUrl",
    header: "콘텐츠",
    align: "center",
    render: (content) => content.contentUrl
      ? (
        <a
          href={content.contentUrl}
          rel="noreferrer"
          target="_blank"
          title={content.title?.trim() || content.contentUrl}
        >
          {contentLinkLabel(content)} ↗
        </a>
      )
      : "-",
  },
  { key: "createdAt", header: "등록일", width: 135, align: "center", render: (content) => displayDateTime(content.createdAt) },
  { key: "viewCount", header: "조회", width: 78, align: "center", render: (content) => displayNumber(content.viewCount) },
  { key: "likeCount", header: "좋아요", width: 78, align: "center", render: (content) => displayNumber(content.likeCount) },
  { key: "commentCount", header: "댓글", width: 78, align: "center", render: (content) => displayNumber(content.commentCount) },
];

function SelectorDetailListSection({
  children,
  meta,
  title,
  titleId,
}: {
  children: ReactNode;
  meta?: ReactNode;
  title: string;
  titleId: string;
}) {
  return (
    <section aria-labelledby={titleId} className="fuma-campaign-detail-list-section">
      <ResultToolbar
        className="fuma-simple-result-toolbar fuma-campaign-detail-list-toolbar"
        meta={meta}
        title={title}
        titleId={titleId}
      />
      {children}
    </section>
  );
}

function SelectorApiDetailContent({
  contentView = "table",
  detail,
  hideSettlement = false,
  settlementEmptyMessage,
  settlementRows,
  settlementSummary,
}: {
  contentView?: "table" | "gallery";
  detail: SelectorDetail;
  hideSettlement?: boolean;
  settlementEmptyMessage: ReactNode;
  settlementRows: SelectorSettlementTableRow[];
  settlementSummary: SettlementSelectorDetail["settlementSummary"] | undefined;
}) {
  const primaryAccount = detail.snsAccount;
  const platform = apiPlatform(primaryAccount?.snsCode ?? null);
  const generations = detail.generations ?? [];
  const latestGeneration = generations[0];
  const activeGeneration = generations.find((generation) => generation.status === "ACTIVE");
  const accountId = primaryAccount?.accountId?.trim() || "";
  const handle = accountId ? accountHandle(accountId) : null;
  const channelHref = snsAccountHref(platform, accountId || null);
  const audienceLabel = audienceCountLabel(platform, primaryAccount?.followerCount);

  return (
    <div className="fuma-detail-panel__content fuma-selector-detail-panel">
      {contentView === "gallery" ? <SelectorModalHero detail={detail} /> : (
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
            <div aria-label="셀렉터스 기수" className="fuma-creator-detail-hero__generation">
              {latestGeneration?.generationName ?? "기수 없음"}
            </div>
            <div className="fuma-creator-detail-hero__title-row">
              <h2>{detail.nickname}</h2>
            </div>
            {handle || audienceLabel ? (
              <div className="fuma-creator-detail-hero__channel">
                {handle && channelHref ? (
                  <a href={channelHref} rel="noreferrer" target="_blank">
                    <strong>{handle}</strong>
                  </a>
                ) : handle ? (
                  <strong>{handle}</strong>
                ) : null}
                {handle && audienceLabel ? <span aria-hidden="true">·</span> : null}
                {audienceLabel ? <span>{audienceLabel}</span> : null}
              </div>
            ) : null}
          </div>
          <dl className="fuma-creator-detail-hero__metrics">
            <div><dt>셀렉터스 코드</dt><dd>{displayText(detail.selectorsCode)}</dd></div>
            <div>
              <dt>셀렉터스명</dt>
              <dd title={detail.nickname || undefined}>{displayText(detail.nickname)}</dd>
            </div>
            {hideSettlement ? null : (
              <>
                <div><dt>누적 구매수</dt><dd>{displayCount(settlementSummary?.cumulativePurchaseConversionCount)}</dd></div>
                <div><dt>누적 매출</dt><dd>{displayWon(settlementSummary?.cumulativeSalesAmount)}</dd></div>
              </>
            )}
          </dl>
        </div>
      </section>
      )}

      {contentView === "gallery" ? null : (
      <SelectorDetailListSection title="동의 및 수신 정보" titleId="selector-consent-title">
        <div aria-label="셀렉터스 동의 및 수신 정보" className="fuma-wide-table fuma-settlement-table" role="region">
          <DenseTable
            align="center"
            columns={CONSENT_COLUMNS}
            rowKey={() => "consent"}
            rows={[{
              alimtalkAgreed: detail.alimtalkAgreed,
              privacyAgreedAt: detail.privacyAgreedAt,
              snsVerifiedAt: detail.snsVerifiedAt,
              updatedAt: detail.updatedAt,
            }]}
          />
        </div>
      </SelectorDetailListSection>
      )}

      {contentView === "gallery" ? null : (
      <SelectorDetailListSection
        meta={<span>{activeGeneration ? `${activeGeneration.generationName} 기준` : "활성 기수 없음"}</span>}
        title="간략 성과"
        titleId="selector-performance-title"
      >
        <div aria-label="셀렉터스 성과" className="fuma-wide-table fuma-settlement-table" role="region">
          <DenseTable
            align="center"
            columns={ACTIVE_GENERATION_PERFORMANCE_COLUMNS}
            emptyMessage="활성 기수 성과가 없습니다."
            rowKey={(generation) => generation.generationId}
            rows={activeGeneration ? [activeGeneration] : []}
          />
        </div>
      </SelectorDetailListSection>
      )}

      {contentView === "gallery" ? (
        <SelectorDetailListSection title="콘텐츠 성과" titleId="selector-trend-title">
          <SelectorPerformancePanel detail={detail} />
        </SelectorDetailListSection>
      ) : null}

      {contentView === "gallery" && !detail.contents.length ? null : (
      <SelectorDetailListSection
        meta={<span>최근 {detail.contents.length}건 · 전체 {displayCount(detail.performance.contentCount)}</span>}
        title="등록 콘텐츠"
        titleId="selector-api-contents-title"
      >
        {contentView === "gallery" ? (
          <SelectorContentGallery contents={detail.contents} />
        ) : (
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
        )}
      </SelectorDetailListSection>
      )}

      {contentView === "gallery" && !generations.length ? null : (
      <SelectorDetailListSection
        meta={<span>총 {generations.length}건</span>}
        title="참여 기수 이력"
        titleId="selector-generation-history-title"
      >
        {contentView === "gallery" ? (
          <SelectorGenerationCards generations={generations} />
        ) : (
          <div aria-label="셀렉터스 참여 기수 이력" className="fuma-wide-table fuma-settlement-table" role="region">
            <DenseTable
              align="center"
              columns={GENERATION_COLUMNS}
              emptyMessage="참여 기수 이력이 없습니다."
              rowKey={(generation) => generation.generationId}
              rows={generations}
            />
          </div>
        )}
      </SelectorDetailListSection>
      )}

      {hideSettlement ? null : (
      <SelectorDetailListSection
        meta={<span>마지막 갱신 {displayDateTime(latestTimestamp(settlementRows.map((row) => row.updatedAt)))}</span>}
        title="정산 정보"
        titleId="selector-api-settlement-title"
      >
        {settlementSummary ? (
          <dl className="fuma-key-value-grid">
            <div className="fuma-key-value-grid__item">
              <dt>누적 구매 전환</dt>
              <dd>{displayCount(settlementSummary.cumulativePurchaseConversionCount)}</dd>
            </div>
            <div className="fuma-key-value-grid__item">
              <dt>이번달 구매 전환</dt>
              <dd>{displayCount(settlementSummary.currentMonthPurchaseConversionCount)}</dd>
            </div>
            <div className="fuma-key-value-grid__item">
              <dt>누적 지급 수수료</dt>
              <dd>{displayWon(settlementSummary.cumulativePaidCommission)}</dd>
            </div>
            <div className="fuma-key-value-grid__item">
              <dt>이번달 지급 예정</dt>
              <dd>{displayWon(settlementSummary.nextMonthScheduledCommission)}</dd>
            </div>
          </dl>
        ) : null}
        <div aria-label="셀렉터스 정산 내역" className="fuma-wide-table fuma-settlement-table" role="region">
          <DenseTable
            columns={SETTLEMENT_COLUMNS}
            emptyMessage={settlementEmptyMessage}
            rowKey={(settlement) => settlement.id}
            rows={settlementRows}
          />
        </div>
      </SelectorDetailListSection>
      )}
    </div>
  );
}

export function SelectorDetailPanel({
  hideSettlement = false,
  onClose,
  presentation = "side",
  selector,
  selectorDetail,
  selectorDetailError = "",
  selectorDetailLoading = false,
  settlementDetail,
  settlementDetailError = false,
  settlementDetailLoading = false,
}: {
  /** 정산 정보를 숨긴다(버블 뷰 모달처럼 정산이 필요 없는 곳). */
  hideSettlement?: boolean;
  onClose: () => void;
  /** 사이드 패널 대신 가운데 모달로 띄운다. */
  presentation?: "side" | "modal";
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
      statusCode: settlement.status,
      updatedAt: settlement.updatedAt,
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

  const body = (
    <>
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
        <SelectorApiDetailContent
          contentView={presentation === "modal" ? "gallery" : "table"}
          detail={selectorDetail}
          hideSettlement={hideSettlement}
          settlementEmptyMessage={settlementEmptyMessage}
          settlementRows={settlementRows}
          settlementSummary={settlementSummary}
        />
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
                    <div><dt>이번달 지급 예정</dt><dd>{displayWon(settlementSummary?.nextMonthScheduledCommission)}</dd>
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

          <SelectorDetailListSection
            meta={<span>최근 {fixtureDetail.contents.length}건</span>}
            title="업로드 콘텐츠"
            titleId="selector-contents-title"
          >
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
          </SelectorDetailListSection>

          <SelectorDetailListSection
            meta={<span>{fixtureDetail.cohortHistory.length}개 기수</span>}
            title="이전 기수 활동 내역"
            titleId="selector-cohort-history-title"
          >
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
          </SelectorDetailListSection>

          <SelectorDetailListSection
            meta={<span>총 {settlementCount.toLocaleString("ko-KR")}건</span>}
            title="정산 내역"
            titleId="selector-settlement-history-title"
          >
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
          </SelectorDetailListSection>
        </div>
      ) : (
        <div className="fuma-detail-panel__content">
          <section className="fuma-empty-state" aria-label="셀렉터스 없음">
            <h2>대상을 찾을 수 없습니다</h2>
            <p>요청한 셀렉터스 정보를 확인할 수 없습니다.</p>
          </section>
        </div>
      )}
    </>
  );

  if (presentation === "modal") {
    return (
      <Modal
        className="hsas-selector-detail-modal"
        closeOnBackdrop
        onClose={onClose}
        open
        title="셀렉터스 상세"
      >
        {body}
      </Modal>
    );
  }

  return <SidePanel onClose={onClose} title="셀렉터스 상세">{body}</SidePanel>;
}
