import type { ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { EditorFrame } from "../../components/content/EditorFrame";
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
  VIOLATIONS,
  findContentReviewFixture,
  type ContentReviewFixture,
  type ContentSnapshot,
  type ProcessingState,
  type ReviewStatus,
  type ViolationFixture,
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
const VIOLATION_TYPE_OPTIONS = [
  "전체",
  "상품 링크 누락",
  "필수 광고 표기 누락",
  "허위·과장 표현",
].map((label) => ({ label, value: label === "전체" ? "" : label }));
const VIOLATION_PROCESSING_OPTIONS = ["전체", "미처리", "처리 중", "처리 완료"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);

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

function BasicInformation({ content }: { content: ContentReviewFixture }) {
  const fields: Array<[string, ReactNode]> = [
    ["콘텐츠 ID", content.id],
    ["검수 유형", REVIEW_TYPE_LABELS[content.reviewType]],
    ["작성자", content.author],
    ["기수", content.cohort],
    ["플랫폼", content.sourcePlatform],
    ["제출 시각", content.submittedAt],
    ["AI 상태", content.aiStatus === "ready" ? "생성완료" : "생성 대기"],
    ["검수 상태", content.reviewStatus],
    ["처리 상태", content.processingState],
    ["위반 유형", content.violationType ?? "-"],
  ];

  return (
    <section aria-label="기본 정보" className="fuma-content-section">
      <header className="fuma-content-section__header">
        <h2>기본 정보</h2>
      </header>
      <dl className="fuma-key-value-grid">
        {fields.map(([label, value]) => (
          <div className="fuma-key-value-grid__item" key={label}>
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
  snapshot: ContentSnapshot | null;
}

function SnapshotPanel({ ariaLabel, snapshot }: SnapshotPanelProps) {
  return (
    <section aria-label={ariaLabel} className="fuma-content-snapshot">
      <header className="fuma-content-snapshot__header">
        <strong>{ariaLabel}</strong>
        {snapshot ? (
          <span className="fuma-content-snapshot__meta">
            <span>{snapshot.label}</span>
            <time dateTime={snapshot.capturedAt.replace(" ", "T")}>
              {snapshot.capturedAt}
            </time>
          </span>
        ) : null}
      </header>
      {snapshot ? (
        <div className="fuma-content-snapshot__body">
          <EditorFrame label={snapshot.label} text={snapshot.text} />
          <div className="fuma-content-snapshot__urls">
            <strong>URL</strong>
            <ul>
              {snapshot.urls.map((url) => (
                <li key={url}>{url}</li>
              ))}
            </ul>
          </div>
          <MediaTiles
            count={snapshot.mediaCount}
            kinds={snapshot.mediaKinds}
            label={snapshot.label}
          />
        </div>
      ) : (
        <EmptyState
          description="신규 콘텐츠는 최초 수집 원본만 검수합니다."
          title="이전 스냅샷이 없습니다."
        />
      )}
    </section>
  );
}

function ChangeSummary({ items }: { items: string[] }) {
  return (
    <section aria-label="변경 요약" className="fuma-content-change-strip">
      <strong>변경 요약</strong>
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
    <section aria-label="AI 검수 요약" className="fuma-content-section fuma-content-ai-summary">
      <header className="fuma-content-section__header">
        <h2>AI 검수 요약</h2>
        <StatusPill tone={ready ? "approved" : "pending"}>
          {ready ? "생성완료" : "생성 대기"}
        </StatusPill>
      </header>
      <div className="fuma-content-ai-summary__body">
        <p>{content.aiSummary}</p>
        <div>
          <strong>감지 항목</strong>
          <ul>
            {content.detectedIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ReviewActions({ actions }: { actions: string[] }) {
  return (
    <section aria-label="검수 처리" className="fuma-content-review-actions">
      <strong>검수 처리</strong>
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
                목록
              </Link>
            </div>
            <div aria-label="검수 상태 요약" className="fuma-content-status-toolbar" role="group">
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
            <BasicInformation content={content} />
            <div className="fuma-content-comparison">
              <SnapshotPanel ariaLabel="이전 콘텐츠" snapshot={content.previousSnapshot} />
              <SnapshotPanel ariaLabel="현재 콘텐츠" snapshot={content.currentSnapshot} />
            </div>
            <ChangeSummary items={content.changeItems} />
            <ContentAiSummary content={content} />
            <ReviewActions actions={content.availableActions} />
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

function noticeStatusTone(
  status: ViolationFixture["noticeStatus"],
): NonNullable<StatusPillProps["tone"]> {
  if (status === "발송 완료") return "approved";
  if (status === "발송 대기") return "pending";
  if (status === "발송 실패") return "rejected";
  return "neutral";
}

function violationProcessingTone(
  status: ViolationFixture["processingState"],
): NonNullable<StatusPillProps["tone"]> {
  if (status === "처리 완료") return "approved";
  if (status === "처리 중") return "pending";
  return "neutral";
}

const VIOLATION_COLUMNS: DenseTableColumn<ViolationFixture>[] = [
  { key: "id", header: "위반 ID", width: 70 },
  { key: "cohort", header: "기수", width: 46, align: "center" },
  { key: "selectorName", header: "셀렉터스", width: 70 },
  { key: "contentId", header: "콘텐츠 ID", width: 74 },
  { key: "violationType", header: "위반 유형", width: 126 },
  { key: "noticeText", header: "안내 문구", width: 330 },
  {
    key: "noticeStatus",
    header: "안내 상태",
    width: 74,
    align: "center",
    render: (violation) => (
      <StatusPill tone={noticeStatusTone(violation.noticeStatus)}>
        {violation.noticeStatus}
      </StatusPill>
    ),
  },
  {
    key: "processingState",
    header: "처리 상태",
    width: 74,
    align: "center",
    render: (violation) => (
      <StatusPill tone={violationProcessingTone(violation.processingState)}>
        {violation.processingState}
      </StatusPill>
    ),
  },
  {
    key: "accumulatedPenalties",
    header: "누적 패널티",
    width: 126,
    align: "center",
    render: (violation) => (
      <div className="fuma-violation-penalty">
        <strong>{violation.accumulatedPenalties}</strong>
        {violation.accumulatedPenalties >= 3 ? <span>차기 기수 활동 불가</span> : null}
      </div>
    ),
  },
  {
    id: "management",
    header: "관리",
    width: 150,
    align: "center",
    render: (violation) => (
      <div className="fuma-table-actions">
        <Button
          aria-label={`${violation.selectorName} 위반사항 안내`}
          className="fuma-table-action"
        >
          위반사항 안내
        </Button>
        <Button
          aria-label={`${violation.selectorName} 패널티 부여`}
          className="fuma-table-action"
        >
          패널티 부여
        </Button>
      </div>
    ),
  },
];

export function ContentViolationPage() {
  return (
    <section className="fuma-page">
      <PageHeader screenCode="CT201" title="위반 콘텐츠 관리" />
      <div className="fuma-page__body">
        <SearchPanel actions={<SearchActions />}>
          <FilterField htmlFor="violation-cohort" label="기수">
            <Select id="violation-cohort" options={COHORT_OPTIONS} />
          </FilterField>
          <FilterField htmlFor="violation-type" label="위반 유형">
            <Select id="violation-type" options={VIOLATION_TYPE_OPTIONS} />
          </FilterField>
          <FilterField htmlFor="violation-processing" label="처리 상태">
            <Select id="violation-processing" options={VIOLATION_PROCESSING_OPTIONS} />
          </FilterField>
        </SearchPanel>
        <p className="fuma-violation-guide">
          패널티 3회 이상 누적 시 차기 기수 셀렉터스 활동이 제한됩니다.
        </p>
        <div className="fuma-result-toolbar">
          <strong>위반 콘텐츠 목록</strong>
          <span>총 {VIOLATIONS.length}건</span>
        </div>
        <div
          aria-label="위반 콘텐츠 목록"
          className="fuma-wide-table fuma-violation-table"
          role="region"
        >
          <DenseTable
            columns={VIOLATION_COLUMNS}
            rowKey={(violation) => violation.id}
            rows={[...VIOLATIONS]}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
  );
}
