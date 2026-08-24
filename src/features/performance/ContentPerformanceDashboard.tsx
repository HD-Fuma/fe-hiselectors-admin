import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AnalysisFormatBreakdown } from "../../components/charts/AnalysisFormatBreakdown";
import type { AnalysisFormatSegment } from "../../components/charts/AnalysisFormatDonut";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { ContentCollectionCard } from "../../components/ui/ContentCollectionCard";
import { contentCollectionFormatKey } from "../../components/ui/contentCollectionFormat";
import { Button, SegmentedControl, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill } from "../../components/ui/StatusPill";
import { ViewModeToggle, type ViewMode } from "../../components/ui/ViewModeToggle";
import {
  creatorNameById,
  formatCount,
  selectorCohortById,
  type ContentInfluence,
  type ContentPerformanceFormat,
  type ContentPerformanceSummaryApi,
} from "../../entities/performance";
import { assetUrl } from "../../lib/assetUrl";
import { paginate } from "../../lib/pagination";

const CONTENT_PERFORMANCE_PAGE_SIZE = 20;
type ContentPerformanceSort = "latest" | "engagementRate" | "views" | "likes" | "comments";

const CONTENT_PERFORMANCE_SORT_OPTIONS: readonly {
  label: string;
  value: ContentPerformanceSort;
}[] = [
  { label: "최신순", value: "latest" },
  { label: "ER 높은순", value: "engagementRate" },
  { label: "조회수 높은순", value: "views" },
  { label: "좋아요 높은순", value: "likes" },
  { label: "댓글 높은순", value: "comments" },
];
const CONTENT_FORMAT_COLORS = [
  "var(--fuma-content-format-1)",
  "var(--fuma-content-format-2)",
  "var(--fuma-content-format-3)",
  "var(--fuma-content-format-4)",
  "var(--fuma-content-format-5)",
] as const;

const CONTENT_MEDIA: Record<string, { creatorImage: string; thumbnail: string }> = {
  "ct-001": { thumbnail: "creator-media/kr-cr-001-01.jpg", creatorImage: "creator-media/kr-cr-001-profile.jpg" },
  "ct-002": { thumbnail: "creator-media/kr-cr-002-02.jpg", creatorImage: "creator-media/kr-cr-002-profile.jpg" },
  "ct-003": { thumbnail: "creator-media/kr-cr-001-02.jpg", creatorImage: "creator-media/kr-cr-001-profile.jpg" },
  "ct-004": { thumbnail: "creator-media/kr-cr-003-01.jpg", creatorImage: "creator-media/kr-cr-003-profile.jpg" },
  "ct-005": { thumbnail: "creator-media/kr-cr-004-01.jpg", creatorImage: "creator-media/kr-cr-004-profile.jpg" },
};

function contentMediaFor(content: ContentInfluence) {
  if (content.thumbnailUrl || content.profileImageUrl) {
    return {
      thumbnail: content.thumbnailUrl ?? "",
      creatorImage: content.profileImageUrl ?? "",
    };
  }

  const savedMedia = CONTENT_MEDIA[content.id];

  if (savedMedia) {
    return savedMedia;
  }

  const selectorNumber = Number(content.selectorId.replace(/\D/g, "")) || 1;
  const creatorNumber = ((selectorNumber - 1) % 4) + 1;
  const imageNumber = ((selectorNumber - 1) % 3) + 1;
  const creatorId = String(creatorNumber).padStart(3, "0");

  return {
    thumbnail: `creator-media/kr-cr-${creatorId}-${String(imageNumber).padStart(2, "0")}.jpg`,
    creatorImage: `creator-media/kr-cr-${creatorId}-profile.jpg`,
  };
}

function trendDateLabel(recordedAt: string | undefined) {
  if (!recordedAt) {
    return "";
  }

  const [, month, day] = recordedAt.split("-");
  return month && day ? `${month}.${day}` : recordedAt;
}

