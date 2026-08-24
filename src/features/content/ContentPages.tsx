import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Captions,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Images,
  Maximize,
  MessageCircle,
  MoreHorizontal,
  Play,
  Repeat2,
  RefreshCw,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import "../../styles/content-inspection.css";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { ContentCollectionCard } from "../../components/ui/ContentCollectionCard";
import { contentCollectionFormatKey } from "../../components/ui/contentCollectionFormat";
import { CreatorProfilePhoto } from "../../components/ui/CreatorProfilePhoto";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { ViewModeToggle, type ViewMode } from "../../components/ui/ViewModeToggle";
import { paginate } from "../../lib/pagination";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { SOCIAL_PLATFORM_FILTER_OPTIONS } from "../../components/social/platforms";
import {
  INSPECTION_TYPE_LABELS,
  adaptContentInspection,
  getCurrentGenerationContents,
  runContentBatch,
  type ContentAnnotation,
  type ContentAnnotationTarget,
  type ContentBatchRunResponse,
  type ContentInspectionFixture,
  type ContentSnapshot,
  type InspectionStatus,
} from "../../entities/content";

const CONTENT_INSPECTION_PAGE_SIZE = 20;
type ContentInspectionCategory = "신규" | "수정" | "검수 완료";

interface QueueFilterValues {
  keyword: string;
  platform: string;
}

const CONTENT_INSPECTION_CATEGORIES: readonly ContentInspectionCategory[] = [
  "신규",
  "수정",
  "검수 완료",
];

function contentInspectionCategory(content: ContentInspectionFixture): ContentInspectionCategory {
  if (content.inspectionStatus === "승인" || content.inspectionStatus === "위반 확정") return "검수 완료";
  if (content.inspectionType !== "NEW") return "수정";
  return "신규";
}

function contentInspectionCategoryTone(
  category: ContentInspectionCategory,
): NonNullable<StatusPillProps["tone"]> {
  if (category === "검수 완료") return "approved";
  if (category === "수정") return "pending";
  return "neutral";
}

function inspectionStatusTone(status: InspectionStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "승인") return "approved";
  if (status === "검수 대기") return "pending";
  return "rejected";
}

function contentPlatform(platform: string) {
  return platform === "YouTube" ? "YouTube" : "Instagram";
}

function QueueFilters({
  appliedFilters,
  onApply,
  onReset,
}: {
  appliedFilters: QueueFilterValues;
  onApply: (filters: QueueFilterValues) => void;
  onReset: () => void;
}) {
  const [keyword, setKeyword] = useState(appliedFilters.keyword);
  const [platform, setPlatform] = useState(appliedFilters.platform);

  const applyFilters = () => onApply({ keyword, platform });
  const resetFilters = () => {
    setKeyword("");
    setPlatform("");
    onReset();
  };
  const applyOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilters();
    }
  };

  return (
    <div className="fuma-operations-search fuma-settlement-search fuma-content-inspection-search">
      <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
        <FilterField htmlFor="content-inspection-keyword" label="콘텐츠/작성자">
          <TextInput
            aria-label="콘텐츠/작성자"
            id="content-inspection-keyword"
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={applyOnEnter}
            placeholder="콘텐츠 ID 또는 작성자"
            value={keyword}
          />
        </FilterField>
        <FilterField htmlFor="content-inspection-platform" label="플랫폼">
          <Select
            id="content-inspection-platform"
            onChange={(event) => setPlatform(event.target.value)}
            options={SOCIAL_PLATFORM_FILTER_OPTIONS}
            value={platform}
          />
        </FilterField>
      </SearchPanel>
    </div>
  );
}

function inspectionRequiredContents(contents: readonly ContentInspectionFixture[]) {
  return contents
    .filter((content) => content.inspectionStatus === "검수 대기")
    .slice()
    .reverse();
}

function CollectionCard({
  content,
  onSelect,
}: {
  content: ContentInspectionFixture;
  onSelect: (content: ContentInspectionFixture) => void;
}) {
  const snapshot = content.currentSnapshot;
  const mainMedia = snapshot.mediaUrls.find(Boolean);
  const issueCount = content.report.signals.filter((signal) => signal.tone !== "pass").length;
  const hasVideo = snapshot.mediaKinds[0] === "동영상";

  return (
    <button
      aria-label={`${content.author} ${content.contentTitle} 검수 상세 보기`}
      className="fuma-content-collection__card fuma-creator-card"
      data-content-format={contentCollectionFormatKey(content.contentFormat)}
      onClick={() => onSelect(content)}
      type="button"
    >
      <ContentCollectionCard
        author={content.author}
        badgeLabel={content.cohort}
        caption={snapshot.text}
        duration={content.duration}
        footerEnd={(
          <span
            className="fuma-content-collection__violation-count"
            data-has-violation={issueCount > 0}
          >
            {content.aiStatus === "pending"
              ? "분석 대기"
              : issueCount ? `위반 항목 ${issueCount}개` : "위반 항목 없음"}
          </span>
        )}
        footerStart={content.submittedAt.slice(0, 10)}
        mediaAlt={`${content.contentTitle} 썸네일`}
        mediaCount={snapshot.mediaCount}
        mediaUrl={mainMedia}
        platform={contentPlatform(content.sourcePlatform)}
        profileImageUrl={content.profileImageUrl ?? ""}
        showPlay={hasVideo}
        snsId={content.accountId}
        status={(
          <StatusPill
            className="fuma-content-collection__inspection-status"
            tone={inspectionStatusTone(content.inspectionStatus)}
          >
            {content.inspectionStatus}
          </StatusPill>
        )}
        title={content.contentTitle}
      />
    </button>
  );
}

