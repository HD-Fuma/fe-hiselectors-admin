import { useId, useState } from "react";
import { AnalysisFormatBreakdown } from "../../components/charts/AnalysisFormatBreakdown";
import type { AnalysisFormatSegment } from "../../components/charts/AnalysisFormatDonut";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { ContentCollectionCard } from "../../components/ui/ContentCollectionCard";
import { contentCollectionFormatKey } from "../../components/ui/contentCollectionFormat";
import { SegmentedControl } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { StatusPill } from "../../components/ui/StatusPill";
import {
  creatorNameById,
  formatCount,
  selectorCohortById,
  type ContentInfluence,
  type ContentPerformanceFormat,
  type ContentUploadActivity,
} from "../../entities/performance";
import { assetUrl } from "../../lib/assetUrl";
import { paginate } from "../../lib/pagination";

const CONTENT_PERFORMANCE_PAGE_SIZE = 20;
const CONTENT_FORMAT_ORDER: readonly ContentPerformanceFormat[] = [
  "인스타 릴스",
  "인스타 피드",
  "인스타 이미지",
  "유튜브 쇼츠",
  "유튜브 롱폼",
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

function ContentTrendGraph({
  label,
  recordedAt,
  tone,
  values,
}: {
  label: string;
  recordedAt: readonly string[];
  tone: "views" | "likes";
  values: readonly number[];
}) {
  if (values.length === 0) {
    return (
      <div aria-label={`${label} 추이 데이터 없음`} className="fuma-content-trend-graph is-empty">
        데이터 없음
      </div>
    );
  }

  const chartWidth = 144;
  const baseline = 29;
  const chartPadding = 4;
  const barGap = 3;
  const maximum = Math.max(1, ...values);
  const barWidth = (chartWidth - chartPadding * 2 - barGap * (values.length - 1)) / values.length;

  return (
    <div aria-label={`날짜별 ${label} 추이`} className={`fuma-content-trend-graph is-${tone}`}>
      <svg aria-hidden="true" viewBox="0 0 144 34">
        <line x1="4" x2="140" y1="29" y2="29" />
        {values.map((value, index) => {
          const height = Math.max(2, (value / maximum) * 23);
          const x = chartPadding + index * (barWidth + barGap);

          return (
            <rect
              height={height}
              key={`${recordedAt[index]}-${value}`}
              rx="1.5"
              width={barWidth}
              x={x}
              y={baseline - height}
            />
          );
        })}
      </svg>
      <div className="fuma-content-trend-graph__dates">
        <span>{trendDateLabel(recordedAt[0])}</span>
        <span>{trendDateLabel(recordedAt.at(-1))}</span>
      </div>
    </div>
  );
}

function contentFormatSegments(contents: readonly ContentInfluence[]): AnalysisFormatSegment[] {
  let start = 0;

  return CONTENT_FORMAT_ORDER.map((format, index) => {
    const count = contents.filter((content) => content.contentFormat === format).length;
    const percentage = contents.length === 0 ? 0 : (count / contents.length) * 100;
    const segment = {
      color: CONTENT_FORMAT_COLORS[index],
      count,
      label: format,
      percentage,
      start,
    };
    start += percentage;
    return segment;
  });
}

function previousNumericCohort(cohort: string) {
  const match = cohort.match(/^(.*?)(\d+)(\D*)$/);

  if (!match) {
    return null;
  }

  const cohortNumber = Number(match[2]);

  return cohortNumber > 0 ? `${match[1]}${cohortNumber - 1}${match[3]}` : null;
}

type CohortChartMetric = "contentCount" | "views" | "likes" | "comments";
type CohortChartMode = "all" | CohortChartMetric;

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
  cohortContents,
  contents,
  highlightedCohort,
}: {
  cohortContents: readonly ContentInfluence[];
  contents: readonly ContentInfluence[];
  highlightedCohort: string;
}) {
  const [cohortChartMode, setCohortChartMode] = useState<CohortChartMode>("all");
  const cohortMetrics = new Map<string, {
    comments: number;
    contentCount: number;
    likes: number;
    views: number;
  }>();

  cohortContents.forEach((content) => {
    const cohort = selectorCohortById(content.selectorId);
    const current = cohortMetrics.get(cohort) ?? {
      comments: 0,
      contentCount: 0,
      likes: 0,
      views: 0,
    };
    cohortMetrics.set(cohort, {
      comments: current.comments + content.comments,
      contentCount: current.contentCount + 1,
      likes: current.likes + content.likes,
      views: current.views + content.views,
    });
  });

  const cohorts = [...cohortMetrics]
    .map(([cohort, metric]) => ({ cohort, ...metric }))
    .sort((left, right) => right.cohort.localeCompare(left.cohort, "ko", { numeric: true }));
  const cohortChartWidth = Math.max(440, (cohorts.length - 1) * 104 + 84);
  const visibleCohortSeries = cohortChartMode === "all"
    ? COHORT_CHART_SERIES
    : COHORT_CHART_SERIES.filter((series) => series.value === cohortChartMode);
  const cohortChartSeries = visibleCohortSeries.map((series) => {
    const maximum = Math.max(1, ...cohorts.map((cohort) => cohort[series.value]));
    return {
      ...series,
      points: cohorts.map((cohort, index) => ({
        x: 42 + index * 104,
        y: 25 + (1 - cohort[series.value] / maximum) * 76,
      })),
    };
  });
  const formatSegments = contentFormatSegments(contents);
  const currentCohortCount = cohortMetrics.get(highlightedCohort)?.contentCount ?? 0;
  const priorCohort = previousNumericCohort(highlightedCohort);
  const priorCohortCount = priorCohort
    ? cohortMetrics.get(priorCohort)?.contentCount ?? 0
    : 0;
  const cohortChange = priorCohortCount === 0
    ? "-"
    : `${currentCohortCount >= priorCohortCount ? "+" : ""}${(
      ((currentCohortCount - priorCohortCount) / priorCohortCount) * 100
    ).toFixed(1)}%`;

  return (
    <section aria-label="콘텐츠 성과 요약" className="fuma-content-performance-overview">
      <article className="fuma-content-performance-panel fuma-content-upload-status">
        <header>
          <span>UPLOAD</span>
          <h2>업로드 현황</h2>
        </header>
        <dl>
          <div><dt>전체</dt><dd>{formatCount(cohortContents.length)}건</dd></div>
          <div><dt>이번 기수</dt><dd>{formatCount(currentCohortCount)}건</dd></div>
          <div><dt>이전 대비</dt><dd>{cohortChange}</dd></div>
        </dl>
      </article>

      <article
        aria-label="기수별 누적 콘텐츠 성과"
        className="fuma-content-performance-panel fuma-content-cohort-chart"
      >
        <header>
          <div>
            <span>TREND</span>
            <h2>기수별 누적 콘텐츠 성과</h2>
          </div>
          <div className="fuma-content-cohort-chart__controls">
            <SegmentedControl
              ariaLabel="기수별 누적 성과 지표"
              onChange={setCohortChartMode}
              options={COHORT_CHART_OPTIONS}
              value={cohortChartMode}
            />
          </div>
        </header>
        {cohorts.length > 0 ? (
          <div className="fuma-content-cohort-chart__scroll">
            <ul aria-label="차트 범례" className="fuma-content-cohort-chart__legend">
              {visibleCohortSeries.map((series) => (
                <li className={`is-${series.value}`} key={series.value}><i />{series.label}</li>
              ))}
            </ul>
            <svg
              aria-label={cohortChartMode === "all" ? "기수별 전체 성과 추이" : `기수별 ${cohortChartSeries[0].label} 추이`}
              className={`fuma-content-cohort-chart__plot is-${cohortChartMode}`}
              role="img"
              style={{ width: `${cohortChartWidth}px` }}
              viewBox={`0 0 ${cohortChartWidth} 148`}
            >
              <line className="fuma-content-cohort-chart__grid" x1="18" x2={cohortChartWidth - 18} y1="25" y2="25" />
              <line className="fuma-content-cohort-chart__grid" x1="18" x2={cohortChartWidth - 18} y1="63" y2="63" />
              <line className="fuma-content-cohort-chart__grid" x1="18" x2={cohortChartWidth - 18} y1="101" y2="101" />
              {cohortChartSeries.map((series) => (
                <g className={`fuma-content-cohort-chart__series is-${series.value}`} data-series={series.value} key={series.value}>
                  <path className="fuma-content-cohort-chart__line" d={smoothLinePath(series.points)} />
                  {cohorts.map((cohort, index) => {
                    const point = series.points[index];
                    const value = cohort[series.value];
                    return (
                      <g key={cohort.cohort}>
                        <circle className="fuma-content-cohort-chart__point" cx={point.x} cy={point.y} r="4" />
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
              {cohorts.map((cohort, index) => {
                const x = 42 + index * 104;
                const highlighted = cohort.cohort === highlightedCohort;
                return (
                  <g data-cohort={cohort.cohort} data-highlighted={highlighted} key={cohort.cohort}>
                    <text className="fuma-content-cohort-chart__label" textAnchor="middle" x={x} y="126">{cohort.cohort}</text>
                    {highlighted ? (
                      <text className="fuma-content-cohort-chart__selected" textAnchor="middle" x={x} y="140">선택</text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>
        ) : <p>표시할 기수별 콘텐츠가 없습니다.</p>}
      </article>

      <article className="fuma-content-performance-panel fuma-content-format-panel">
        <header>
          <div>
            <span>FORMAT</span>
            <h2>콘텐츠 유형</h2>
          </div>
          <small>조회 결과 {formatCount(contents.length)}건</small>
        </header>
        <AnalysisFormatBreakdown segments={formatSegments} total={contents.length} />
      </article>
    </section>
  );
}

function UploadActivityChart({ activities }: { activities: readonly ContentUploadActivity[] }) {
  const maximum = Math.max(
    1,
    ...activities.flatMap((activity) => [activity.newUploads, activity.editedUploads]),
  );

  return (
    <figure
      aria-label="신규/수정 콘텐츠 업로드 추이"
      className="fuma-content-upload-trend fuma-content-performance-panel"
    >
      <figcaption>
        <div>
          <span>ACTIVITY</span>
          <h2>신규/수정 콘텐츠 업로드 추이</h2>
        </div>
        <ul aria-label="차트 범례">
          <li><i className="is-new" />신규 콘텐츠</li>
          <li><i className="is-edited" />수정 콘텐츠</li>
        </ul>
      </figcaption>
      {activities.length > 0 ? (
        <div className="fuma-content-upload-trend__scroll">
          <div
            className="fuma-content-upload-trend__plot"
            style={{ minWidth: `${Math.max(activities.length * 44, 560)}px` }}
          >
            <span aria-hidden="true" className="fuma-content-upload-trend__axis" />
            {activities.map((activity) => (
              <div
                className="fuma-content-upload-trend__point"
                data-activity-date={activity.activityDate}
                key={activity.activityDate}
              >
                <div className="fuma-content-upload-trend__half is-new">
                  <span
                    aria-label={`${activity.activityDate} 신규 콘텐츠 ${activity.newUploads}건`}
                    role="img"
                    style={{ height: `${(activity.newUploads / maximum) * 100}%` }}
                  >
                    <b>{activity.newUploads}</b>
                  </span>
                </div>
                <div className="fuma-content-upload-trend__half is-edited">
                  <span
                    aria-label={`${activity.activityDate} 수정 콘텐츠 ${activity.editedUploads}건`}
                    role="img"
                    style={{ height: `${(activity.editedUploads / maximum) * 100}%` }}
                  >
                    <b>{activity.editedUploads}</b>
                  </span>
                </div>
                <time dateTime={activity.activityDate}>{trendDateLabel(activity.activityDate)}</time>
              </div>
            ))}
          </div>
        </div>
      ) : <p>조회 기간에 업로드 활동이 없습니다.</p>}
    </figure>
  );
}

function ContentPerformanceCard({ content }: { content: ContentInfluence }) {
  const [flipped, setFlipped] = useState(false);
  const detailId = useId();
  const media = contentMediaFor(content);
  const author = creatorNameById(content.creatorId);
  const platform = content.platform === "YouTube" ? "YouTube" : "Instagram";
  const showPlay = content.contentFormat === "유튜브 롱폼"
    || content.contentFormat === "유튜브 쇼츠"
    || content.contentFormat === "인스타 릴스";

  return (
    <article
      aria-label={`${author} ${content.title} 성과 카드`}
      className="fuma-content-collection__card fuma-creator-card fuma-content-performance-card"
      data-content-format={contentCollectionFormatKey(content.contentFormat)}
      data-flipped={flipped}
    >
      <div className="fuma-content-performance-card__inner">
        <div
          className="fuma-content-performance-card__face fuma-content-performance-card__front"
          hidden={flipped}
        >
          <ContentCollectionCard
            author={author}
            badgeLabel={selectorCohortById(content.selectorId)}
            caption={content.caption}
            footerEnd={<span className="fuma-content-performance-card__hint">성과 보기</span>}
            footerStart={content.publishedAt}
            mediaAlt={`${content.title} 썸네일`}
            mediaUrl={media.thumbnail}
            platform={platform}
            profileImageUrl={media.creatorImage}
            showPlay={showPlay}
            status={(
              <StatusPill className="fuma-content-collection__inspection-status" tone="neutral">
                {content.contentFormat}
              </StatusPill>
            )}
            title={content.title}
          />
        </div>
        <div
          className="fuma-content-performance-card__face fuma-content-performance-card__back"
          hidden={!flipped}
          id={detailId}
        >
          <header>
            <span>{content.id}</span>
            <strong>{author}</strong>
          </header>
          <h3>조회 및 반응 추이</h3>
          <dl>
            <div><dt>누적 조회수</dt><dd>{content.views > 0 ? formatCount(content.views) : "-"}</dd></div>
            <div><dt>누적 좋아요</dt><dd>{formatCount(content.likes)}</dd></div>
          </dl>
          <section aria-label="조회수 날짜별 추이">
            <strong>조회수 추이</strong>
            <ContentTrendGraph
              label="조회수"
              recordedAt={content.viewsTrend.map((point) => point.recordedAt)}
              tone="views"
              values={content.viewsTrend.map((point) => point.views)}
            />
          </section>
          <section aria-label="좋아요 날짜별 추이">
            <strong>좋아요 추이</strong>
            <ContentTrendGraph
              label="좋아요 수"
              recordedAt={content.reactionTrend.map((point) => point.recordedAt)}
              tone="likes"
              values={content.reactionTrend.map((point) => point.likes)}
            />
          </section>
          <span className="fuma-content-performance-card__return">다시 클릭하면 콘텐츠로 돌아갑니다.</span>
        </div>
      </div>
      <button
        aria-controls={detailId}
        aria-expanded={flipped}
        aria-label={`${author} ${content.title} 성과 상세 보기`}
        aria-pressed={flipped}
        className="fuma-content-performance-card__trigger"
        onClick={() => setFlipped((current) => !current)}
        type="button"
      />
    </article>
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
      id: "selector",
      header: "셀렉터스",
      width: 160,
      render: (content) => {
        const media = contentMediaFor(content);
        return (
          <div className="fuma-content-reaction-table__channel">
            <img alt="" src={assetUrl(media.creatorImage)} />
            <span><strong>{creatorNameById(content.creatorId)}</strong></span>
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
      id: "viewTrend",
      header: "조회수 추이",
      width: 176,
      render: (content) => (
        <ContentTrendGraph
          label="조회수"
          recordedAt={content.viewsTrend.map((point) => point.recordedAt)}
          tone="views"
          values={content.viewsTrend.map((point) => point.views)}
        />
      ),
    },
    {
      id: "likeTrend",
      header: "좋아요 수 추이",
      width: 176,
      render: (content) => (
        <ContentTrendGraph
          label="좋아요 수"
          recordedAt={content.reactionTrend.map((point) => point.recordedAt)}
          tone="likes"
          values={content.reactionTrend.map((point) => point.likes)}
        />
      ),
    },
  ];
}

function ContentPerformanceResults({
  contents,
  onPageChange,
  page,
}: {
  contents: readonly ContentInfluence[];
  onPageChange: (page: number) => void;
  page: number;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const {
    currentPage,
    pagedItems: pagedContents,
    totalPages,
  } = paginate(contents, page, CONTENT_PERFORMANCE_PAGE_SIZE);
  const changeView = (nextView: "grid" | "list") => {
    setViewMode(nextView);
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
          <SegmentedControl
            ariaLabel="보기 방식"
            onChange={changeView}
            options={[
              { label: "카드", value: "grid" },
              { label: "목록", value: "list" },
            ]}
            value={viewMode}
          />
        )}
        className="fuma-simple-result-toolbar fuma-campaign-result-toolbar"
        meta={<span>총 {contents.length}건</span>}
        title="콘텐츠 성과 및 추이"
      />
      {pagedContents.length === 0 ? (
        <EmptyState title="검색 결과가 없습니다." />
      ) : viewMode === "grid" ? (
        <div className="fuma-content-collection__track is-grid">
          {pagedContents.map((content) => (
            <ContentPerformanceCard content={content} key={content.id} />
          ))}
        </div>
      ) : (
        <div
          aria-label="콘텐츠 성과 목록"
          className="fuma-wide-table fuma-content-collection__list"
          role="region"
        >
          <DenseTable
            columns={contentPerformanceColumns(contents)}
            rowKey={(content) => content.id}
            rows={pagedContents}
          />
        </div>
      )}
      <Pagination
        onPageChange={onPageChange}
        page={currentPage}
        pageSize={CONTENT_PERFORMANCE_PAGE_SIZE}
        totalPages={totalPages}
      />
    </section>
  );
}

export function ContentPerformanceDashboard({
  activities,
  cohortContents,
  contents,
  highlightedCohort,
  onPageChange,
  page,
}: {
  activities: readonly ContentUploadActivity[];
  cohortContents: readonly ContentInfluence[];
  contents: readonly ContentInfluence[];
  highlightedCohort: string;
  onPageChange: (page: number) => void;
  page: number;
}) {
  return (
    <>
      <ContentOverview
        cohortContents={cohortContents}
        contents={contents}
        highlightedCohort={highlightedCohort}
      />
      <UploadActivityChart activities={activities} />
      <ContentPerformanceResults contents={contents} onPageChange={onPageChange} page={page} />
    </>
  );
}