function ContentTableTrendChart({ content }: { content: ContentInfluence }) {
  const dates = [...new Set([
    ...content.viewsTrend.map((point) => point.recordedAt),
    ...content.reactionTrend.map((point) => point.recordedAt),
  ])].sort();

  if (dates.length === 0) {
    return (
      <div aria-label="조회수 및 좋아요 추이 데이터 없음" className="fuma-content-table-trend is-empty">
        데이터 없음
      </div>
    );
  }

  const chartWidth = 220;
  const series = [
    {
      label: "조회수",
      value: "views",
      values: dates.map((date) => content.viewsTrend.find((point) => point.recordedAt === date)?.views ?? 0),
    },
    {
      label: "좋아요",
      value: "likes",
      values: dates.map((date) => content.reactionTrend.find((point) => point.recordedAt === date)?.likes ?? 0),
    },
  ] as const;
  const chartSeries = series.map((item) => {
    const maximum = Math.max(1, ...item.values);
    return {
      ...item,
      points: item.values.map((value, index) => ({
        x: dates.length === 1 ? chartWidth / 2 : 16 + index * ((chartWidth - 32) / (dates.length - 1)),
        y: 8 + (1 - value / maximum) * 30,
      })),
    };
  });

  return (
    <div className="fuma-content-table-trend">
      <svg
        aria-label="날짜별 조회수 및 좋아요 추이"
        className="fuma-content-cohort-chart__plot fuma-content-table-trend__plot is-all"
        role="img"
        viewBox={`0 0 ${chartWidth} 56`}
      >
        <line className="fuma-content-cohort-chart__grid" x1="8" x2={chartWidth - 8} y1="8" y2="8" />
        <line className="fuma-content-cohort-chart__grid" x1="8" x2={chartWidth - 8} y1="23" y2="23" />
        <line className="fuma-content-cohort-chart__grid" x1="8" x2={chartWidth - 8} y1="38" y2="38" />
        {chartSeries.map((item) => (
          <g className={`fuma-content-cohort-chart__series is-${item.value}`} data-series={item.value} key={item.value}>
            <path className="fuma-content-cohort-chart__line" d={smoothLinePath(item.points)} />
            {item.points.map((point, index) => (
              <circle
                className="fuma-content-cohort-chart__point"
                cx={point.x}
                cy={point.y}
                key={`${dates[index]}-${item.value}`}
                r="2.5"
              />
            ))}
          </g>
        ))}
        <text className="fuma-content-cohort-chart__label" textAnchor="start" x="8" y="53">
          {trendDateLabel(dates[0])}
        </text>
        <text className="fuma-content-cohort-chart__label" textAnchor="end" x={chartWidth - 8} y="53">
          {trendDateLabel(dates.at(-1))}
        </text>
      </svg>
    </div>
  );
}

function contentAuthor(content: ContentInfluence) {
  return content.authorName || creatorNameById(content.creatorId);
}

function contentCohort(content: ContentInfluence) {
  return content.cohort || selectorCohortById(content.selectorId);
}

function contentFormatTag(format: ContentPerformanceFormat) {
  if (format === "인스타 릴스") return { className: "is-reels", label: "릴스" };
  if (format === "유튜브 롱폼") return { className: "is-long-form", label: "롱폼" };
  if (format === "유튜브 쇼츠") return { className: "is-short-form", label: "숏폼" };
  return { className: "is-feed", label: "피드" };
}

function contentFormatSegments(summary: ContentPerformanceSummaryApi): AnalysisFormatSegment[] {
  const formats = [
    { contentType: "SHORT_FORM", label: "인스타 릴스" },
    { contentType: "FEED", label: "인스타 피드" },
    { contentType: "SHORTS", label: "유튜브 쇼츠" },
    { contentType: "LONG_FORM", label: "유튜브 롱폼" },
  ] as const;
  const countByType = new Map(summary.formats.map((format) => [format.contentType, format.count]));
  let start = 0;

  return formats.map((format, index) => {
    const count = countByType.get(format.contentType) ?? 0;
    const percentage = summary.totalContentCount === 0
      ? 0
      : (count / summary.totalContentCount) * 100;
    const segment = {
      color: CONTENT_FORMAT_COLORS[index],
      count,
      label: format.label,
      percentage,
      start,
    };
    start += percentage;
    return segment;
  });
}

function contentEngagementRate(content: ContentInfluence) {
  return content.views > 0 ? (content.likes + content.comments) / content.views : 0;
}

function sortContentPerformance(
  contents: readonly ContentInfluence[],
  sortBy: ContentPerformanceSort,
) {
  return [...contents].sort((left, right) => {
    const metricDifference = sortBy === "engagementRate"
      ? contentEngagementRate(right) - contentEngagementRate(left)
      : sortBy === "latest"
        ? 0
        : right[sortBy] - left[sortBy];

    return metricDifference
      || right.publishedAt.localeCompare(left.publishedAt)
      || left.id.localeCompare(right.id, "ko", { numeric: true });
  });
}