function ContentInspectionCollection({
  contents,
  onChangeView,
  onChangeViolationOnly,
  onSelect,
  totalCount,
  violationOnly,
  viewMode,
}: {
  contents: readonly ContentInspectionFixture[];
  onChangeView: (viewMode: ViewMode) => void;
  onChangeViolationOnly: (violationOnly: boolean) => void;
  onSelect: (content: ContentInspectionFixture) => void;
  totalCount: number;
  violationOnly: boolean;
  viewMode: ViewMode;
}) {
  return (
    <section aria-label="수집 콘텐츠 목록" className="fuma-content-collection">
      <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-applicant-result-toolbar fuma-content-inspection-toolbar">
        <div className="fuma-applicant-minimum-filter">
          <label className="fuma-applicant-minimum-toggle">
            <input
              checked={violationOnly}
              onChange={(event) => onChangeViolationOnly(event.target.checked)}
              type="checkbox"
            />
            <span aria-hidden="true" />
            <b>위반 항목만</b>
          </label>
        </div>
        <div className="fuma-settlement-result-meta">
          <span>총 {totalCount}건</span>
        </div>
        <div className="fuma-creator-toolbar fuma-creator-toolbar__controls">
          <span aria-hidden="true" className="fuma-creator-toolbar__divider" />
          <ViewModeToggle
            onChange={onChangeView}
            value={viewMode}
          />
        </div>
      </div>
      {contents.length === 0 ? (
        <EmptyState title="검색 결과가 없습니다." />
      ) : viewMode === "grid" ? (
        <div className="fuma-content-collection__track is-grid">
          {contents.map((content) => <CollectionCard content={content} key={content.id} onSelect={onSelect} />)}
        </div>
      ) : (
        <div aria-label="수집 콘텐츠 리스트" className="fuma-wide-table fuma-content-collection__list" role="region">
          <DenseTable
            columns={queueColumns()}
            onRowClick={onSelect}
            rowKey={(content) => content.id}
            rows={[...contents]}
          />
        </div>
      )}
    </section>
  );
}

function ContentInspectionCategoryTabs({
  onStartInspection,
  pendingCount,
  selectedCategory,
  onSelect,
}: {
  onStartInspection: () => void;
  pendingCount: number;
  selectedCategory: ContentInspectionCategory;
  onSelect: (category: ContentInspectionCategory) => void;
}) {
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionResult, setCollectionResult] = useState<ContentBatchRunResponse | null>(
    null,
  );
  const [collectionError, setCollectionError] = useState<string | null>(null);

  const runContentCollection = async () => {
    setIsCollecting(true);
    setCollectionResult(null);
    setCollectionError(null);
    try {
      const result = await runContentBatch();
      setCollectionResult(result);
    } catch (error) {
      setCollectionError(
        error instanceof Error ? error.message : "콘텐츠 배치 실행에 실패했습니다.",
      );
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <>
      <ChoiceTabs
        actions={(
          <span className="fuma-content-collection-run-actions">
            <Button
              aria-label={isCollecting ? "콘텐츠 새로고침 중" : "콘텐츠 새로고침"}
              className="fuma-content-inspection-refresh-button"
              disabled={isCollecting}
              onClick={() => void runContentCollection()}
              title={isCollecting ? "콘텐츠 새로고침 중" : "콘텐츠 새로고침"}
            >
              <RefreshCw aria-hidden="true" className={isCollecting ? "is-spinning" : undefined} size={15} />
            </Button>
            <Button
              className="fuma-content-inspection-start-button"
              disabled={pendingCount === 0}
              onClick={onStartInspection}
              variant="primary"
            >
              검수 시작
            </Button>
          </span>
        )}
        ariaLabel="콘텐츠 처리 구분"
        className="fuma-list-action-toolbar"
        onChange={onSelect}
        options={CONTENT_INSPECTION_CATEGORIES}
        value={selectedCategory}
      />
      {collectionResult ? (
        <p className="fuma-content-inspection-collection-feedback" role="status">
          작업 요청됨 · 작업 ID {collectionResult.runId} · 진행상황에서 확인
        </p>
      ) : collectionError ? (
        <p
          className="fuma-content-inspection-collection-feedback fuma-content-inspection-collection-feedback--error"
          role="alert"
        >
          {collectionError}
        </p>
      ) : null}
    </>
  );
}

function queueColumns(): DenseTableColumn<ContentInspectionFixture>[] {
  return [
    { key: "id", header: "콘텐츠 ID", width: 96 },
    { key: "contentTitle", header: "콘텐츠 제목", width: 280 },
    { key: "contentFormat", header: "형식", width: 110, align: "center" },
    {
      key: "inspectionType",
      header: "검수 유형",
      width: 120,
      render: (content) => INSPECTION_TYPE_LABELS[content.inspectionType],
    },
    { key: "author", header: "작성자", width: 100 },
    {
      key: "sourcePlatform",
      header: "플랫폼",
      width: 100,
      align: "center",
      render: (content) => <PlatformIcon platform={contentPlatform(content.sourcePlatform)} />,
    },
    { key: "submittedAt", header: "수집 시각", width: 160, align: "center" },
    {
      key: "aiStatus",
      header: "리포트 상태",
      width: 120,
      align: "center",
      render: (content) => (
        <StatusPill tone={content.aiStatus === "ready" ? "approved" : "pending"}>
          {content.aiStatus === "ready" ? "생성 완료" : "생성 대기"}
        </StatusPill>
      ),
    },
    {
      key: "inspectionStatus",
      header: "처리 구분",
      width: 110,
      align: "center",
      render: (content) => {
        const category = contentInspectionCategory(content);
        return <StatusPill tone={contentInspectionCategoryTone(category)}>{category}</StatusPill>;
      },
    },
  ];
}

