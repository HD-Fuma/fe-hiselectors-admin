import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AnalysisFormatBreakdown } from "../../components/charts/AnalysisFormatBreakdown";
import type { AnalysisFormatSegment } from "../../components/charts/AnalysisFormatDonut";
import { PeriodLineChart } from "../../components/charts/PeriodLineChart";
import { SparklineChart } from "../../components/charts/SparklineChart";
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
import { contentChartEdgeScrollSpeed } from "./contentChartEdgeScroll";

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
  "#111111",
  "#238b78",
  "#de76ce",
  "#707070",
  "#a0a0a0",
] as const;
const CONTENT_CHART_COLORS = {
  contentCount: "#111111",
  views: "#238b78",
  likes: "#de76ce",
  comments: "#ca7700",
} as const;
const CONTENT_CHART_LABEL_COLOR = "#111111";

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

  return (
    <div className="fuma-content-table-trend">
      <SparklineChart
        animated
        ariaLabel="날짜별 조회수 및 좋아요 추이"
        categories={dates}
        categoryLabels={dates.map((date) => trendDateLabel(date))}
        endLabel={trendDateLabel(dates.at(-1))}
        series={[
          {
            color: CONTENT_CHART_COLORS.views,
            id: "views",
            name: "조회수",
            data: dates.map((date) => content.viewsTrend.find((point) => point.recordedAt === date)?.views ?? 0),
          },
          {
            color: CONTENT_CHART_COLORS.likes,
            id: "likes",
            name: "좋아요",
            data: dates.map((date) => content.reactionTrend.find((point) => point.recordedAt === date)?.likes ?? 0),
          },
        ]}
        labelColor={CONTENT_CHART_LABEL_COLOR}
        startLabel={trendDateLabel(dates[0])}
      />
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
  const chartEdgeScrollRef = useRef({ animationFrame: 0, speed: 0 });

  const stopChartEdgeScroll = () => {
    if (chartEdgeScrollRef.current.animationFrame) {
      window.cancelAnimationFrame(chartEdgeScrollRef.current.animationFrame);
    }
    chartEdgeScrollRef.current = { animationFrame: 0, speed: 0 };
  };

  const scrollChartAtEdge = () => {
    const scrollArea = chartScrollRef.current;
    if (!scrollArea || !chartEdgeScrollRef.current.speed) {
      return;
    }

    const previousScrollLeft = scrollArea.scrollLeft;
    scrollArea.scrollLeft += chartEdgeScrollRef.current.speed;
    if (scrollArea.scrollLeft === previousScrollLeft) {
      stopChartEdgeScroll();
      return;
    }
    chartEdgeScrollRef.current.animationFrame = window.requestAnimationFrame(scrollChartAtEdge);
  };

  const updateChartEdgeScroll = (event: ReactPointerEvent<HTMLDivElement>) => {
    const scrollArea = chartScrollRef.current;
    if (!scrollArea || scrollArea.scrollWidth <= scrollArea.clientWidth) {
      stopChartEdgeScroll();
      return;
    }

    const bounds = scrollArea.getBoundingClientRect();
    const speed = contentChartEdgeScrollSpeed(event.clientX, bounds.left, bounds.right);
    chartEdgeScrollRef.current.speed = speed;
    if (speed && !chartEdgeScrollRef.current.animationFrame) {
      chartEdgeScrollRef.current.animationFrame = window.requestAnimationFrame(scrollChartAtEdge);
    } else if (!speed) {
      stopChartEdgeScroll();
    }
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
            animated
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
            className="fuma-content-cohort-chart__scroll"
            onPointerCancel={stopChartEdgeScroll}
            onPointerLeave={stopChartEdgeScroll}
            onPointerMove={updateChartEdgeScroll}
            ref={chartScrollRef}
            role="region"
          >
            <PeriodLineChart
              animated
              ariaLabel={cohortChartMode === "all"
                ? "기간별 전체 성과 추이"
                : `기간별 ${visibleCohortSeries[0].label} 추이`}
              categories={periodMetrics.map((metric) => metric.date)}
              categoryLabels={periodMetrics.map((metric) => trendDateLabel(metric.date))}
              className="fuma-content-period-chart__plot"
              formatValue={formatCount}
              height={246}
              labelColor={CONTENT_CHART_LABEL_COLOR}
              modeClass={cohortChartMode}
              series={visibleCohortSeries.map((series) => ({
                color: CONTENT_CHART_COLORS[series.value],
                data: periodMetrics.map((metric) => metric[series.value]),
                id: series.value,
                name: series.label,
              }))}
              showValueLabels={cohortChartMode !== "all"}
              width={cohortChartWidth}
            />
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
    .map((series) => ({
      ...series,
      data: trendDates.map((date) => {
        if (series.value === "views") {
          return content.viewsTrend.find((point) => point.recordedAt === date)?.views ?? 0;
        }
        const reaction = content.reactionTrend.find((point) => point.recordedAt === date);
        return reaction?.[series.value] ?? 0;
      }),
    }));

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
              <PeriodLineChart
                animated
                ariaLabel="콘텐츠 조회 및 반응 추이"
                categories={trendDates}
                categoryLabels={trendDates.map((date) => trendDateLabel(date))}
                formatValue={formatCount}
                height={148}
                labelColor={CONTENT_CHART_LABEL_COLOR}
                modeClass={trendMode}
                series={detailTrendSeries.map((series) => ({
                  color: CONTENT_CHART_COLORS[series.value],
                  data: series.data,
                  id: series.value,
                  name: series.label,
                }))}
                showValueLabels={trendMode !== "all"}
                width={trendChartWidth}
              />
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