type CohortChartMetric = "contentCount" | "views" | "likes" | "comments";
type CohortChartMode = "all" | CohortChartMetric;
type ContentDetailTrendMetric = Exclude<CohortChartMetric, "contentCount">;
type ContentDetailTrendMode = "all" | ContentDetailTrendMetric;

const COHORT_CHART_OPTIONS: readonly {
  label: string;
  value: CohortChartMode;
}[] = [
  { label: "종합", value: "all" },
  { label: "게시글 수", value: "contentCount" },
  { label: "조회수", value: "views" },
  { label: "좋아요", value: "likes" },
  { label: "댓글 수", value: "comments" },
];

const COHORT_CHART_SERIES: readonly {
  label: string;
  unit: string;
  value: CohortChartMetric;
}[] = [
  { label: "게시글 수", unit: "건", value: "contentCount" },
  { label: "조회수", unit: "회", value: "views" },
  { label: "좋아요", unit: "개", value: "likes" },
  { label: "댓글 수", unit: "개", value: "comments" },
];

const CONTENT_DETAIL_TREND_OPTIONS: readonly {
  label: string;
  value: ContentDetailTrendMode;
}[] = [
  { label: "종합", value: "all" },
  { label: "조회수", value: "views" },
  { label: "좋아요", value: "likes" },
  { label: "댓글 수", value: "comments" },
];