export function ContentInspectionListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contents, setContents] = useState<ContentInspectionFixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();

    void getCurrentGenerationContents(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setContents(result.map(adaptContentInspection));
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted
          || (error instanceof Error && error.name === "AbortError")
        ) return;
        setLoadError(error instanceof Error ? error.message : "콘텐츠 목록 조회에 실패했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);
  const selectedCategory = CONTENT_INSPECTION_CATEGORIES.find(
    (category) => category === searchParams.get("category"),
  ) ?? "신규";
  const violationOnly = searchParams.get("issues") === "1";
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const appliedFilters: QueueFilterValues = {
    keyword: searchParams.get("q") ?? "",
    platform: SOCIAL_PLATFORM_FILTER_OPTIONS.some(({ value }) => value === searchParams.get("platform"))
      ? searchParams.get("platform") ?? ""
      : "",
  };
  const normalizedKeyword = appliedFilters.keyword.trim().toLocaleLowerCase("ko-KR");
  const filteredContents = contents.filter((content) => {
    const matchesCategory = contentInspectionCategory(content) === selectedCategory;
    const hasViolation = content.report.signals.some((signal) => signal.tone !== "pass");
    const matchesKeyword = !normalizedKeyword || [
      content.id,
      content.contentTitle,
      content.author,
    ].some((value) => value.toLocaleLowerCase("ko-KR").includes(normalizedKeyword));
    const matchesPlatform = !appliedFilters.platform
      || contentPlatform(content.sourcePlatform) === appliedFilters.platform;
    return matchesCategory
      && (!violationOnly || hasViolation)
      && matchesKeyword
      && matchesPlatform;
  });
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const { currentPage, pagedItems: pageContents, totalPages } = paginate(
    filteredContents,
    requestedPage,
    CONTENT_INSPECTION_PAGE_SIZE,
  );
  const pendingContents = inspectionRequiredContents(contents);

  const updateListParam = (
    key: "category" | "issues" | "page" | "view",
    value: string,
    defaultValue: string,
    resetPage = false,
  ) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === defaultValue) nextParams.delete(key);
    else nextParams.set(key, value);
    if (resetPage) nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const applyQueueFilters = (filters: QueueFilterValues) => {
    const nextParams = new URLSearchParams(searchParams);
    const values = {
      q: filters.keyword.trim(),
      platform: filters.platform,
    };

    nextParams.delete("inspectionType");

    Object.entries(values).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const resetQueueFilters = () => {
    const nextParams = new URLSearchParams(searchParams);
    ["q", "platform", "inspectionType", "category", "issues", "page"].forEach((key) => {
      nextParams.delete(key);
    });
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <section className="fuma-page" data-visual-contract="content-inspection">
      <PageHeader title="콘텐츠 검수" />
      <div className="fuma-page__body">
        <QueueFilters
          appliedFilters={appliedFilters}
          key={JSON.stringify(appliedFilters)}
          onApply={applyQueueFilters}
          onReset={resetQueueFilters}
        />
        <ContentInspectionCategoryTabs
          onStartInspection={() => {
            const firstPendingContent = pendingContents[0];
            if (!firstPendingContent) return;
            navigate(`/content/inspections/${firstPendingContent.id}`, {
              state: {
                content: firstPendingContent,
                contents,
                from: `${location.pathname}${location.search}`,
                inspectionSession: true,
              },
            });
          }}
          onSelect={(category) => updateListParam("category", category, "신규", true)}
          pendingCount={pendingContents.length}
          selectedCategory={selectedCategory}
        />
        {isLoading ? (
          <section aria-label="수집 콘텐츠 목록" className="fuma-content-collection">
            <EmptyState title="콘텐츠를 불러오는 중입니다." />
          </section>
        ) : loadError ? (
          <p
            className="fuma-content-inspection-collection-feedback fuma-content-inspection-collection-feedback--error"
            role="alert"
          >
            {loadError}
          </p>
        ) : (
          <ContentInspectionCollection
            contents={pageContents}
            onChangeView={(nextViewMode) => updateListParam("view", nextViewMode, "grid")}
            onChangeViolationOnly={(nextViolationOnly) => (
              updateListParam("issues", nextViolationOnly ? "1" : "0", "0", true)
            )}
            onSelect={(content) => navigate(`/content/inspections/${content.id}`, {
              state: { content, contents, from: `${location.pathname}${location.search}` },
            })}
            totalCount={filteredContents.length}
            violationOnly={violationOnly}
            viewMode={viewMode}
          />
        )}
        {!isLoading && !loadError && filteredContents.length > 0 ? (
          <Pagination
            onPageChange={(page) => updateListParam("page", String(page), "1")}
            page={currentPage}
            pageSize={CONTENT_INSPECTION_PAGE_SIZE}
            totalPages={totalPages}
          />
        ) : null}
      </div>
    </section>
  );
}

type InspectionHistoryItem = ContentInspectionFixture["report"]["history"][number];

const INSPECTION_HISTORY_COLUMNS: DenseTableColumn<InspectionHistoryItem>[] = [
  { key: "at", header: "처리 일시", width: "34%", align: "center" },
  { key: "label", header: "처리 내용", align: "center" },
  { key: "actor", header: "처리 주체", width: "24%", align: "center" },
];

function InspectionHistory({ content }: { content: ContentInspectionFixture }) {
  return (
    <section
      aria-label="검수 이력"
      className="fuma-creator-analysis-report fuma-content-analysis-report fuma-content-inspection-history-report"
    >
      <header className="fuma-minimal-inspection-section__header fuma-content-analysis-report__header">
        <div><span>HISTORY</span><h3>검수 이력</h3></div>
      </header>
      <div className="fuma-creator-analysis-report__content">
        <div
          aria-label="검수 이력 목록"
          className="fuma-wide-table fuma-settlement-table fuma-proposal-history-table"
          role="region"
        >
          <DenseTable
            columns={INSPECTION_HISTORY_COLUMNS}
            rowKey={(item) => `${item.at}-${item.label}`}
            rows={[...content.report.history]}
          />
        </div>
      </div>
    </section>
  );
}

function MinimalInspectionOverview({ content }: { content: ContentInspectionFixture }) {
  return (
    <section className="fuma-minimal-inspection-overview">
      <header>
        <div>
          <span>{INSPECTION_TYPE_LABELS[content.inspectionType]}</span>
          <h2>{content.contentTitle}</h2>
          <p>{content.author} · {content.sourcePlatform} · {content.contentFormat}</p>
        </div>
        <StatusPill tone={inspectionStatusTone(content.inspectionStatus)}>{content.inspectionStatus}</StatusPill>
      </header>
      <dl>
        <div><dt>제출일</dt><dd>{content.submittedAt}</dd></div>
        <div><dt>리포트 생성일</dt><dd>{content.report.generatedAt ?? "분석 대기"}</dd></div>
      </dl>
    </section>
  );
}

function youtubeEmbedUrl(videoId?: string) {
  return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
    : null;
}

interface IndexedContentAnnotation extends ContentAnnotation {
  ordinal: number;
}

function annotationQuote(target: ContentAnnotationTarget) {
  return target.kind === "text" || target.kind === "media" ? target.quote : null;
}

