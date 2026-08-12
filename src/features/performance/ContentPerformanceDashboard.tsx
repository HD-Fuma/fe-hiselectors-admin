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

function ContentOverview({
  cohortContents,
  contents,
  highlightedCohort,
}: {
  cohortContents: readonly ContentInfluence[];
  contents: readonly ContentInfluence[];
  highlightedCohort: string;
}) {
  const cohortMetrics = new Map<string, { contentCount: number; views: number }>();

  cohortContents.forEach((content) => {
    const cohort = selectorCohortById(content.selectorId);
    const current = cohortMetrics.get(cohort) ?? { contentCount: 0, views: 0 };
    cohortMetrics.set(cohort, {
      contentCount: current.contentCount + 1,
      views: current.views + content.views,
    });
  });

  const cohorts = [...cohortMetrics].map(([cohort, metric]) => ({ cohort, ...metric }));
  const maximumViews = Math.max(1, ...cohorts.map((cohort) => cohort.views));
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

      <figure
        aria-label="기수별 콘텐츠 성과"
        className="fuma-content-performance-panel fuma-content-cohort-chart"
      >
        <figcaption>
          <div>
            <span>COHORT</span>
            <h2>기수별 콘텐츠 성과</h2>
          </div>
          <small>누적 조회수 · {highlightedCohort || "현재 기수"} 강조</small>
        </figcaption>
        {cohorts.length > 0 ? (
          <div className="fuma-content-cohort-chart__scroll">
            <ul>
              {cohorts.map((cohort) => {
                const height = cohort.views === 0 ? 0 : Math.max(5, (cohort.views / maximumViews) * 100);
                const highlighted = cohort.cohort === highlightedCohort;
                return (
                  <li data-highlighted={highlighted} key={cohort.cohort}>
                    <strong title={`${formatCount(cohort.views)}회`}>{formatCount(cohort.views)}</strong>
                    <i aria-hidden="true"><span style={{ height: `${height}%` }} /></i>
                    <b>{cohort.cohort}</b>
                    <small>{cohort.contentCount}건{highlighted ? " · 선택" : ""}</small>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : <p>표시할 기수별 콘텐츠가 없습니다.</p>}
      </figure>

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