function smoothLinePath(points: readonly { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.slice(0, -1).reduce((path, point, index) => {
    const previous = points[index - 1] ?? point;
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;
    const control1X = point.x + (next.x - previous.x) / 6;
    const control1Y = point.y + (next.y - previous.y) / 6;
    const control2X = next.x - (afterNext.x - point.x) / 6;
    const control2Y = next.y - (afterNext.y - point.y) / 6;

    return `${path} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${next.x} ${next.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

function ContentOverview({
  contents,
  uploadSummary,
  uploadSummaryError,
  uploadSummaryLoading,
}: {
  contents: readonly ContentInfluence[];
  uploadSummary?: ContentPerformanceSummaryApi;
  uploadSummaryError?: string;
  uploadSummaryLoading?: boolean;
}) {
  const [cohortChartMode, setCohortChartMode] = useState<CohortChartMode>("all");
  const sortedContentDates = [...contents].map((content) => content.publishedAt).sort();
  const defaultPeriodStart = sortedContentDates[0] ?? "";
  const defaultPeriodEnd = sortedContentDates.at(-1) ?? "";
  const [periodStart, setPeriodStart] = useState(defaultPeriodStart);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodEnd);
  const [appliedPeriod, setAppliedPeriod] = useState({
    start: defaultPeriodStart,
    end: defaultPeriodEnd,
  });
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const chartDragRef = useRef({ pointerId: -1, startScrollLeft: 0, startX: 0 });
  const [isChartDragging, setIsChartDragging] = useState(false);

  const startChartDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const scrollArea = chartScrollRef.current;
    if (!scrollArea) {
      return;
    }

    chartDragRef.current = {
      pointerId: event.pointerId,
      startScrollLeft: scrollArea.scrollLeft,
      startX: event.clientX,
    };
    scrollArea.setPointerCapture(event.pointerId);
    setIsChartDragging(true);
  };

  const moveChartDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const scrollArea = chartScrollRef.current;
    if (!scrollArea || chartDragRef.current.pointerId !== event.pointerId) {
      return;
    }

    scrollArea.scrollLeft = chartDragRef.current.startScrollLeft - (event.clientX - chartDragRef.current.startX);
  };

  const endChartDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const scrollArea = chartScrollRef.current;
    if (!scrollArea || chartDragRef.current.pointerId !== event.pointerId) {
      return;
    }

    if (scrollArea.hasPointerCapture(event.pointerId)) {
      scrollArea.releasePointerCapture(event.pointerId);
    }
    chartDragRef.current.pointerId = -1;
    setIsChartDragging(false);
  };
  const dailyMetrics = new Map<string, {
    comments: number;
    contentCount: number;
    likes: number;
    views: number;
  }>();
  contents
    .filter((content) => (
      (!appliedPeriod.start || content.publishedAt >= appliedPeriod.start)
      && (!appliedPeriod.end || content.publishedAt <= appliedPeriod.end)
    ))
    .forEach((content) => {
      const current = dailyMetrics.get(content.publishedAt) ?? {
        comments: 0,
        contentCount: 0,
        likes: 0,
        views: 0,
      };
      dailyMetrics.set(content.publishedAt, {
        comments: current.comments + content.comments,
        contentCount: current.contentCount + 1,
        likes: current.likes + content.likes,
        views: current.views + content.views,
      });
    });
  const periodMetrics = [...dailyMetrics]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, metric]) => ({ date, ...metric }));
  const periodPointGap = 96;
  const cohortChartWidth = Math.max(560, (periodMetrics.length - 1) * periodPointGap + 84);
  const visibleCohortSeries = cohortChartMode === "all"
    ? COHORT_CHART_SERIES
    : COHORT_CHART_SERIES.filter((series) => series.value === cohortChartMode);
  const cohortChartSeries = visibleCohortSeries.map((series) => {
    const maximum = Math.max(1, ...periodMetrics.map((metric) => metric[series.value]));
    return {
      ...series,
      points: periodMetrics.map((metric, index) => ({
        x: 42 + index * periodPointGap,
        y: 25 + (1 - metric[series.value] / maximum) * 168,
      })),
    };
  });
  const formatSegments = uploadSummary ? contentFormatSegments(uploadSummary) : [];
  const cohortChange = !uploadSummary || uploadSummary.previousGenerationContentCount === 0
    ? "-"
    : `${uploadSummary.currentGenerationContentCount >= uploadSummary.previousGenerationContentCount ? "+" : ""}${(
      ((uploadSummary.currentGenerationContentCount - uploadSummary.previousGenerationContentCount)
        / uploadSummary.previousGenerationContentCount) * 100
    ).toFixed(1)}%`;

  return (
    <section aria-label="콘텐츠 성과 요약" className="fuma-content-performance-overview">
      <article className="fuma-content-performance-panel fuma-content-upload-status">
        <header>
          <span>UPLOAD</span>
          <h2>업로드 현황</h2>
        </header>
        <dl>
          <div><dt>전체</dt><dd>{uploadSummary ? `${formatCount(uploadSummary.totalContentCount)}건` : "-"}</dd></div>
          <div><dt>이번 기수</dt><dd>{uploadSummary ? `${formatCount(uploadSummary.currentGenerationContentCount)}건` : "-"}</dd></div>
          <div><dt>이전 대비</dt><dd>{cohortChange}</dd></div>
        </dl>
        <section aria-label="콘텐츠 유형" className="fuma-content-upload-status__formats">
          <h3>콘텐츠 유형</h3>
          <AnalysisFormatBreakdown
            segments={formatSegments}
            showTotal={false}
            total={uploadSummary?.totalContentCount ?? 0}
          />
          {uploadSummaryLoading ? <p>집계 데이터를 불러오는 중입니다.</p> : null}
          {uploadSummaryError ? <p>{uploadSummaryError}</p> : null}
        </section>
      </article>

      <article
        aria-label="기간별 콘텐츠 성과"
        className="fuma-content-performance-panel fuma-content-cohort-chart"
      >
        <header>
          <div>
            <span>TREND</span>
            <h2>기간별 콘텐츠 성과</h2>
          </div>
          <form
            aria-label="콘텐츠 성과 기간 검색"
            className="fuma-content-period-chart__period"
            onSubmit={(event) => {
              event.preventDefault();
              setAppliedPeriod({ start: periodStart, end: periodEnd });
            }}
          >
            <strong>기간</strong>
            <TextInput
              aria-label="성과 시작일"
              max={periodEnd || undefined}
              onChange={(event) => setPeriodStart(event.target.value)}
              type="date"
              value={periodStart}
            />
            <span>~</span>
            <TextInput
              aria-label="성과 종료일"
              min={periodStart || undefined}
              onChange={(event) => setPeriodEnd(event.target.value)}
              type="date"
              value={periodEnd}
            />
            <Button type="submit" variant="primary">조회</Button>
          </form>
        </header>
        <div className="fuma-content-period-chart__toolbar">
          <SegmentedControl
            ariaLabel="기간별 성과 지표"
            onChange={setCohortChartMode}
            options={COHORT_CHART_OPTIONS}
            value={cohortChartMode}
          />
          <ul aria-label="차트 범례" className="fuma-content-cohort-chart__legend">
            {visibleCohortSeries.map((series) => (
              <li className={`is-${series.value}`} key={series.value}><i />{series.label}</li>
            ))}
          </ul>
        </div>
        {periodMetrics.length > 0 ? (
          <div
            aria-label="기간별 콘텐츠 성과 그래프 좌우 이동"
            className={`fuma-content-cohort-chart__scroll fuma-content-cohort-chart__scroll--draggable${isChartDragging ? " is-dragging" : ""}`}
            onPointerCancel={endChartDrag}
            onPointerDown={startChartDrag}
            onPointerMove={moveChartDrag}
            onPointerUp={endChartDrag}
            ref={chartScrollRef}
            role="region"
          >
            <svg
              aria-label={cohortChartMode === "all" ? "기간별 전체 성과 추이" : `기간별 ${cohortChartSeries[0].label} 추이`}
              className={`fuma-content-cohort-chart__plot fuma-content-period-chart__plot is-${cohortChartMode}`}
              role="img"
              style={{ width: `${cohortChartWidth}px` }}
              viewBox={`0 0 ${cohortChartWidth} 246`}
            >
              <line className="fuma-content-cohort-chart__grid" x1="18" x2={cohortChartWidth - 18} y1="25" y2="25" />
              <line className="fuma-content-cohort-chart__grid" x1="18" x2={cohortChartWidth - 18} y1="109" y2="109" />
              <line className="fuma-content-cohort-chart__grid" x1="18" x2={cohortChartWidth - 18} y1="193" y2="193" />
              {cohortChartSeries.map((series) => (
                <g className={`fuma-content-cohort-chart__series is-${series.value}`} data-series={series.value} key={series.value}>
                  <path className="fuma-content-cohort-chart__line" d={smoothLinePath(series.points)} />
                  {periodMetrics.map((metric, index) => {
                    const point = series.points[index];
                    const value = metric[series.value];
                    return (
                      <g data-metric-date={metric.date} data-metric-value={value} key={metric.date}>
                        <circle className="fuma-content-cohort-chart__point" cx={point.x} cy={point.y} r="3.5" />
                        {cohortChartMode !== "all" ? (
                          <text className="fuma-content-cohort-chart__value" textAnchor="middle" x={point.x} y={point.y - 11}>
                            {formatCount(value)}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </g>
              ))}
              {periodMetrics.map((metric, index) => {
                const x = 42 + index * periodPointGap;
                return (
                  <g data-period-date={metric.date} key={metric.date}>
                    <text className="fuma-content-cohort-chart__label" textAnchor="middle" x={x} y="228">
                      {trendDateLabel(metric.date)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : <p>조회 기간에 표시할 콘텐츠 성과가 없습니다.</p>}
      </article>

    </section>
  );
}

function ContentPerformanceCard({
  content,
  onOpen,
}: {
  content: ContentInfluence;
  onOpen: () => void;
}) {
  const media = contentMediaFor(content);
  const author = contentAuthor(content);
  const formatTag = contentFormatTag(content.contentFormat);
  const platform = content.platform === "YouTube" ? "YouTube" : "Instagram";
  const showPlay = content.contentFormat === "유튜브 롱폼"
    || content.contentFormat === "유튜브 쇼츠"
    || content.contentFormat === "인스타 릴스";

  return (
    <article
      aria-label={`${author} ${content.title} 성과 카드`}
      className="fuma-content-collection__card fuma-creator-card fuma-content-performance-card"
      data-content-format={contentCollectionFormatKey(content.contentFormat)}
    >
      <ContentCollectionCard
        author={author}
        caption={content.caption}
        footerEnd={<span className="fuma-content-performance-card__hint">상세 보기</span>}
        footerStart={content.publishedAt}
        mediaAlt={`${content.title} 썸네일`}
        mediaUrl={media.thumbnail}
        platform={platform}
        profileImageUrl={media.creatorImage}
        showPlay={showPlay}
        snsId={content.accountId}
        status={(
          <StatusPill
            className={`fuma-content-collection__inspection-status fuma-content-performance-format ${formatTag.className}`}
            tone="neutral"
          >
            {formatTag.label}
          </StatusPill>
        )}
        title={content.title}
      />
      <button
        aria-label={`${author} ${content.title} 콘텐츠 상세 보기`}
        className="fuma-content-performance-card__trigger"
        onClick={onOpen}
        type="button"
      />
    </article>
  );
}

function ContentPerformanceDetailPanel({
  content,
  onClose,
}: {
  content: ContentInfluence;
  onClose: () => void;
}) {
  const [trendMode, setTrendMode] = useState<ContentDetailTrendMode>("all");
  const media = contentMediaFor(content);
  const author = contentAuthor(content);
  const formatTag = contentFormatTag(content.contentFormat);
  const engagementRate = contentEngagementRate(content) * 100;
  const trendDates = [...new Set([
    ...content.viewsTrend.map((point) => point.recordedAt),
    ...content.reactionTrend.map((point) => point.recordedAt),
  ])].sort();
  const trendChartWidth = Math.max(520, (trendDates.length - 1) * 92 + 84);
  const detailTrendSeries = COHORT_CHART_SERIES
    .filter((series): series is typeof series & { value: ContentDetailTrendMetric } => (
      series.value !== "contentCount" && (trendMode === "all" || series.value === trendMode)
    ))
    .map((series) => {
      const values = trendDates.map((date) => {
        if (series.value === "views") {
          return content.viewsTrend.find((point) => point.recordedAt === date)?.views ?? 0;
        }
        const reaction = content.reactionTrend.find((point) => point.recordedAt === date);
        return reaction?.[series.value] ?? 0;
      });
      const maximum = Math.max(1, ...values);
      return {
        ...series,
        points: values.map((value, index) => ({
          value,
          x: 42 + index * 92,
          y: 25 + (1 - value / maximum) * 76,
        })),
      };
    });

  return (
    <SidePanel onClose={onClose} title="콘텐츠 상세">
      <div className="fuma-detail-panel__content fuma-content-performance-detail">
        <section aria-label="콘텐츠 기본 정보" className="fuma-content-performance-detail__overview">
          <img alt={`${content.title} 썸네일`} src={assetUrl(media.thumbnail)} />
          <div>
            <div className="fuma-content-performance-detail__badges">
              <StatusPill tone="neutral">{contentCohort(content)}</StatusPill>
              <StatusPill className={`fuma-content-performance-format ${formatTag.className}`} tone="neutral">
                {formatTag.label}
              </StatusPill>
            </div>
            <h3>{content.title}</h3>
            <p>{content.caption}</p>
            <dl>
              <div><dt>콘텐츠 ID</dt><dd>{content.id}</dd></div>
              <div><dt>작성자</dt><dd>{author}</dd></div>
              <div><dt>플랫폼</dt><dd>{content.platform}</dd></div>
              <div><dt>게시일</dt><dd>{content.publishedAt}</dd></div>
            </dl>
          </div>
        </section>

        <section aria-labelledby="content-performance-detail-metrics">
          <h3 id="content-performance-detail-metrics">콘텐츠 성과</h3>
          <dl className="fuma-content-performance-detail__metrics">
            <div><dt>ER</dt><dd>{content.views > 0 ? `${engagementRate.toFixed(2)}%` : "-"}</dd></div>
            <div><dt>누적 조회수</dt><dd>{content.views > 0 ? formatCount(content.views) : "-"}</dd></div>
            <div><dt>누적 좋아요</dt><dd>{formatCount(content.likes)}</dd></div>
            <div><dt>누적 댓글</dt><dd>{formatCount(content.comments)}</dd></div>
          </dl>
        </section>

        <section aria-labelledby="content-performance-detail-trends" className="fuma-content-performance-detail__trend">
          <header>
            <h3 id="content-performance-detail-trends">조회 및 반응 추이</h3>
            <SegmentedControl
              ariaLabel="콘텐츠 성과 추이 지표"
              onChange={setTrendMode}
              options={CONTENT_DETAIL_TREND_OPTIONS}
              value={trendMode}
            />
          </header>
          {trendDates.length > 0 ? (
            <div className="fuma-content-cohort-chart__scroll">
              <ul aria-label="콘텐츠 성과 추이 범례" className="fuma-content-cohort-chart__legend">
                {detailTrendSeries.map((series) => (
                  <li className={`is-${series.value}`} key={series.value}><i />{series.label}</li>
                ))}
              </ul>
              <svg
                aria-label="콘텐츠 조회 및 반응 추이"
                className={`fuma-content-cohort-chart__plot is-${trendMode}`}
                role="img"
                style={{ width: `${trendChartWidth}px` }}
                viewBox={`0 0 ${trendChartWidth} 148`}
              >
                <line className="fuma-content-cohort-chart__grid" x1="18" x2={trendChartWidth - 18} y1="25" y2="25" />
                <line className="fuma-content-cohort-chart__grid" x1="18" x2={trendChartWidth - 18} y1="63" y2="63" />
                <line className="fuma-content-cohort-chart__grid" x1="18" x2={trendChartWidth - 18} y1="101" y2="101" />
                {detailTrendSeries.map((series) => (
                  <g className={`fuma-content-cohort-chart__series is-${series.value}`} data-series={series.value} key={series.value}>
                    <path className="fuma-content-cohort-chart__line" d={smoothLinePath(series.points)} />
                    {series.points.map((point, index) => (
                      <g key={trendDates[index]}>
                        <circle className="fuma-content-cohort-chart__point" cx={point.x} cy={point.y} r="4" />
                        {trendMode !== "all" ? (
                          <text className="fuma-content-cohort-chart__value" textAnchor="middle" x={point.x} y={point.y - 11}>
                            {formatCount(point.value)}
                          </text>
                        ) : null}
                      </g>
                    ))}
                  </g>
                ))}
                {trendDates.map((date, index) => (
                  <text
                    className="fuma-content-cohort-chart__label"
                    key={date}
                    textAnchor="middle"
                    x={42 + index * 92}
                    y="126"
                  >
                    {trendDateLabel(date)}
                  </text>
                ))}
              </svg>
            </div>
          ) : <p>표시할 날짜별 성과가 없습니다.</p>}
        </section>
      </div>
    </SidePanel>
  );
}

function contentPerformanceColumns(
  contents: readonly ContentInfluence[],
): DenseTableColumn<ContentInfluence>[] {
  const orderById = new Map(contents.map((content, index) => [content.id, index + 1]));

  return [
    {
      id: "rank",
      header: "순위",
      width: 64,
      align: "center",
      render: (content) => orderById.get(content.id) ?? "-",
    },
    {
      id: "content",
      header: "콘텐츠",
      width: 300,
      render: (content) => {
        const media = contentMediaFor(content);
        return (
          <div className="fuma-content-reaction-table__content">
            <img alt="" src={assetUrl(media.thumbnail)} />
            <div>
              <strong>{content.title}</strong>
              <span>{content.publishedAt}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "platform",
      header: "플랫폼",
      align: "center",
      width: 112,
      render: (content) => (
        <span className="fuma-content-reaction-table__platform">
          <PlatformIcon decorative platform={content.platform === "YouTube" ? "YouTube" : "Instagram"} />
          {content.platform}
        </span>
      ),
    },
    {
      id: "contentFormat",
      header: "콘텐츠 유형",
      align: "center",
      width: 96,
      render: (content) => {
        const formatTag = contentFormatTag(content.contentFormat);
        return (
          <StatusPill className={`fuma-content-performance-format ${formatTag.className}`} tone="neutral">
            {formatTag.label}
          </StatusPill>
        );
      },
    },
    {
      id: "selector",
      header: "셀렉터스",
      align: "center",
      width: 160,
      render: (content) => {
        const media = contentMediaFor(content);
        return (
          <div className="fuma-content-reaction-table__channel">
            <img alt="" src={assetUrl(media.creatorImage)} />
            <span><strong>{contentAuthor(content)}</strong></span>
          </div>
        );
      },
    },
    {
      key: "followers",
      header: "팔로워 수",
      width: 112,
      align: "right",
      render: (content) => formatCount(content.followers),
    },
    {
      key: "views",
      header: "누적 조회 수",
      width: 108,
      align: "right",
      render: (content) => content.views > 0 ? formatCount(content.views) : "-",
    },
    {
      key: "likes",
      header: "누적 좋아요 수",
      width: 108,
      align: "right",
      render: (content) => (
        <span className="fuma-content-reaction-table__count">{formatCount(content.likes)}</span>
      ),
    },
    {
      id: "performanceTrend",
      header: (
        <span className="fuma-content-table-trend__header">
          <span>조회수 · 좋아요 추이</span>
          <small><i className="is-views" />조회수<i className="is-likes" />좋아요</small>
        </span>
      ),
      width: 220,
      render: (content) => <ContentTableTrendChart content={content} />,
    },
  ];
}

function ContentPerformanceResults({
  contents,
  errorMessage,
  filters,
  loading,
  onPageChange,
  page,
}: {
  contents: readonly ContentInfluence[];
  errorMessage?: string;
  filters?: ReactNode;
  loading?: boolean;
  onPageChange: (page: number) => void;
  page: number;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<ContentPerformanceSort>("latest");
  const [selectedContent, setSelectedContent] = useState<ContentInfluence | null>(null);
  const sortedContents = sortContentPerformance(contents, sortBy);
  const {
    currentPage,
    pagedItems: pagedContents,
    totalPages,
  } = paginate(sortedContents, page, CONTENT_PERFORMANCE_PAGE_SIZE);
  const changeView = (nextView: ViewMode) => {
    setViewMode(nextView);
    onPageChange(1);
  };
  const changeSort = (nextSort: ContentPerformanceSort) => {
    setSortBy(nextSort);
    onPageChange(1);
  };

  return (
    <section
      aria-label="콘텐츠 성과 및 추이"
      className="fuma-content-collection fuma-content-performance-results"
      role="region"
    >
      <ResultToolbar
        actions={(
          <>
            <label className="fuma-creator-toolbar__sort fuma-content-performance-results__sort">
              <span>정렬</span>
              <Select
                aria-label="콘텐츠 성과 정렬"
                onChange={(event) => changeSort(event.target.value as ContentPerformanceSort)}
                options={CONTENT_PERFORMANCE_SORT_OPTIONS}
                value={sortBy}
              />
            </label>
            <ViewModeToggle
              onChange={changeView}
              value={viewMode}
            />
          </>
        )}
        className="fuma-simple-result-toolbar fuma-campaign-result-toolbar"
        meta={<span>총 {contents.length}건</span>}
        title="콘텐츠 성과 및 추이"
      />
      {filters}
      {loading ? (
        <EmptyState description="잠시만 기다려 주세요." title="콘텐츠 성과를 불러오는 중입니다." />
      ) : errorMessage ? (
        <EmptyState description={errorMessage} title="콘텐츠 성과를 불러오지 못했습니다." />
      ) : pagedContents.length === 0 ? (
        <EmptyState title="검색 결과가 없습니다." />
      ) : viewMode === "grid" ? (
        <div className="fuma-content-collection__track is-grid">
          {pagedContents.map((content) => (
            <ContentPerformanceCard
              content={content}
              key={content.id}
              onOpen={() => setSelectedContent(content)}
            />
          ))}
        </div>
      ) : (
        <div
          aria-label="콘텐츠 성과 목록"
          className="fuma-wide-table fuma-content-collection__list"
          role="region"
        >
          <DenseTable
            columns={contentPerformanceColumns(sortedContents)}
            onRowClick={setSelectedContent}
            rowKey={(content) => content.id}
            rows={pagedContents}
            selectedRowKeys={selectedContent ? [selectedContent.id] : []}
          />
        </div>
      )}
      <Pagination
        onPageChange={onPageChange}
        page={currentPage}
        pageSize={CONTENT_PERFORMANCE_PAGE_SIZE}
        totalPages={totalPages}
      />
      {selectedContent ? (
        <ContentPerformanceDetailPanel
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      ) : null}
    </section>
  );
}

export function ContentPerformanceDashboard({
  contents,
  filters,
  onPageChange,
  page,
  resultContents = contents,
  resultErrorMessage,
  resultLoading = false,
  uploadSummary,
  uploadSummaryError,
  uploadSummaryLoading = false,
}: {
  contents: readonly ContentInfluence[];
  filters?: ReactNode;
  onPageChange: (page: number) => void;
  page: number;
  resultContents?: readonly ContentInfluence[];
  resultErrorMessage?: string;
  resultLoading?: boolean;
  uploadSummary?: ContentPerformanceSummaryApi;
  uploadSummaryError?: string;
  uploadSummaryLoading?: boolean;
}) {
  return (
    <>
      <ContentOverview
        contents={contents}
        uploadSummary={uploadSummary}
        uploadSummaryError={uploadSummaryError}
        uploadSummaryLoading={uploadSummaryLoading}
      />
      <ContentPerformanceResults
        contents={resultContents}
        errorMessage={resultErrorMessage}
        filters={filters}
        loading={resultLoading}
        onPageChange={onPageChange}
        page={page}
      />
    </>
  );
}