function annotationMatchesSignal(
  annotation: ContentAnnotation,
  signal: ContentInspectionFixture["report"]["signals"][number],
) {
  const quote = annotationQuote(annotation.target);
  return annotation.title === signal.title || (quote !== null && quote === signal.evidence);
}

function mediaIndexFromSource(source: string, snapshot: ContentSnapshot) {
  const numberedMedia = /(?:이미지|동영상)\s*(\d+)/.exec(source);
  if (numberedMedia) return Math.max(0, Number(numberedMedia[1]) - 1);
  const videoIndex = snapshot.mediaKinds.findIndex((kind) => kind === "동영상");
  return Math.max(0, videoIndex);
}

function timeRangeFromSource(source: string) {
  const range = /(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/.exec(source);
  return range ? { start: range[1], end: range[2] } : undefined;
}

function annotationFromSignal(
  signal: ContentInspectionFixture["report"]["signals"][number],
  snapshot: ContentSnapshot,
  ordinal: number,
): IndexedContentAnnotation {
  const startIndex = snapshot.text.indexOf(signal.evidence);
  const sourceIsText = signal.source.includes("본문") && startIndex >= 0;
  const timeRange = timeRangeFromSource(signal.source);

  return {
    guidance: signal.guidance ?? "표시된 근거를 확인해 주세요.",
    id: `signal-${ordinal}-${signal.title}`,
    location: signal.source,
    ordinal,
    reason: signal.detail,
    severity: signal.tone === "warning" ? "warning" : "critical",
    source: "자동 감지",
    state: "active",
    target: sourceIsText
      ? {
          endIndex: startIndex + signal.evidence.length,
          kind: "text",
          occurrence: 1,
          quote: signal.evidence,
          startIndex,
        }
      : {
          box: timeRange
            ? { x: 7, y: 70, width: 86, height: 15 }
            : { x: 14, y: 31, width: 72, height: 18 },
          kind: "media",
          mediaIndex: mediaIndexFromSource(signal.source, snapshot),
          quote: signal.evidence,
          ...(timeRange ? { timeRange } : {}),
        },
    title: signal.title,
  };
}

function indexedViolationAnnotations(
  content: ContentInspectionFixture,
  snapshot: ContentSnapshot,
): IndexedContentAnnotation[] {
  const candidates = content.report.signals.filter((signal) => signal.tone !== "pass");
  const annotations = (snapshot.annotations ?? [])
    .filter((annotation) => annotation.state === "active")
    .map((annotation, annotationIndex) => {
      const candidateIndex = candidates.findIndex((signal) => annotationMatchesSignal(annotation, signal));
      return {
        ...annotation,
        ordinal: candidateIndex >= 0 ? candidateIndex + 1 : annotationIndex + 1,
      };
    });

  if (snapshot === content.currentSnapshot) {
    candidates.forEach((signal, candidateIndex) => {
      if (!annotations.some((annotation) => annotationMatchesSignal(annotation, signal))) {
        annotations.push(annotationFromSignal(signal, snapshot, candidateIndex + 1));
      }
    });
  }

  return annotations.sort((left, right) => left.ordinal - right.ordinal);
}

function findQuoteRange(text: string, quote: string, occurrence = 1) {
  let fromIndex = 0;
  let matchedIndex = -1;

  for (let match = 0; match < occurrence; match += 1) {
    matchedIndex = text.indexOf(quote, fromIndex);
    if (matchedIndex < 0) return null;
    fromIndex = matchedIndex + quote.length;
  }

  return { end: matchedIndex + quote.length, start: matchedIndex };
}

function ViolationHighlightedText({
  anchorPrefix,
  annotations,
  text,
  useStoredIndexes = false,
}: {
  anchorPrefix?: string;
  annotations: readonly IndexedContentAnnotation[];
  text: string;
  useStoredIndexes?: boolean;
}) {
  const ranges = annotations.flatMap((annotation) => {
    const target = annotation.target;
    if (target.kind === "url") return [];
    const storedRange = target.kind === "text"
      && useStoredIndexes
      && target.startIndex !== undefined
      && target.endIndex !== undefined
      && target.startIndex >= 0
      && target.endIndex <= text.length
      && target.startIndex < target.endIndex
        ? { end: target.endIndex, start: target.startIndex }
        : null;
    const range = storedRange ?? findQuoteRange(
      text,
      target.quote,
      target.kind === "text" ? target.occurrence : 1,
    );
    return range ? [{ ...range, annotation }] : [];
  }).sort((left, right) => left.start - right.start || left.end - right.end);

  if (ranges.length === 0) return <>{text}</>;

  const nodes: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(({ annotation, end, start }) => {
    if (start < cursor) return;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <mark
        aria-label={`위반 ${annotation.ordinal}: ${annotation.title}`}
        className="fuma-inspection-text-violation"
        data-ordinal={annotation.ordinal}
        data-severity={annotation.severity}
        data-violation-anchor={anchorPrefix ? annotation.ordinal : undefined}
        id={anchorPrefix ? `${anchorPrefix}-violation-${annotation.ordinal}` : undefined}
        key={`${annotation.id}-${start}`}
        tabIndex={anchorPrefix ? -1 : undefined}
        title={`${annotation.title}: ${annotation.reason}`}
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <>{nodes}</>;
}

function MinimalVersionCard({
  content,
  focusedViolation,
  label,
  snapshot,
}: {
  content: ContentInspectionFixture;
  focusedViolation?: { ordinal: number; requestId: number } | null;
  label: string;
  snapshot: ContentSnapshot;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const annotations = useMemo(
    () => indexedViolationAnnotations(content, snapshot),
    [content, snapshot],
  );
  const firstAnnotatedMediaIndex = annotations.find((annotation) => annotation.target.kind === "media")?.target;
  const [activeMediaIndex, setActiveMediaIndex] = useState(
    firstAnnotatedMediaIndex?.kind === "media" ? firstAnnotatedMediaIndex.mediaIndex : 0,
  );
  const [mediaAspectRatios, setMediaAspectRatios] = useState<Record<number, number>>({});
  const mediaItems = Array.from({ length: snapshot.mediaCount }, (_, index) => ({
    kind: snapshot.mediaKinds[index] ?? "이미지",
    url: snapshot.mediaUrls[index] ?? snapshot.mediaUrls[0],
  }));
  const visibleIndex = mediaItems.length > 0 ? activeMediaIndex % mediaItems.length : 0;
  const activeMedia = mediaItems[visibleIndex];
  const platform = contentPlatform(content.sourcePlatform);
  const isInstagram = platform === "Instagram";
  const embedUrl = isInstagram ? null : youtubeEmbedUrl(snapshot.youtubeVideoId);
  const isVerticalVideo = content.contentFormat === "인스타 릴스" || content.contentFormat === "유튜브 쇼츠";
  const activeMediaAnnotations = annotations.filter((annotation) => (
    annotation.target.kind === "media" && annotation.target.mediaIndex === visibleIndex
  ));
  const frameAspectRatio = isVerticalVideo ? 9 / 16 : isInstagram ? 4 / 5 : 16 / 9;
  const mediaAspectRatio = embedUrl
    ? 16 / 9
    : mediaAspectRatios[visibleIndex] ?? (isVerticalVideo ? 9 / 16 : isInstagram ? 1 : 16 / 9);
  const mediaStageFit = embedUrl ? "fill" : mediaAspectRatio >= frameAspectRatio ? "width" : "height";
  const handle = content.accountId ?? content.author;
  const avatarUrl = content.profileImageUrl ?? "";
  const [month, day] = snapshot.capturedAt.slice(5, 10).split("-");
  const postDate = `${Number(month)}월 ${Number(day)}일`;

  const moveMedia = (direction: -1 | 1) => {
    setActiveMediaIndex((current) => (current + direction + mediaItems.length) % mediaItems.length);
  };

  useEffect(() => {
    if (!focusedViolation) return;
    const annotation = annotations.find(({ ordinal }) => ordinal === focusedViolation.ordinal);
    if (!annotation) return;
    const animationFrame = window.requestAnimationFrame(() => {
      if (annotation.target.kind === "media" && visibleIndex !== annotation.target.mediaIndex) {
        setActiveMediaIndex(annotation.target.mediaIndex);
        return;
      }
      const target = cardRef.current?.querySelector<HTMLElement>(
        `[data-violation-anchor="${focusedViolation.ordinal}"]`,
      );
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [annotations, focusedViolation, visibleIndex]);

  return (
    <article
      className="fuma-minimal-version-card"
      data-content-format={contentCollectionFormatKey(content.contentFormat)}
      data-platform={platform.toLowerCase()}
      ref={cardRef}
    >
      <header><strong>{label}</strong><time>{snapshot.capturedAt}</time></header>
      <div className="fuma-platform-inspection-frame">
        {isInstagram ? (
          <div className="fuma-platform-inspection-frame__instagram-header">
            <span className="fuma-platform-inspection-frame__avatar">
              <CreatorProfilePhoto creatorName={content.author} src={avatarUrl} />
            </span>
            <div><strong>{handle}</strong><small>현대홈쇼핑 셀렉터스 · {content.cohort}</small></div>
            <button aria-label="게시물 메뉴" type="button"><MoreHorizontal aria-hidden="true" size={20} /></button>
          </div>
        ) : null}

        <div className={`fuma-platform-inspection-frame__media${isVerticalVideo ? " is-vertical" : ""}${embedUrl ? " has-youtube-embed" : ""}`}>
          <div
            className="fuma-platform-inspection-frame__asset-stage"
            data-fit={mediaStageFit}
            style={mediaStageFit === "fill" ? undefined : { aspectRatio: String(mediaAspectRatio) }}
          >
            {embedUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="fuma-platform-inspection-frame__youtube-embed"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                src={embedUrl}
                title={`${content.contentTitle} YouTube 영상`}
              />
            ) : activeMedia?.url ? (
              <img
                alt={`${content.author} ${label} 미디어 ${visibleIndex + 1}`}
                onLoad={(event) => {
                  const { naturalHeight, naturalWidth } = event.currentTarget;
                  if (naturalHeight > 0 && naturalWidth > 0) {
                    setMediaAspectRatios((current) => ({
                      ...current,
                      [visibleIndex]: naturalWidth / naturalHeight,
                    }));
                  }
                }}
                src={activeMedia.url}
              />
            ) : (
              <Images aria-hidden="true" size={26} />
            )}
            {activeMediaAnnotations.length > 0 ? (
              <div aria-label="미디어 위반 위치" className="fuma-platform-inspection-frame__violation-layer">
                {activeMediaAnnotations.map((annotation) => {
                  if (annotation.target.kind !== "media") return null;
                  const { box, timeRange } = annotation.target;
                  return (
                    <span
                      aria-label={`위반 ${annotation.ordinal}: ${annotation.title}`}
                      className="fuma-platform-inspection-frame__violation-box"
                      data-violation-anchor={focusedViolation !== undefined ? annotation.ordinal : undefined}
                      data-severity={annotation.severity}
                      id={focusedViolation !== undefined ? `${content.id}-violation-${annotation.ordinal}` : undefined}
                      key={annotation.id}
                      role="note"
                      style={{
                        height: `${box.height}%`,
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                      }}
                      tabIndex={focusedViolation !== undefined ? -1 : undefined}
                    >
                      <span className="fuma-inspection-annotation-pin">{annotation.ordinal}</span>
                      <small>{timeRange ? `${timeRange.start}–${timeRange.end}` : annotation.title}</small>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
          {activeMedia?.kind === "동영상" ? (
            <span aria-label="동영상" className="fuma-platform-inspection-frame__play">
              <Play aria-hidden="true" size={20} />
            </span>
          ) : null}
          {activeMedia?.kind === "동영상" && content.duration ? (
            <span className="fuma-platform-inspection-frame__duration">{content.duration}</span>
          ) : null}
          {mediaItems.length > 1 ? (
            <>
              <button aria-label="이전 사진" className="is-prev" onClick={() => moveMedia(-1)} type="button"><ChevronLeft aria-hidden="true" size={17} /></button>
              <button aria-label="다음 사진" className="is-next" onClick={() => moveMedia(1)} type="button"><ChevronRight aria-hidden="true" size={17} /></button>
              <span className="fuma-platform-inspection-frame__count">{visibleIndex + 1} / {mediaItems.length}</span>
            </>
          ) : null}
          {!isInstagram && !embedUrl ? (
            <div className="fuma-platform-inspection-frame__player-controls">
              <div className="fuma-platform-inspection-frame__progress"><span /></div>
              <div>
                <span>
                  <button aria-label="재생" type="button"><Play aria-hidden="true" size={17} fill="currentColor" /></button>
                  <button aria-label="음량" type="button"><Volume2 aria-hidden="true" size={18} /></button>
                  <small>0:00 / {content.duration ?? "00:30"}</small>
                </span>
                <span>
                  <button aria-label="자막" type="button"><Captions aria-hidden="true" size={18} /></button>
                  <button aria-label="설정" type="button"><Settings aria-hidden="true" size={18} /></button>
                  <button aria-label="전체 화면" type="button"><Maximize aria-hidden="true" size={18} /></button>
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {isInstagram && mediaItems.length > 1 ? (
          <div aria-label="사진 목록" className="fuma-platform-inspection-frame__carousel-dots" role="group">
            {mediaItems.map((media, index) => (
              <button
                aria-label={`${index + 1}번 ${media.kind} 보기`}
                aria-pressed={visibleIndex === index}
                data-has-violation={annotations.some((annotation) => (
                  annotation.target.kind === "media" && annotation.target.mediaIndex === index
                ))}
                key={`${media.url}-${index}`}
                onClick={() => setActiveMediaIndex(index)}
                type="button"
              />
            ))}
          </div>
        ) : null}

        {isInstagram ? (
          <>
            <div className="fuma-platform-inspection-frame__instagram-actions">
              <span>
                <button aria-label="좋아요" type="button"><Heart aria-hidden="true" size={23} /></button>
                <button aria-label="댓글" type="button"><MessageCircle aria-hidden="true" size={23} /></button>
                <button aria-label="리포스트" type="button"><Repeat2 aria-hidden="true" size={23} /></button>
                <button aria-label="공유" type="button"><Send aria-hidden="true" size={22} /></button>
              </span>
              <button aria-label="저장" type="button"><Bookmark aria-hidden="true" size={23} /></button>
            </div>
            <div className="fuma-platform-inspection-frame__instagram-copy">
              <strong>성과 정보 없음</strong>
              <p><b>{handle}</b>{" "}<ViolationHighlightedText anchorPrefix={focusedViolation !== undefined ? content.id : undefined} annotations={annotations} text={snapshot.text} useStoredIndexes /></p>
              <button type="button">댓글 정보 없음</button>
              <time>{postDate}</time>
            </div>
          </>
        ) : (
          <div className={`fuma-platform-inspection-frame__youtube-copy${embedUrl ? " is-embedded" : ""}`}>
            <h4>{content.contentTitle}</h4>
            <div className="fuma-platform-inspection-frame__youtube-toolbar">
              <div className="fuma-platform-inspection-frame__youtube-channel">
                <span className="fuma-platform-inspection-frame__avatar">
                  <CreatorProfilePhoto creatorName={content.author} src={avatarUrl} />
                </span>
                <span><strong>{content.author}</strong><small>구독자 정보 없음</small></span>
                <button type="button">구독</button>
              </div>
              <div className="fuma-platform-inspection-frame__youtube-actions">
                <button aria-label="좋아요" type="button"><ThumbsUp aria-hidden="true" size={17} /></button>
                <button aria-label="싫어요" type="button"><ThumbsDown aria-hidden="true" size={17} /></button>
                <button type="button"><Share2 aria-hidden="true" size={17} /> 공유</button>
                <button type="button"><Bookmark aria-hidden="true" size={17} /> 저장</button>
                <button aria-label="더보기" type="button"><MoreHorizontal aria-hidden="true" size={18} /></button>
              </div>
            </div>
            <div className="fuma-platform-inspection-frame__youtube-description">
              <strong>성과 정보 없음 · {postDate}</strong>
              <p><ViolationHighlightedText anchorPrefix={focusedViolation !== undefined ? content.id : undefined} annotations={annotations} text={snapshot.text} useStoredIndexes /></p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function MinimalVersionComparison({
  content,
  focusedViolation,
}: {
  content: ContentInspectionFixture;
  focusedViolation: { ordinal: number; requestId: number } | null;
}) {
  const isRevision = Boolean(content.previousSnapshot);
  const isEditedWithoutPrevious = !isRevision && content.inspectionType !== "NEW";

  return (
    <section className="fuma-minimal-inspection-section">
      <header className="fuma-minimal-inspection-section__header">
        <h3>{isRevision ? "수정 콘텐츠 비교" : isEditedWithoutPrevious ? "수정 콘텐츠" : "등록 콘텐츠"}</h3>
        <span>
          {isRevision
            ? `${content.changeItems.length}건 수정됨`
            : isEditedWithoutPrevious ? "이전 버전 정보 없음" : "신규 등록"}
        </span>
      </header>
      {content.previousSnapshot && content.changeItems.length > 0 ? (
        <ul className="fuma-minimal-version-changes">
          {content.changeItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
      <div className={`fuma-minimal-version-grid${content.previousSnapshot ? "" : " is-single"}`}>
        {content.previousSnapshot ? (
          <MinimalVersionCard key={`${content.id}-previous`} content={content} label="수정 전" snapshot={content.previousSnapshot} />
        ) : null}
        <MinimalVersionCard
          key={`${content.id}-current`}
          content={content}
          focusedViolation={focusedViolation}
          label={isRevision ? "수정 후" : isEditedWithoutPrevious ? "현재 버전" : "신규 등록"}
          snapshot={content.currentSnapshot}
        />
      </div>
    </section>
  );
}

function MinimalAnalysisReport({ content }: { content: ContentInspectionFixture }) {
  if (content.aiStatus === "pending") {
    return (
      <section
        aria-label="분석 리포트"
        className="fuma-minimal-inspection-section fuma-creator-analysis-report fuma-content-analysis-report"
      >
        <header className="fuma-minimal-inspection-section__header fuma-content-analysis-report__header">
          <div><span>CONTENT REPORT</span><h3>분석 리포트</h3></div>
          <time>분석 대기</time>
        </header>
        <div className="fuma-creator-analysis-report__content">
          <p>AI 분석 결과가 아직 없습니다.</p>
        </div>
      </section>
    );
  }

  const ocrExtract = content.report.extracts.find((extract) => extract.type === "OCR");
  const sttExtract = content.report.extracts.find((extract) => extract.type === "STT");
  const annotations = indexedViolationAnnotations(content, content.currentSnapshot);
  const safetyText = [
    content.currentSnapshot.text,
    ...content.report.extracts.map((extract) => extract.text),
    ...content.report.signals.flatMap((signal) => [signal.title, signal.detail, signal.evidence]),
  ].join(" ");
  const safetyChecks = [
    { label: "욕설", detected: /욕설|비속어|모욕/.test(safetyText) },
    { label: "폭력성", detected: /폭력|상해|위협/.test(safetyText) },
    { label: "음란물", detected: /음란|선정성|성적 표현/.test(safetyText) },
  ];
  const captionAdDetected = /#광고|유료광고|협찬/.test(content.currentSnapshot.text);
  const ocrAdDetected = /#광고|유료광고|협찬/.test(ocrExtract?.text ?? "");
  const adSignalPassed = content.report.signals.some((signal) => signal.title.includes("광고 표시") && signal.tone === "pass");
  const analysisSummary = sttExtract
    ? `${content.contentTitle}의 특징과 사용 경험을 설명하고 구매 정보를 안내하는 내용입니다. 음성 문장에 포함된 단정적 표현과 광고 고지를 함께 확인해야 합니다.`
    : "추출된 음성 문장이 없어 화면 글자와 게시물 본문을 기준으로 검수합니다.";
  const analysisSignals = [
    ...safetyChecks.map((check) => ({
      alert: check.detected,
      label: check.label,
      meta: "안전성",
      value: check.detected ? "검토 필요" : "미감지",
    })),
    {
      alert: !(adSignalPassed || captionAdDetected),
      label: "본문 광고 표시",
      meta: "TEXT",
      value: adSignalPassed || captionAdDetected ? "표시 확인" : "확인 필요",
    },
    {
      alert: !ocrAdDetected,
      label: "OCR 광고 표시",
      meta: "OCR",
      value: ocrAdDetected ? "표시 확인" : "확인 필요",
    },
  ];

  return (
    <section
      aria-label="분석 리포트"
      className="fuma-minimal-inspection-section fuma-creator-analysis-report fuma-content-analysis-report"
    >
      <header className="fuma-minimal-inspection-section__header fuma-content-analysis-report__header">
        <div><span>CONTENT REPORT</span><h3>분석 리포트</h3></div>
        <time>{content.report.generatedAt}</time>
      </header>

      <div className="fuma-creator-analysis-report__content">
        <section aria-label="분석 요약" className="fuma-content-analysis-summary">
          <span>분석 요약</span>
          <p>{analysisSummary}</p>
        </section>

        <section aria-label="추출 내용" className="fuma-creator-analysis-block">
          <div className="fuma-creator-analysis-block__heading">
            <h3>추출 내용</h3><span>OCR · STT 기반</span>
          </div>
          <dl className="fuma-creator-analysis-claims fuma-content-analysis-extracts">
            <div data-has-content={ocrExtract ? "true" : "false"}>
              <dt><span>OCR 화면 글자</span><small>{ocrExtract?.location ?? "추출 결과 없음"}</small></dt>
              <dd>
                {ocrExtract
                  ? <ViolationHighlightedText annotations={annotations} text={ocrExtract.text} />
                  : "추출된 화면 글자가 없습니다."}
              </dd>
            </div>
            <div data-has-content={sttExtract ? "true" : "false"}>
              <dt><span>STT 음성 문장</span><small>{sttExtract?.location ?? "추출 결과 없음"}</small></dt>
              <dd>
                {sttExtract
                  ? <ViolationHighlightedText annotations={annotations} text={sttExtract.text} />
                  : "추출된 음성 문장이 없습니다."}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-label="위험/광고 요소" className="fuma-creator-analysis-block">
          <div className="fuma-creator-analysis-block__heading">
            <h3>위험/광고 요소</h3><span>본문 및 추출 데이터 기준</span>
          </div>
          <div className="fuma-analysis-engagement__grid fuma-content-analysis-signal-grid">
            {analysisSignals.map((signal) => (
              <article
                className="fuma-analysis-engagement__card fuma-content-analysis-signal-card"
                data-alert={signal.alert}
                key={signal.label}
              >
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
                <small>{signal.meta}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function MinimalFinalInspection({
  content,
  onNavigateToViolation,
}: {
  content: ContentInspectionFixture;
  onNavigateToViolation: (ordinal: number) => void;
}) {
  const [decision, setDecision] = useState<"승인" | "반려" | null>(null);
  const analysisPending = content.aiStatus === "pending";
  const candidates = content.report.signals.filter((signal) => signal.tone !== "pass");
  const [candidateDecisions, setCandidateDecisions] = useState<Record<string, "위반" | "위반 아님">>({});
  const decidedCount = candidates.filter((candidate) => candidateDecisions[`${candidate.source}-${candidate.title}`]).length;
  const allCandidatesDecided = !analysisPending && decidedCount === candidates.length;

  const decideCandidate = (key: string, candidateDecision: "위반" | "위반 아님") => {
    setCandidateDecisions((current) => ({ ...current, [key]: candidateDecision }));
    setDecision(null);
  };

  return (
    <section aria-label="최종 검수" className="fuma-minimal-final-inspection">
      <header>
        <div><span>FINAL INSPECTION</span><h3>최종 검수</h3></div>
        <ShieldCheck aria-hidden="true" size={22} />
      </header>
      <dl>
        <div><dt>검수 상태</dt><dd>{decision ?? "검수 전"}</dd></div>
        <div><dt>후보 판정</dt><dd>{decidedCount} / {candidates.length}</dd></div>
      </dl>
      <section className="fuma-minimal-final-inspection__candidates">
        <header><strong>위반 여부 판정</strong><span>{decidedCount}/{candidates.length}</span></header>
        {analysisPending ? (
          <p>위반 정보 없음</p>
        ) : candidates.length > 0 ? candidates.map((candidate, index) => {
          const key = `${candidate.source}-${candidate.title}`;
          const candidateDecision = candidateDecisions[key];
          return (
            <article key={key}>
              <button
                aria-label={`${candidate.title} 위반 위치로 이동`}
                className="fuma-minimal-final-inspection__candidate-jump"
                onClick={() => onNavigateToViolation(index + 1)}
                type="button"
              >
                <span><span>{index + 1}</span><strong>{candidate.title}</strong></span>
                <blockquote>“{candidate.evidence}”</blockquote>
                <small>{candidate.source}</small>
              </button>
              <div className="fuma-minimal-final-inspection__candidate-actions">
                <Button
                  aria-pressed={candidateDecision === "위반"}
                  className={candidateDecision === "위반" ? "is-violation" : undefined}
                  onClick={() => decideCandidate(key, "위반")}
                >
                  위반
                </Button>
                <Button
                  aria-pressed={candidateDecision === "위반 아님"}
                  className={candidateDecision === "위반 아님" ? "is-clear" : undefined}
                  onClick={() => decideCandidate(key, "위반 아님")}
                >
                  위반 아님
                </Button>
              </div>
            </article>
          );
        }) : (
          <p><CheckCircle2 aria-hidden="true" size={15} /> 판정할 위반 후보가 없습니다.</p>
        )}
      </section>
      <div className="fuma-minimal-final-inspection__actions">
        <Button
          aria-pressed={decision === "반려"}
          className={decision === "반려" ? "is-rejected" : undefined}
          disabled={analysisPending || !allCandidatesDecided}
          onClick={() => setDecision("반려")}
        >
          반려
        </Button>
        <Button
          aria-pressed={decision === "승인"}
          className={decision === "승인" ? "is-approved" : undefined}
          disabled={analysisPending || !allCandidatesDecided}
          onClick={() => setDecision("승인")}
        >
          승인
        </Button>
      </div>
      {analysisPending
        ? <p>분석이 완료된 후 최종 검수를 진행할 수 있습니다.</p>
        : !allCandidatesDecided
          ? <p>모든 위반 후보를 먼저 판정해 주세요.</p>
          : decision ? <p>{decision}으로 선택했습니다.</p> : null}
    </section>
  );
}

function ContentInspectionDetailContent({ content }: { content: ContentInspectionFixture }) {
  const [focusedViolation, setFocusedViolation] = useState<{
    ordinal: number;
    requestId: number;
  } | null>(null);

  const navigateToViolation = (ordinal: number) => {
    setFocusedViolation((current) => ({
      ordinal,
      requestId: (current?.requestId ?? 0) + 1,
    }));
  };

  return (
    <div className="fuma-minimal-inspection-layout">
      <main className="fuma-minimal-inspection-main">
        <MinimalInspectionOverview content={content} />
        <MinimalVersionComparison content={content} focusedViolation={focusedViolation} />
        <MinimalAnalysisReport content={content} />
        <InspectionHistory content={content} />
      </main>
      <aside className="fuma-minimal-inspection-sidebar">
        <MinimalFinalInspection content={content} key={content.id} onNavigateToViolation={navigateToViolation} />
      </aside>
    </div>
  );
}

export function ContentInspectionDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { contentId } = useParams();
  const routeState = location.state as {
    content?: ContentInspectionFixture;
    contents?: ContentInspectionFixture[];
    from?: unknown;
    inspectionSession?: boolean;
  } | null;
  const initialRouteContents = routeState?.contents
    ?? (routeState?.content ? [routeState.content] : []);
  const [detailContents, setDetailContents] = useState<ContentInspectionFixture[]>(
    initialRouteContents,
  );
  const [isLoading, setIsLoading] = useState(initialRouteContents.length === 0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const content = detailContents.find((item) => item.id === contentId);
  const returnPath = routeState?.from;
  const pendingContents = inspectionRequiredContents(detailContents);
  const currentPendingIndex = pendingContents.findIndex((item) => item.id === contentId);
  const nextContent = currentPendingIndex >= 0
    ? pendingContents[currentPendingIndex + 1]
    : pendingContents[0];
  const remainingCount = currentPendingIndex >= 0
    ? Math.max(0, pendingContents.length - currentPendingIndex - 1)
    : pendingContents.length;

  useEffect(() => {
    const routeContents = routeState?.contents
      ?? (routeState?.content ? [routeState.content] : []);
    if (routeContents.some((item) => item.id === contentId)) {
      return undefined;
    }

    const controller = new AbortController();
    void getCurrentGenerationContents(controller.signal)
      .then((result) => {
        setDetailContents(result.map(adaptContentInspection));
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "콘텐츠 목록 조회에 실패했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [contentId, routeState]);

  return (
    <section className="fuma-page fuma-content-inspection-detail" data-visual-contract="content-inspection">
      <PageHeader title="콘텐츠 검수 상세" />
      <div className="fuma-page__body">
        {isLoading ? (
          <EmptyState title="콘텐츠를 불러오는 중입니다." />
        ) : loadError ? (
          <p
            className="fuma-content-inspection-collection-feedback fuma-content-inspection-collection-feedback--error"
            role="alert"
          >
            {loadError}
          </p>
        ) : content ? (
          <>
            <div className="fuma-detail-toolbar fuma-minimal-inspection-toolbar">
              <button
                className="hsas-button fuma-detail-toolbar__link"
                onClick={() => typeof returnPath === "string" ? navigate(-1) : navigate("/content/inspections")}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.8} />
                대기열
              </button>
              <div>
                <span><strong>{remainingCount}건</strong>의 콘텐츠가 남았습니다.</span>
                <Button
                  className="fuma-content-inspection-next-button"
                  disabled={!nextContent}
                  onClick={() => nextContent && navigate(`/content/inspections/${nextContent.id}`, {
                    state: { ...routeState, content: nextContent, contents: detailContents },
                  })}
                  variant="primary"
                >
                  다음 콘텐츠 <ChevronRight aria-hidden="true" size={14} />
                </Button>
              </div>
            </div>
            <ContentInspectionDetailContent content={content} />
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
