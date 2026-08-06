import type { ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  AudioLines,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ScanText,
} from "lucide-react";
import "../../styles/content-review.css";
import { MediaTiles } from "../../components/content/MediaTiles";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Checkbox, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import {
  CONTENT_REVIEWS,
  REVIEW_TYPE_LABELS,
  findContentReviewFixture,
  type ContentAnnotation,
  type ContentReviewFixture,
  type ContentSnapshot,
  type ProcessingState,
  type ReviewStatus,
} from "./fixtures";

const COHORT_OPTIONS = ["전체", "3기", "2기"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const REVIEW_TYPE_OPTIONS = ["전체", "신규 콘텐츠", "위반 수정본", "일반 수정본"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
const PLATFORM_OPTIONS = ["전체", "Instagram", "YouTube"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const REVIEW_STATUS_OPTIONS = ["전체", "검수 대기", "수정 요청", "승인", "위반 확정"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
const PROCESSING_OPTIONS = ["전체", "미처리", "안내 대기", "처리 완료"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const VIOLATION_FILTER_OPTIONS = ["전체", "위반 콘텐츠", "일반 콘텐츠"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));

interface FilterFieldProps {
  children: ReactNode;
  htmlFor: string;
  label: string;
}

function FilterField({ children, htmlFor, label }: FilterFieldProps) {
  return (
    <label className="fuma-filter-field" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function SearchActions() {
  return (
    <>
      <Button variant="primary">조회</Button>
      <Button>초기화</Button>
    </>
  );
}

function reviewStatusTone(status: ReviewStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "승인") return "approved";
  if (status === "검수 대기") return "pending";
  return "rejected";
}

function processingTone(status: ProcessingState): NonNullable<StatusPillProps["tone"]> {
  if (status === "처리 완료") return "approved";
  if (status === "안내 대기") return "pending";
  return "neutral";
}

function QueueFilters() {
  return (
    <SearchPanel actions={<SearchActions />}>
      <FilterField htmlFor="content-review-keyword" label="콘텐츠/작성자">
        <TextInput
          aria-label="콘텐츠/작성자"
          id="content-review-keyword"
          placeholder="콘텐츠 ID 또는 작성자"
        />
      </FilterField>
      <FilterField htmlFor="content-review-cohort" label="기수">
        <Select id="content-review-cohort" options={COHORT_OPTIONS} />
      </FilterField>
      <FilterField htmlFor="content-review-type" label="검수 유형">
        <Select id="content-review-type" options={REVIEW_TYPE_OPTIONS} />
      </FilterField>
      <FilterField htmlFor="content-review-platform" label="플랫폼">
        <Select id="content-review-platform" options={PLATFORM_OPTIONS} />
      </FilterField>
      <FilterField htmlFor="content-review-status" label="검수 상태">
        <Select id="content-review-status" options={REVIEW_STATUS_OPTIONS} />
      </FilterField>
      <FilterField htmlFor="content-review-violation" label="위반 필터">
        <Select id="content-review-violation" options={VIOLATION_FILTER_OPTIONS} />
      </FilterField>
      <FilterField htmlFor="content-review-processing" label="처리 상태">
        <Select id="content-review-processing" options={PROCESSING_OPTIONS} />
      </FilterField>
    </SearchPanel>
  );
}

function queueColumns(noSelection: boolean): DenseTableColumn<ContentReviewFixture>[] {
  return [
    {
      id: "selection",
      header: "선택",
      width: 46,
      align: "center",
      render: (content) => (
        <Checkbox
          defaultChecked={!noSelection && content.id === "ct-001"}
          label={<span className="hsas-visually-hidden">{content.id} 선택</span>}
        />
      ),
    },
    { key: "id", header: "콘텐츠 ID", width: 76 },
    {
      key: "reviewType",
      header: "검수 유형",
      width: 92,
      render: (content) => REVIEW_TYPE_LABELS[content.reviewType],
    },
    { key: "author", header: "작성자", width: 72 },
    { key: "cohort", header: "기수", width: 50, align: "center" },
    { key: "sourcePlatform", header: "플랫폼", width: 82, align: "center" },
    { key: "submittedAt", header: "제출 시각", width: 126, align: "center" },
    {
      key: "aiStatus",
      header: "AI 상태",
      width: 72,
      align: "center",
      render: (content) => (
        <StatusPill tone={content.aiStatus === "ready" ? "approved" : "pending"}>
          {content.aiStatus === "ready" ? "생성완료" : "생성 대기"}
        </StatusPill>
      ),
    },
    {
      key: "violationType",
      header: "위반 유형",
      width: 132,
      render: (content) => content.violationType ?? "-",
    },
    {
      key: "reviewStatus",
      header: "검수 상태",
      width: 78,
      align: "center",
      render: (content) => (
        <StatusPill tone={reviewStatusTone(content.reviewStatus)}>
          {content.reviewStatus}
        </StatusPill>
      ),
    },
    {
      key: "processingState",
      header: "처리 상태",
      width: 78,
      align: "center",
      render: (content) => (
        <StatusPill tone={processingTone(content.processingState)}>
          {content.processingState}
        </StatusPill>
      ),
    },
    {
      id: "detail",
      header: "상세",
      width: 58,
      align: "center",
      render: (content) => (
        <Link
          aria-label={`${content.id} 상세 보기`}
          className="fuma-table-action fuma-table-link"
          to={`/content/reviews/${content.id}`}
        >
          보기
        </Link>
      ),
    },
  ];
}

export function ContentReviewListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const noSelection = searchParams.get("fixture") === "no-selection";

  return (
    <section className="fuma-page" data-visual-contract="content-review">
      <PageHeader screenCode="CT101" title="콘텐츠 검수" />
      <div className="fuma-page__body">
        <QueueFilters />
        <div className="fuma-result-toolbar">
          <strong>콘텐츠 검수 대기열</strong>
          <span>총 {CONTENT_REVIEWS.length}건</span>
          <div className="fuma-result-toolbar__actions">
            <span>{noSelection ? "선택된 콘텐츠가 없습니다." : "선택 1건"}</span>
            <Button disabled={noSelection} variant="primary">
              선택 콘텐츠 검수
            </Button>
          </div>
        </div>
        {noSelection ? (
          <p className="fuma-content-selection-guide">검수할 콘텐츠를 선택해 주세요.</p>
        ) : null}
        <div
          aria-label="콘텐츠 검수 대기열"
          className="fuma-wide-table fuma-content-review-table"
          key={noSelection ? "no-selection" : "default-selection"}
          role="region"
        >
          <DenseTable
            columns={queueColumns(noSelection)}
            onRowClick={(content) => navigate(`/content/reviews/${content.id}`)}
            rowKey={(content) => content.id}
            rows={[...CONTENT_REVIEWS]}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
  );
}

function ReviewCaseHeader({ content }: { content: ContentReviewFixture }) {
  const facts: Array<[string, ReactNode]> = [
    ["콘텐츠 ID", content.id],
    ["작성자", content.author],
    ["기수", content.cohort],
    ["플랫폼", content.sourcePlatform],
    ["제출 시각", content.submittedAt],
    ["AI 상태", content.aiStatus === "ready" ? "생성완료" : "생성 대기"],
    ["위반 유형", content.violationType ?? "-"],
  ];

  return (
    <section aria-label="기본 정보" className="fuma-review-case">
      <div className="fuma-review-case__identity">
        <span>{content.sourcePlatform} · {content.id}</span>
        <h2>{content.author} · 콘텐츠 검수</h2>
        <p>{content.cohort} 셀렉터스가 제출한 SNS 원문과 자동 추출 근거를 확인합니다.</p>
      </div>
      <div aria-label="검수 상태 요약" className="fuma-review-case__status" role="group">
        <span>검수 유형</span>
        <StatusPill tone="neutral">{REVIEW_TYPE_LABELS[content.reviewType]}</StatusPill>
        <span>검수 상태</span>
        <StatusPill tone={reviewStatusTone(content.reviewStatus)}>
          {content.reviewStatus}
        </StatusPill>
        <span>처리 상태</span>
        <StatusPill tone={processingTone(content.processingState)}>
          {content.processingState}
        </StatusPill>
      </div>
      <dl className="fuma-review-case__facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

interface SnapshotPanelProps {
  ariaLabel: string;
  author: string;
  platform: string;
  snapshot: ContentSnapshot;
}

type NumberedAnnotation = ContentAnnotation & { ordinal: number };

function getActiveAnnotations(snapshot: ContentSnapshot): NumberedAnnotation[] {
  return (snapshot.annotations ?? [])
    .filter((annotation) => annotation.state === "active")
    .map((annotation, index) => ({ ...annotation, ordinal: index + 1 }));
}

function findOccurrence(text: string, quote: string, occurrence: number) {
  if (!quote) return -1;

  let start = -1;
  let cursor = 0;
  for (let index = 0; index < Math.max(1, occurrence); index += 1) {
    start = text.indexOf(quote, cursor);
    if (start < 0) return -1;
    cursor = start + quote.length;
  }
  return start;
}

function annotationDescriptionId(annotation: NumberedAnnotation) {
  return `fuma-review-annotation-${annotation.id}`;
}

function renderAnnotatedText(text: string, annotations: NumberedAnnotation[]) {
  const ranges = annotations
    .flatMap((annotation) => {
      if (annotation.target.kind !== "text") return [];
      const start = findOccurrence(
        text,
        annotation.target.quote,
        annotation.target.occurrence,
      );
      return start < 0
        ? []
        : [{
            annotation,
            end: start + annotation.target.quote.length,
            start,
          }];
    })
    .sort((left, right) => left.start - right.start);

  if (ranges.length === 0) return text;

  const result: ReactNode[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    if (range.start > cursor) result.push(text.slice(cursor, range.start));
    const descriptionId = annotationDescriptionId(range.annotation);
    result.push(
      <mark
        aria-describedby={descriptionId}
        className="fuma-review-text-violation"
        data-ordinal={range.annotation.ordinal}
        data-severity={range.annotation.severity}
        key={range.annotation.id}
      >
        {text.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  }
  if (cursor < text.length) result.push(text.slice(cursor));
  return result;
}

function AnnotationNotes({ annotations }: { annotations: NumberedAnnotation[] }) {
  if (annotations.length === 0) return null;

  return (
    <div className="fuma-review-annotation-notes">
      {annotations.map((annotation) => (
        <aside
          aria-label={`위반 안내 ${annotation.ordinal}`}
          className="fuma-review-annotation-note"
          data-severity={annotation.severity}
          key={annotation.id}
          role="note"
        >
          <header>
            <span aria-hidden="true" className="fuma-review-annotation-note__number">
              {annotation.ordinal}
            </span>
            <div>
              <strong>{annotation.title}</strong>
              <span>{annotation.location}</span>
            </div>
          </header>
          <p>{annotation.reason}</p>
          <div className="fuma-review-annotation-note__guidance">
            <strong>수정 안내</strong>
            <p>{annotation.guidance}</p>
          </div>
          <span className="fuma-review-annotation-note__source">{annotation.source}</span>
        </aside>
      ))}
    </div>
  );
}

function SnapshotPanel({ ariaLabel, author, platform, snapshot }: SnapshotPanelProps) {
  const activeAnnotations = getActiveAnnotations(snapshot);
  const mediaAnnotations = activeAnnotations.filter(
    (annotation) => annotation.target.kind === "media",
  );
  const textAnnotations = activeAnnotations.filter(
    (annotation) => annotation.target.kind === "text",
  );
  const urlAnnotations = activeAnnotations.filter(
    (annotation) => annotation.target.kind === "url",
  );

  return (
    <section aria-label={ariaLabel} className="fuma-review-post">
      <header className="fuma-review-post__version">
        <div>
          <span>{ariaLabel}</span>
          <strong>{snapshot.label}</strong>
        </div>
        <time dateTime={snapshot.capturedAt.replace(" ", "T")}>
          {snapshot.capturedAt}
        </time>
      </header>
      <article
        className={`fuma-review-post__preview${activeAnnotations.length > 0 ? " fuma-review-post__preview--annotated" : ""}`}
      >
        <header className="fuma-review-post__profile">
          <span aria-hidden="true" className="fuma-review-post__avatar">
            {author.slice(0, 1)}
          </span>
          <div>
            <strong>{author}</strong>
            <span>{platform} · 수집 원문</span>
          </div>
          <span className="fuma-review-post__platform">{platform}</span>
        </header>
        <div className="fuma-review-post__content-row">
          <MediaTiles
            count={snapshot.mediaCount}
            kinds={snapshot.mediaKinds}
            label={snapshot.label}
            markers={mediaAnnotations.flatMap((annotation) =>
              annotation.target.kind === "media"
                ? [{
                    box: annotation.target.box,
                    mediaIndex: annotation.target.mediaIndex,
                    ordinal: annotation.ordinal,
                    severity: annotation.severity,
                  }]
                : [],
            )}
            urls={snapshot.mediaUrls}
          />
          <AnnotationNotes annotations={mediaAnnotations} />
        </div>
        <div className="fuma-review-post__content-row">
          <div className="fuma-review-post__caption">
            <span>게시물 본문</span>
            <section aria-label={`${snapshot.label} 본문`} className="fuma-editor-frame">
              <p className="fuma-editor-frame__text">
                {renderAnnotatedText(snapshot.text, textAnnotations)}
              </p>
            </section>
          </div>
          <AnnotationNotes annotations={textAnnotations} />
        </div>
        <div className="fuma-review-post__content-row">
          <div className="fuma-review-post__links">
            <span>연결 URL</span>
            <ul>
              {snapshot.urls.map((url, index) => {
                const markers = urlAnnotations.filter(
                  (annotation) =>
                    annotation.target.kind === "url" &&
                    annotation.target.targetIndex === index,
                );
                return (
                  <li
                    className={markers.length > 0 ? "fuma-review-post__link--violation" : undefined}
                    key={url}
                  >
                    {markers.map((annotation) => (
                      <span
                        aria-label={`위반 위치 ${annotation.ordinal}`}
                        className="fuma-review-annotation-pin fuma-review-post__link-pin"
                        data-severity={annotation.severity}
                        key={annotation.id}
                      >
                        {annotation.ordinal}
                      </span>
                    ))}
                    <a href={url} rel="noreferrer" target="_blank">
                      <span>{url}</span>
                      <ExternalLink aria-hidden="true" size={13} strokeWidth={1.8} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
          <AnnotationNotes annotations={urlAnnotations} />
        </div>
        {textAnnotations.map((annotation) => (
          <span
            className="hsas-visually-hidden"
            id={annotationDescriptionId(annotation)}
            key={annotation.id}
          >
            위반 위치 {annotation.ordinal}
          </span>
        ))}
      </article>
    </section>
  );
}

function ChangeSummary({ items }: { items: string[] }) {
  return (
    <section aria-label="변경 요약" className="fuma-review-changes">
      <strong>변경 감지</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function ContentAiSummary({ content }: { content: ContentReviewFixture }) {
  const ready = content.aiStatus === "ready";

  return (
    <section aria-label="AI 검수 요약" className="fuma-review-inspector__section">
      <header className="fuma-review-inspector__heading">
        <div>
          <span>자동 분석</span>
          <h2>점검 결과</h2>
        </div>
        <span className="fuma-review-inspector__generated">
          {ready ? "생성완료" : "생성 대기"}
        </span>
      </header>
      <p className="fuma-review-inspector__note">{content.aiSummary}</p>
      <ul className="fuma-review-signals">
        {content.report.signals.map((signal) => (
          <li data-tone={signal.tone} key={`${signal.title}-${signal.evidence}`}>
            <span aria-hidden="true" className="fuma-review-signals__icon">
              {signal.tone === "pass" ? (
                <CheckCircle2 size={16} strokeWidth={1.8} />
              ) : (
                <AlertTriangle size={16} strokeWidth={1.8} />
              )}
            </span>
            <div>
              <strong>{signal.title}</strong>
              <p>{signal.detail}</p>
              <span>{signal.source} · {signal.evidence}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="fuma-review-findings">
        <strong>{content.reviewType === "VIOLATION_CORRECTION" ? "이전 판정 근거" : "판정 근거"}</strong>
        <ul>
          {content.detectedIssues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ExtractionEvidence({ content }: { content: ContentReviewFixture }) {
  return (
    <section aria-label="추출 근거" className="fuma-review-inspector__section">
      <header className="fuma-review-inspector__heading">
        <div>
          <span>수집 근거</span>
          <h2>OCR · 음성 추출</h2>
        </div>
        <time dateTime={content.report.generatedAt.replace(" ", "T")}>
          {content.report.generatedAt}
        </time>
      </header>
      <ul className="fuma-review-extracts">
        {content.report.extracts.map((extract) => (
          <li key={`${extract.type}-${extract.location}-${extract.text}`}>
            <span aria-hidden="true">
              {extract.type === "OCR" ? (
                <ScanText size={15} strokeWidth={1.8} />
              ) : (
                <AudioLines size={15} strokeWidth={1.8} />
              )}
            </span>
            <div>
              <strong>{extract.type}</strong>
              <p>{extract.text}</p>
              <span>{extract.location}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewHistory({ content }: { content: ContentReviewFixture }) {
  return (
    <section aria-label="검수 이력" className="fuma-review-inspector__section">
      <header className="fuma-review-inspector__heading">
        <div>
          <span>활동</span>
          <h2>검수 이력</h2>
        </div>
      </header>
      <ol className="fuma-review-history">
        {content.report.history.map((event) => (
          <li key={`${event.at}-${event.label}`}>
            <Clock3 aria-hidden="true" size={14} strokeWidth={1.8} />
            <div>
              <strong>{event.label}</strong>
              <span>{event.actor} · {event.at}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReviewActions({ actions }: { actions: string[] }) {
  return (
    <section aria-label="검수 처리" className="fuma-review-decision">
      <div>
        <span>최종 판단</span>
        <strong>검수 결정</strong>
      </div>
      <div>
        {actions.map((action, index) => (
          <Button
            key={action}
            variant={index === 0 ? "primary" : index === actions.length - 1 ? "danger" : "secondary"}
          >
            {action}
          </Button>
        ))}
      </div>
    </section>
  );
}

export function ContentReviewDetailPage() {
  const { contentId } = useParams();
  const content = findContentReviewFixture(contentId);
  const hasActiveComparisonAnnotations = content?.previousSnapshot
    ? getActiveAnnotations(content.previousSnapshot).length > 0 ||
      getActiveAnnotations(content.currentSnapshot).length > 0
    : false;

  return (
    <section
      className="fuma-page fuma-content-review-detail"
      data-visual-contract="content-review"
    >
      <PageHeader screenCode="CT102" title="콘텐츠 검수 상세" />
      <div className="fuma-page__body">
        {content ? (
          <>
            <div className="fuma-detail-toolbar">
              <Link className="hsas-button fuma-detail-toolbar__link" to="/content/reviews">
                <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.8} />
                대기열
              </Link>
            </div>
            <ReviewCaseHeader content={content} />
            <div className="fuma-review-workbench">
              <section aria-label="수집된 SNS 콘텐츠" className="fuma-review-source">
                <header className="fuma-review-source__header">
                  <div>
                    <span>검수 대상</span>
                    <h2>수집된 SNS 콘텐츠</h2>
                  </div>
                  <span>{content.previousSnapshot ? "이전·현재 버전 비교" : "최초 수집 원본"}</span>
                </header>
                {content.previousSnapshot ? <ChangeSummary items={content.changeItems} /> : null}
                <div
                  className={`fuma-content-comparison${content.previousSnapshot ? "" : " fuma-content-comparison--single"}${hasActiveComparisonAnnotations ? " fuma-content-comparison--stacked" : ""}`}
                >
                  {content.previousSnapshot ? (
                    <SnapshotPanel
                      ariaLabel="이전 콘텐츠"
                      author={content.author}
                      platform={content.sourcePlatform}
                      snapshot={content.previousSnapshot}
                    />
                  ) : null}
                  <SnapshotPanel
                    ariaLabel="현재 콘텐츠"
                    author={content.author}
                    platform={content.sourcePlatform}
                    snapshot={content.currentSnapshot}
                  />
                </div>
              </section>
              <aside aria-label="검수 패널" className="fuma-review-inspector">
                <ContentAiSummary content={content} />
                <ExtractionEvidence content={content} />
                <ReviewHistory content={content} />
                <ReviewActions actions={content.availableActions} />
              </aside>
            </div>
          </>
        ) : (
          <EmptyState
            description="요청한 콘텐츠 검수 정보를 확인해 주세요."
            title="대상을 찾을 수 없습니다."
          />
        )}
      </div>
    </section>
  );
}
