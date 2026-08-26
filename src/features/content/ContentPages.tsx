import {
  useCallback,
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
  UserRound,
  Volume2,
} from "lucide-react";
import "../../styles/content-inspection.css";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, Switch, TextInput } from "../../components/ui/Controls";
import { BubbleDialog } from "../../components/ui/BubbleDialog";
import { ContentCollectionCard } from "../../components/ui/ContentCollectionCard";
import { contentCollectionFormatKey } from "../../components/ui/contentCollectionFormat";
import { CreatorProfilePhoto } from "../../components/ui/CreatorProfilePhoto";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { ListSearchPanel } from "../../components/ui/ListSearchPanel";
import { Pagination } from "../../components/ui/Pagination";
import { SearchActions } from "../../components/ui/SearchActions";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { Tooltip } from "../../components/ui/Tooltip";
import { ViewModeToggle, type ViewMode } from "../../components/ui/ViewModeToggle";
import { paginate } from "../../lib/pagination";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { SOCIAL_PLATFORM_FILTER_OPTIONS } from "../../components/social/platforms";
import {
  INSPECTION_TYPE_LABELS,
  adaptContentInspection,
  adaptContentInspectionDetail,
  confirmContentInspection,
  getContentDetail,
  getContentVersionDetail,
  getCurrentGenerationContents,
  inspectContentVersion,
  runContentBatch,
  type ContentAnnotation,
  type ContentAnnotationTarget,
  type ContentInspectionFixture,
  type ContentInspectionConfirmationRequest,
  type ContentSnapshot,
  type InspectionStatus,
} from "../../entities/content";
import { getSelector, snsAccountHref, type SelectorDetail } from "../../entities/selectors";
import { getTaskRun } from "../../entities/task-run";
import { formatCompactCount, formatNumber, formatWon } from "../../lib/formatters";

const CONTENT_INSPECTION_PAGE_SIZE = 20;
const STUDIO_CONTENT_SLIDE_EXIT_MS = 180;
const STUDIO_CONTENT_SLIDE_ENTER_MS = 260;
type ContentInspectionCategory =
  | "전체"
  | "신규 등록"
  | "수정 감지"
  | "위반 확정"
  | "승인 완료";

function formatInspectionDate(value: string) {
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
  if (zoned) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          hour: "2-digit",
          hourCycle: "h23",
          minute: "2-digit",
          month: "2-digit",
          timeZone: "Asia/Seoul",
          year: "numeric",
        }).formatToParts(date).map((part) => [part.type, part.value]),
      );
      if (parts.year && parts.month && parts.day && parts.hour && parts.minute) {
        return `${parts.year.slice(2)}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
      }
    }
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[1].slice(2)}.${match[2]}.${match[3]} ${match[4]}:${match[5]}`;
}

function latestContentVersion(content: ContentInspectionFixture) {
  const versions = content.versions ?? [];
  if (versions.length === 0) {
    return {
      contentVersionId: content.contentVersionId ?? 0,
      creationReason: undefined,
      versionNo: content.latestVersionNo ?? 1,
    };
  }
  return versions.reduce((latest, version) => (
    version.versionNo > latest.versionNo ? version : latest
  ));
}

function contentSummaryBullets(content: ContentInspectionFixture) {
  return [
    content.aiSummary,
    content.report.purpose,
    content.report.flow,
    content.report.overallAssessment,
  ].flatMap((value) => {
    const text = value?.trim();
    if (!text || text === "분석 대기" || text === "분석 완료") return [];
    return [text];
  });
}

type InspectionIssueSignal = ContentInspectionFixture["report"]["signals"][number] & {
  ordinal: number;
};

type InspectionJudgment = "위반" | "정상";
type StudioContentDirection = "previous" | "next";
type StudioContentTransition =
  | "idle"
  | `exit-${StudioContentDirection}`
  | `enter-${StudioContentDirection}`;

function inspectionIssueSignals(content: ContentInspectionFixture): InspectionIssueSignal[] {
  return content.report.signals
    .filter((signal) => signal.tone !== "pass")
    .map((signal, index) => ({ ...signal, ordinal: index + 1 }));
}

function inspectionPassSignals(content: ContentInspectionFixture) {
  return content.report.signals.filter((signal) => (
    signal.tone === "pass"
    && !/미감지|감지되지 않았|감지 항목 없음/.test(`${signal.title}${signal.detail}${signal.evidence}`)
  ));
}

function issueOrdinalLabel(ordinal: number) {
  return ordinal >= 1 && ordinal <= 20 ? String.fromCharCode(0x245F + ordinal) : String(ordinal);
}

function currentDisplayedVersionNo(content: ContentInspectionFixture) {
  const matched = content.versions?.find((version) => version.contentVersionId === content.contentVersionId);
  return matched?.versionNo ?? content.latestVersionNo ?? 1;
}

function pendingInspectionCandidates(content: ContentInspectionFixture): InspectionIssueSignal[] {
  return inspectionIssueSignals(content).filter((signal) => (
    signal.violationStatus == null || signal.violationStatus === "PENDING"
  ));
}

function versionCreationReasonLabel(reason?: string) {
  if (reason === "INITIAL") return "최초 수집";
  if (reason === "SOURCE_CHANGE") return "콘텐츠 수정";
  if (reason === "EXTRACTION_CHANGE") return "추출 변경";
  return null;
}

function showsInspectionGuideline(signal: { guidance?: string; title: string }) {
  return Boolean(signal.guidance && /광고|수수료|경제적 이해/.test(signal.title));
}

function detectionSourceLabel(source: string) {
  if (source.includes("OCR")) return "OCR";
  if (source.includes("STT") || source.includes("음성")) return "STT";
  return "본문";
}

interface QueueFilterValues {
  keyword: string;
  platform: string;
}

const CONTENT_INSPECTION_CATEGORIES: readonly ContentInspectionCategory[] = [
  "전체",
  "신규 등록",
  "수정 감지",
  "위반 확정",
  "승인 완료",
];
const DEFAULT_CONTENT_INSPECTION_CATEGORY: ContentInspectionCategory = "전체";

function contentInspectionCategory(content: ContentInspectionFixture): Exclude<
  ContentInspectionCategory,
  "전체"
> {
  if (content.inspectionStatus === "승인") return "승인 완료";
  if (content.inspectionStatus === "위반") return "위반 확정";
  if (content.inspectionType !== "NEW") return "수정 감지";
  return "신규 등록";
}

function lockedViolationOnly(category: ContentInspectionCategory) {
  if (category === "위반 확정") return true;
  if (category === "승인 완료") return false;
  return null;
}

function contentInspectionCategoryTone(
  category: ContentInspectionCategory,
): NonNullable<StatusPillProps["tone"]> {
  if (category === "승인 완료") return "approved";
  if (category === "위반 확정") return "rejected";
  if (category === "수정 감지") return "pending";
  return "neutral";
}

function inspectionStatusTone(status: InspectionStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "승인") return "approved";
  if (status === "위반") return "rejected";
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
    <ListSearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyFilters} />}>
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
    </ListSearchPanel>
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
  const mainMedia = snapshot.mediaUrls.find(Boolean)
    ?? (snapshot.youtubeVideoId
      ? `https://i.ytimg.com/vi/${encodeURIComponent(snapshot.youtubeVideoId)}/hqdefault.jpg`
      : undefined);
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
  violationOnlyLocked,
  viewMode,
}: {
  contents: readonly ContentInspectionFixture[];
  onChangeView: (viewMode: ViewMode) => void;
  onChangeViolationOnly: (violationOnly: boolean) => void;
  onSelect: (content: ContentInspectionFixture) => void;
  totalCount: number;
  violationOnly: boolean;
  violationOnlyLocked: boolean;
  viewMode: ViewMode;
}) {
  return (
    <section aria-label="수집 콘텐츠 목록" className="fuma-content-collection">
      <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-applicant-result-toolbar fuma-content-inspection-toolbar">
        <div className="fuma-applicant-minimum-filter">
          <Switch
            checked={violationOnly}
            disabled={violationOnlyLocked}
            label="위반 항목만"
            onChange={(event) => onChangeViolationOnly(event.target.checked)}
          />
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
  onCollectionComplete,
  onStartInspection,
  pendingCount,
  selectedCategory,
  onSelect,
}: {
  onCollectionComplete: () => Promise<void>;
  onStartInspection: () => void;
  pendingCount: number;
  selectedCategory: ContentInspectionCategory;
  onSelect: (category: ContentInspectionCategory) => void;
}) {
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const collectionRequestRef = useRef<AbortController | null>(null);

  useEffect(() => () => collectionRequestRef.current?.abort(), []);

  const runContentCollection = async () => {
    const controller = new AbortController();
    collectionRequestRef.current = controller;
    setIsCollecting(true);
    setCollectionError(null);
    try {
      const result = await runContentBatch();
      while (!controller.signal.aborted) {
        const run = await getTaskRun(result.runId, controller.signal);
        if (run.status === "SUCCEEDED" || run.status === "PARTIAL_FAILED") {
          await onCollectionComplete();
          break;
        }
        if (run.status === "FAILED" || run.status === "STALE") {
          throw new Error("콘텐츠 동기화에 실패했습니다.");
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setCollectionError(
        error instanceof Error ? error.message : "콘텐츠 배치 실행에 실패했습니다.",
      );
    } finally {
      if (!controller.signal.aborted) setIsCollecting(false);
      if (collectionRequestRef.current === controller) collectionRequestRef.current = null;
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
      {collectionError ? (
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
  const fetchContents = useCallback(async (signal?: AbortSignal) => (
    (await getCurrentGenerationContents(signal)).map(adaptContentInspection)
  ), []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchContents(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setContents(result);
        setLoadError(null);
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
  }, [fetchContents]);
  const selectedCategory = CONTENT_INSPECTION_CATEGORIES.find(
    (category) => category === searchParams.get("category"),
  ) ?? DEFAULT_CONTENT_INSPECTION_CATEGORY;
  const lockedViolationFilter = lockedViolationOnly(selectedCategory);
  const violationOnlyLocked = lockedViolationFilter !== null;
  const violationOnly = lockedViolationFilter ?? searchParams.get("issues") === "1";
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const appliedFilters: QueueFilterValues = {
    keyword: searchParams.get("q") ?? "",
    platform: SOCIAL_PLATFORM_FILTER_OPTIONS.some(({ value }) => value === searchParams.get("platform"))
      ? searchParams.get("platform") ?? ""
      : "",
  };
  const normalizedKeyword = appliedFilters.keyword.trim().toLocaleLowerCase("ko-KR");
  const filteredContents = contents.filter((content) => {
    const matchesCategory = selectedCategory === "전체"
      || contentInspectionCategory(content) === selectedCategory;
    const hasViolation = content.report.signals.some((signal) => signal.tone !== "pass");
    const matchesKeyword = !normalizedKeyword || [
      content.id,
      content.contentTitle,
      content.author,
    ].some((value) => value.toLocaleLowerCase("ko-KR").includes(normalizedKeyword));
    const matchesPlatform = !appliedFilters.platform
      || contentPlatform(content.sourcePlatform) === appliedFilters.platform;
    return matchesCategory
      && (violationOnlyLocked || !violationOnly || hasViolation)
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
          onCollectionComplete={async () => {
            try {
              setContents(await fetchContents());
              setLoadError(null);
            } catch (error) {
              const message = error instanceof Error
                ? error.message
                : "콘텐츠 목록 조회에 실패했습니다.";
              setLoadError(message);
              throw new Error(message, { cause: error });
            }
          }}
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
          onSelect={(category) => updateListParam(
            "category",
            category,
            DEFAULT_CONTENT_INSPECTION_CATEGORY,
            true,
          )}
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
            violationOnlyLocked={violationOnlyLocked}
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
  const candidates = inspectionIssueSignals(content);
  const annotations = (snapshot.annotations ?? [])
    .filter((annotation) => annotation.state === "active")
    .map((annotation, annotationIndex) => {
      const candidateIndex = candidates.findIndex((signal) => annotationMatchesSignal(annotation, signal));
      return {
        ...annotation,
        ordinal: candidateIndex >= 0 ? candidates[candidateIndex].ordinal : annotationIndex + 1,
      };
    });

  if (snapshot === content.currentSnapshot) {
    candidates.forEach((signal) => {
      if (signal.locationAvailable !== false
        && !annotations.some((annotation) => annotationMatchesSignal(annotation, signal))) {
        annotations.push(annotationFromSignal(signal, snapshot, signal.ordinal));
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
  annotations,
  focusedOrdinal,
  onSelectViolation,
  text,
  useStoredIndexes = false,
}: {
  annotations: readonly IndexedContentAnnotation[];
  focusedOrdinal?: number;
  onSelectViolation?: (ordinal: number) => void;
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
        data-bubble={annotation.title}
        data-focused={focusedOrdinal === annotation.ordinal}
        data-ordinal={annotation.ordinal}
        data-severity={annotation.severity}
        data-violation-anchor={annotation.ordinal}
        id={focusedOrdinal !== undefined ? `violation-text-${annotation.ordinal}` : undefined}
        key={`${annotation.id}-${start}`}
        onClick={onSelectViolation ? () => onSelectViolation(annotation.ordinal) : undefined}
        tabIndex={onSelectViolation ? 0 : focusedOrdinal !== undefined ? -1 : undefined}
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
  onSelectViolation,
  showAnnotations = true,
  snapshot,
}: {
  content: ContentInspectionFixture;
  focusedViolation?: { ordinal: number; requestId: number } | null;
  label: string;
  onSelectViolation?: (ordinal: number) => void;
  showAnnotations?: boolean;
  snapshot: ContentSnapshot;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const annotations = useMemo(
    () => showAnnotations ? indexedViolationAnnotations(content, snapshot) : [],
    [content, showAnnotations, snapshot],
  );
  const firstAnnotatedMediaIndex = annotations.find((annotation) => annotation.target.kind === "media")?.target;
  const [activeMediaIndex, setActiveMediaIndex] = useState(
    firstAnnotatedMediaIndex?.kind === "media" ? firstAnnotatedMediaIndex.mediaIndex ?? 0 : 0,
  );
  const [mediaAspectRatios, setMediaAspectRatios] = useState<Record<number, number>>({});
  const [mediaNaturalSizes, setMediaNaturalSizes] = useState<
    Record<number, { height: number; width: number }>
  >({});
  const mediaItems = Array.from({ length: snapshot.mediaCount }, (_, index) => ({
    kind: snapshot.mediaKinds[index] ?? "이미지",
    url: snapshot.mediaUrls[index] ?? snapshot.mediaUrls[0],
  }));
  const visibleIndex = mediaItems.length > 0 ? activeMediaIndex % mediaItems.length : 0;
  const activeMedia = mediaItems[visibleIndex];
  const platform = contentPlatform(content.sourcePlatform);
  const isInstagram = platform === "Instagram";
  const useCarouselTrack = isInstagram && mediaItems.length > 1;
  const embedUrl = isInstagram ? null : youtubeEmbedUrl(snapshot.youtubeVideoId);
  const isVerticalVideo = content.contentFormat === "인스타 릴스" || content.contentFormat === "유튜브 쇼츠";
  const activeMediaAnnotations = annotations.filter((annotation) => (
    annotation.target.kind === "media" && annotation.target.mediaIndex === visibleIndex
  ));
  const headerAnnotations = annotations.filter((annotation) => (
    annotation.target.kind === "media" && annotation.target.mediaIndex === undefined
  ));
  const frameAspectRatio = isVerticalVideo ? 9 / 16 : isInstagram ? 4 / 5 : 16 / 9;
  const mediaAspectRatio = embedUrl
    ? 16 / 9
    : mediaAspectRatios[visibleIndex] ?? (isVerticalVideo ? 9 / 16 : isInstagram ? 1 : 16 / 9);
  const mediaStageFit = embedUrl ? "fill" : mediaAspectRatio >= frameAspectRatio ? "width" : "height";
  const handle = content.accountId ?? content.author;
  const avatarUrl = content.profileImageUrl ?? "";
  const [year, month, day] = snapshot.capturedAt.slice(0, 10).split("-");
  const postDate = `${Number(year)}년 ${Number(month)}월 ${Number(day)}일`;

  const moveMedia = (direction: -1 | 1) => {
    setActiveMediaIndex((current) => Math.min(
      Math.max(current + direction, 0),
      mediaItems.length - 1,
    ));
  };

  const recordMediaSize = (index: number, image: HTMLImageElement) => {
    const { naturalHeight, naturalWidth } = image;
    if (naturalHeight <= 0 || naturalWidth <= 0) return;
    setMediaAspectRatios((current) => ({
      ...current,
      [index]: naturalWidth / naturalHeight,
    }));
    setMediaNaturalSizes((current) => ({
      ...current,
      [index]: { height: naturalHeight, width: naturalWidth },
    }));
  };

  useEffect(() => {
    if (!focusedViolation) return;
    const annotation = annotations.find(({ ordinal }) => ordinal === focusedViolation.ordinal);
    if (!annotation) return;
    const animationFrame = window.requestAnimationFrame(() => {
      if (annotation.target.kind === "media"
        && annotation.target.mediaIndex !== undefined
        && visibleIndex !== annotation.target.mediaIndex) {
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
      <header>
        <strong>{label}</strong>
        {headerAnnotations.map((annotation) => (
          <button
            aria-label={`위반 ${annotation.ordinal}: ${annotation.title}`}
            className="fuma-minimal-version-card__media-warning"
            key={annotation.id}
            onClick={() => onSelectViolation?.(annotation.ordinal)}
            type="button"
          >
            {annotation.ordinal} {annotation.title}
          </button>
        ))}
        <time>{snapshot.capturedAt}</time>
      </header>
      <div className="fuma-platform-inspection-frame">
        {isInstagram ? (
          <div className="fuma-platform-inspection-frame__instagram-header">
            <span className="fuma-platform-inspection-frame__avatar">
              {avatarUrl
                ? <CreatorProfilePhoto creatorName={content.author} src={avatarUrl} />
                : <UserRound aria-label="익명 프로필 이미지" role="img" size={19} />}
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
            ) : useCarouselTrack ? (
              <div
                className="fuma-platform-inspection-frame__carousel-track"
                style={{ transform: `translateX(-${visibleIndex * 100}%)` }}
              >
                {mediaItems.map((media, index) => media.url ? (
                  <img
                    alt={`${content.author} ${label} 미디어 ${index + 1}`}
                    key={`${media.url}-${index}`}
                    onLoad={(event) => recordMediaSize(index, event.currentTarget)}
                    src={media.url}
                  />
                ) : null)}
              </div>
            ) : activeMedia?.url ? (
              <img
                alt={`${content.author} ${label} 미디어 ${visibleIndex + 1}`}
                onLoad={(event) => recordMediaSize(visibleIndex, event.currentTarget)}
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
                  const naturalSize = mediaNaturalSizes[visibleIndex];
                  const displayedBox = box && annotation.target.boxUnit === "pixel"
                    ? naturalSize
                      ? {
                          height: box.height / naturalSize.height * 100,
                          left: box.x / naturalSize.width * 100,
                          top: box.y / naturalSize.height * 100,
                          width: box.width / naturalSize.width * 100,
                        }
                      : null
                    : box
                      ? { height: box.height, left: box.x, top: box.y, width: box.width }
                      : null;
                  return (
                    <button
                      aria-current={focusedViolation?.ordinal === annotation.ordinal}
                      aria-label={`위반 ${annotation.ordinal}: ${annotation.title}`}
                      className={`fuma-platform-inspection-frame__violation-box${displayedBox ? "" : " is-marker-only"}`}
                      data-focused={focusedViolation?.ordinal === annotation.ordinal}
                      data-severity={annotation.severity}
                      data-violation-anchor={annotation.ordinal}
                      id={focusedViolation != null ? `${content.id}-violation-${annotation.ordinal}` : undefined}
                      key={annotation.id}
                      onClick={() => onSelectViolation?.(annotation.ordinal)}
                      style={displayedBox ? {
                        height: `${displayedBox.height}%`,
                        left: `${displayedBox.left}%`,
                        top: `${displayedBox.top}%`,
                        width: `${displayedBox.width}%`,
                      } : undefined}
                      type="button"
                    >
                      <span className="fuma-inspection-annotation-pin">{annotation.ordinal}</span>
                      <small>
                        {timeRange
                          ? `${annotation.title} · ${timeRange.start}–${timeRange.end}`
                          : annotation.title}
                      </small>
                    </button>
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
              {visibleIndex > 0 ? (
                <button aria-label="이전 사진" className="is-prev" onClick={() => moveMedia(-1)} type="button"><ChevronLeft aria-hidden="true" size={17} /></button>
              ) : null}
              {visibleIndex < mediaItems.length - 1 ? (
                <button aria-label="다음 사진" className="is-next" onClick={() => moveMedia(1)} type="button"><ChevronRight aria-hidden="true" size={17} /></button>
              ) : null}
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
              <p><b>{handle}</b>{" "}<ViolationHighlightedText annotations={annotations} focusedOrdinal={focusedViolation?.ordinal} onSelectViolation={onSelectViolation} text={snapshot.text} useStoredIndexes /></p>
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
                <span>
                  <strong>
                    {content.author}
                    <CheckCircle2 aria-label="인증된 채널" size={14} />
                  </strong>
                  <small>{handle}</small>
                </span>
                <span className="fuma-platform-inspection-frame__youtube-subscriptions">
                  <button className="is-membership" type="button">가입</button>
                  <button className="is-subscribe" type="button">구독</button>
                </span>
              </div>
              <div className="fuma-platform-inspection-frame__youtube-actions">
                <span className="fuma-platform-inspection-frame__youtube-rating">
                  <button type="button"><ThumbsUp aria-hidden="true" size={18} /> 좋아요</button>
                  <button aria-label="싫어요" type="button"><ThumbsDown aria-hidden="true" size={18} /></button>
                </span>
                <button type="button"><Share2 aria-hidden="true" size={17} /> 공유</button>
                <button type="button"><Bookmark aria-hidden="true" size={17} /> 저장</button>
                <button aria-label="더보기" type="button"><MoreHorizontal aria-hidden="true" size={18} /></button>
              </div>
            </div>
            <div className="fuma-platform-inspection-frame__youtube-description">
              <strong>{postDate}</strong>
              <p><ViolationHighlightedText annotations={annotations} focusedOrdinal={focusedViolation?.ordinal} onSelectViolation={onSelectViolation} text={snapshot.text} useStoredIndexes /></p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function MinimalAiAnalysis({
  content,
  focusedOrdinal,
  onSelectViolation,
}: {
  content: ContentInspectionFixture;
  focusedOrdinal?: number;
  onSelectViolation: (ordinal: number) => void;
}) {
  const analysisPending = content.aiStatus === "pending";
  const summaryBullets = analysisPending ? [] : contentSummaryBullets(content);
  const issues = inspectionIssueSignals(content);
  const passSignals = inspectionPassSignals(content);
  const extracts = content.report.extracts;
  const versionNo = currentDisplayedVersionNo(content);
  const showChanges = versionNo > 1 && content.changeItems.length > 0;

  return (
    <section
      aria-label="AI 분석"
      className="fuma-minimal-inspection-section fuma-creator-analysis-report fuma-content-analysis-report fuma-content-ai-summary"
    >
      <header className="fuma-minimal-inspection-section__header fuma-content-analysis-report__header">
        <div><span>AI ANALYSIS</span><h3>AI 분석</h3></div>
      </header>
      <div className="fuma-creator-analysis-report__content">
        {analysisPending ? (
          <p>분석 대기</p>
        ) : (
          <>
            <section aria-label="콘텐츠 요약" className="fuma-content-analysis-summary">
              <span>콘텐츠 요약</span>
              {summaryBullets.length > 0 ? (
                <ul>
                  {summaryBullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              ) : (
                <p>요약 정보가 없습니다.</p>
              )}
            </section>
            <section aria-label="검수 근거" className="fuma-content-inspection-evidence">
              <header>
                <h4>검수 근거</h4>
                <span>위반 후보 {issues.length}건</span>
              </header>
              {issues.length > 0 ? (
                <ul>
                  {issues.map((issue) => (
                    <li key={issue.violationEvidenceHistoryId
                      ?? `${issue.ordinal}-${issue.title}`}>
                      <button
                        aria-current={focusedOrdinal === issue.ordinal}
                        className="fuma-content-inspection-evidence__item"
                        data-focused={focusedOrdinal === issue.ordinal}
                        onClick={() => onSelectViolation(issue.ordinal)}
                        type="button"
                      >
                        <strong>
                          {issueOrdinalLabel(issue.ordinal)} {issue.title}
                          {issue.detectorSource ? (
                            <span className="fuma-content-inspection-evidence__source">
                              {issue.detectorSource}
                              {issue.inspectionPolicyId != null
                                ? ` · 정책 #${issue.inspectionPolicyId}`
                                : ""}
                            </span>
                          ) : null}
                        </strong>
                        <p>{issue.detail}</p>
                        <dl>
                          <div>
                            <dt>위치</dt>
                            <dd>{issue.source}</dd>
                          </div>
                          <div>
                            <dt>{detectionSourceLabel(issue.source)}</dt>
                            <dd>{issue.evidence.trim() || "검출 문구 없음"}</dd>
                          </div>
                        </dl>
                        {showsInspectionGuideline(issue) ? (
                          <aside>
                            <span>검수 기준</span>
                            <p>{issue.guidance}</p>
                          </aside>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>표시할 위반 근거가 없습니다.</p>
              )}
              {passSignals.length > 0 ? (
                <details>
                  <summary>정상 항목 {passSignals.length}건</summary>
                  <ul>
                    {passSignals.map((signal) => (
                      <li key={signal.title}>
                        <strong>{signal.title}</strong>
                        <span>{signal.detail}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {extracts.length > 0 ? (
                <details>
                  <summary>전체 추출 내용 보기</summary>
                  {extracts.map((extract) => (
                    <p key={`${extract.type}-${extract.location}`}>
                      <strong>{extract.type}</strong> {extract.text}
                    </p>
                  ))}
                </details>
              ) : null}
            </section>
            {showChanges ? (
              <section aria-label="이전 버전 대비 변경" className="fuma-content-inspection-changes">
                <h4>이전 버전 대비 변경</h4>
                <p>v{versionNo - 1} → v{versionNo}</p>
                <ul>
                  {content.changeItems.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function MinimalFinalInspection({
  content,
  focusedOrdinal,
  onNavigateToViolation,
  onConfirm,
  readOnly,
}: {
  content: ContentInspectionFixture;
  focusedOrdinal?: number;
  onNavigateToViolation: (ordinal: number) => void;
  onConfirm: (request: ContentInspectionConfirmationRequest) => Promise<number>;
  readOnly: boolean;
}) {
  const [decision, setDecision] = useState<"승인" | "반려" | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [confirmationFeedback, setConfirmationFeedback] = useState<string | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const analysisPending = content.aiStatus === "pending";
  const candidates = readOnly ? [] : pendingInspectionCandidates(content);
  const [judgments, setJudgments] = useState<Partial<Record<number, InspectionJudgment>>>({});
  const judgedCount = candidates.filter((candidate) => judgments[candidate.ordinal]).length;
  const allJudged = candidates.length === 0 || judgedCount === candidates.length;
  const hasViolationJudgment = candidates.some((candidate) => judgments[candidate.ordinal] === "위반");
  const approveEnabled = !analysisPending && allJudged && !hasViolationJudgment;
  const rejectEnabled = !analysisPending && allJudged && hasViolationJudgment;

  const setJudgment = (ordinal: number, judgment: InspectionJudgment) => {
    setJudgments((current) => {
      if (current[ordinal] === judgment) {
        const next = { ...current };
        delete next[ordinal];
        return next;
      }
      return { ...current, [ordinal]: judgment };
    });
    setDecision(null);
    setConfirmationError(null);
    setConfirmationFeedback(null);
  };

  const submitDecision = async (selected: "승인" | "반려") => {
    if (confirmationPending) return;
    const missingViolationId = candidates.some((candidate) => candidate.violationItemId == null);
    if (missingViolationId) {
      setConfirmationError("확정할 위반 항목 ID가 없습니다.");
      return;
    }
    const violations = candidates.map((candidate) => {
      return {
        status: judgments[candidate.ordinal] === "위반"
          ? "VIOLATION_CONFIRMED" as const
          : "DISMISSED" as const,
        violationItemId: candidate.violationItemId as number,
      };
    });
    setConfirmationPending(true);
    setConfirmationError(null);
    setConfirmationFeedback(null);
    try {
      const updatedCount = await onConfirm({
        decision: selected === "승인" ? "APPROVED" : "REJECTED",
        violations,
      });
      setDecision(selected);
      setConfirmationFeedback(`${selected} 처리했습니다. 위반 항목 ${updatedCount}건을 갱신했습니다.`);
    } catch (error: unknown) {
      setConfirmationError(error instanceof Error
        ? error.message
        : "콘텐츠 검수 확정에 실패했습니다.");
    } finally {
      setConfirmationPending(false);
    }
  };

  return (
    <section aria-label="최종 검수" className="fuma-minimal-final-inspection">
      <header>
        <div><span>FINAL INSPECTION</span><h3>최종 검수</h3></div>
        <ShieldCheck aria-hidden="true" size={22} />
      </header>
      <dl>
        <div><dt>검수 상태</dt><dd>{decision ?? "검수 전"}</dd></div>
        <div><dt>후보 판정</dt><dd>{judgedCount} / {candidates.length}</dd></div>
      </dl>
      <section className="fuma-minimal-final-inspection__candidates">
        <header><strong>위반 여부 판정</strong><span>{judgedCount}/{candidates.length}</span></header>
        {analysisPending ? (
          <p>위반 정보 없음</p>
        ) : candidates.length > 0 ? candidates.map((candidate) => {
          const judgment = judgments[candidate.ordinal];
          return (
            <article
              data-focused={focusedOrdinal === candidate.ordinal}
              data-judgment={judgment ?? "pending"}
              key={candidate.violationEvidenceHistoryId
                ?? `${candidate.source}-${candidate.title}`}
            >
              <button
                aria-current={focusedOrdinal === candidate.ordinal}
                aria-label={`${issueOrdinalLabel(candidate.ordinal)} ${candidate.title} 위반 위치로 이동`}
                className="fuma-minimal-final-inspection__candidate-jump"
                onClick={() => onNavigateToViolation(candidate.ordinal)}
                type="button"
              >
                <strong>{issueOrdinalLabel(candidate.ordinal)} {candidate.title}</strong>
                <small>AI 판정 · 위반 후보</small>
                <blockquote>“{candidate.evidence}”</blockquote>
                <small>{candidate.detail || candidate.source}</small>
              </button>
              <div className="fuma-minimal-final-inspection__candidate-actions">
                <span>관리자 판정</span>
                <Button
                  aria-pressed={judgment === "위반"}
                  onClick={() => setJudgment(candidate.ordinal, "위반")}
                >
                  위반
                </Button>
                <Button
                  aria-pressed={judgment === "정상"}
                  onClick={() => setJudgment(candidate.ordinal, "정상")}
                >
                  정상
                </Button>
              </div>
            </article>
          );
        }) : (
            <p><CheckCircle2 aria-hidden="true" size={15} /> {readOnly
              ? "과거 버전은 위반 이력 조회만 가능합니다."
              : "판정할 위반 후보가 없습니다."}</p>
        )}
      </section>
      <div className="fuma-minimal-final-inspection__actions">
        <Button
          aria-pressed={decision === "반려"}
          className={decision === "반려" ? "is-rejected" : undefined}
          disabled={!rejectEnabled || confirmationPending}
          onClick={() => void submitDecision("반려")}
        >
          반려
        </Button>
        <Button
          aria-pressed={decision === "승인"}
          className={decision === "승인" ? "is-approved" : undefined}
          disabled={!approveEnabled || confirmationPending}
          onClick={() => void submitDecision("승인")}
        >
          승인
        </Button>
      </div>
      {analysisPending
        ? <p>분석이 완료된 후 최종 검수를 진행할 수 있습니다.</p>
        : confirmationError ? <p role="alert">{confirmationError}</p>
          : confirmationFeedback ? <p role="status">{confirmationFeedback}</p>
            : decision ? <p>{decision}으로 선택했습니다.</p> : null}
    </section>
  );
}

function ContentInspectionDetailContent({
  content,
  nextContent,
  onBack,
  onNext,
  remainingCount,
}: {
  content: ContentInspectionFixture;
  nextContent?: ContentInspectionFixture;
  onBack: () => void;
  onNext: () => void;
  remainingCount: number;
}) {
  const [focusedViolation, setFocusedViolation] = useState<{
    ordinal: number;
    requestId: number;
  } | null>(null);
  const [versionOverride, setVersionOverride] = useState<ContentInspectionFixture | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [inspectionFeedback, setInspectionFeedback] = useState<string | null>(null);
  const [inspectionPending, setInspectionPending] = useState(false);
  const versionRequestRef = useRef<AbortController | null>(null);
  const displayed = versionOverride?.id === content.id ? versionOverride : content;
  const versionSource = versionOverride?.versions?.length ? versionOverride : content;
  const latestVersion = latestContentVersion(versionSource);
  const versions = [...(versionSource.versions ?? [])]
    .sort((left, right) => right.versionNo - left.versionNo);
  const versionOptions = (versions.length > 0 ? versions : [latestVersion]).map((version) => ({
    label: [
      `v${version.versionNo}`,
      versionCreationReasonLabel(version.creationReason),
      version.contentVersionId === latestVersion.contentVersionId ? "최신 버전" : null,
    ].filter(Boolean).join(" · "),
    value: String(version.contentVersionId),
  }));

  const navigateToViolation = (ordinal: number) => {
    setFocusedViolation((current) => (
      current?.ordinal === ordinal
        ? null
        : {
            ordinal,
            requestId: (current?.requestId ?? 0) + 1,
          }
    ));
  };

  const selectVersion = (contentVersionId: number) => {
    versionRequestRef.current?.abort();
    setVersionError(null);
    if (contentVersionId === content.contentVersionId) {
      setVersionOverride(null);
      return;
    }

    const controller = new AbortController();
    versionRequestRef.current = controller;
    void getContentVersionDetail(Number(content.id), contentVersionId, controller.signal)
      .then((detail) => {
        setVersionOverride(adaptContentInspectionDetail(detail, content));
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setVersionError(error instanceof Error ? error.message : "콘텐츠 버전 조회에 실패했습니다.");
      });
  };

  const runInspection = async () => {
    versionRequestRef.current?.abort();
    const controller = new AbortController();
    versionRequestRef.current = controller;
    setInspectionPending(true);
    setInspectionFeedback(null);
    setVersionError(null);
    try {
      const result = await inspectContentVersion(
        latestVersion.contentVersionId, controller.signal,
      );
      const detail = await getContentVersionDetail(
        Number(content.id), result.inspectedContentVersionId, controller.signal,
      );
      setVersionOverride(adaptContentInspectionDetail(detail, content));
      setFocusedViolation(null);
      setInspectionFeedback(result.versionCreated
        ? `추출 정책 변경으로 v${detail.selectedVersion.versionNo}을 생성해 검수했습니다.`
        : `v${detail.selectedVersion.versionNo} 검수를 완료했습니다.`);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      setVersionError(error instanceof Error ? error.message : "콘텐츠 검수 실행에 실패했습니다.");
    } finally {
      setInspectionPending(false);
    }
  };

  const confirmInspection = async (request: ContentInspectionConfirmationRequest) => {
    const contentVersionId = displayed.contentVersionId ?? latestVersion.contentVersionId;
    const result = await confirmContentInspection(
      Number(content.id), contentVersionId, request,
    );
    const detail = await getContentVersionDetail(Number(content.id), contentVersionId);
    setVersionOverride(adaptContentInspectionDetail(detail, content));
    setFocusedViolation(null);
    return result.updatedCount;
  };

  useEffect(() => () => versionRequestRef.current?.abort(), []);

  return (
    <>
      <div className="fuma-detail-toolbar fuma-minimal-inspection-toolbar">
        <button className="hsas-button fuma-detail-toolbar__link" onClick={onBack} type="button">
          <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.8} />
          대기열
        </button>
        <div className="fuma-minimal-inspection-toolbar__next">
          <span><strong>{remainingCount}건</strong>의 콘텐츠가 남았습니다.</span>
          <Button
            disabled={inspectionPending}
            onClick={() => void runInspection()}
            variant="secondary"
          >
            {inspectionPending ? "검수 중" : "자동 검수 실행"}
          </Button>
          <Button
            className="fuma-content-inspection-next-button"
            disabled={!nextContent}
            onClick={onNext}
            variant="primary"
          >
            다음 콘텐츠 <ChevronRight aria-hidden="true" size={14} />
          </Button>
        </div>
      </div>
      {versionError ? (
        <p
          className="fuma-content-inspection-collection-feedback fuma-content-inspection-collection-feedback--error"
          role="alert"
        >
          {versionError}
        </p>
      ) : null}
      {inspectionFeedback ? (
        <p className="fuma-content-inspection-collection-feedback" role="status">
          {inspectionFeedback}
        </p>
      ) : null}
      <div className="fuma-minimal-inspection-layout">
        <main className="fuma-minimal-inspection-main">
          <section aria-label="셀렉터스 계정" className="fuma-content-inspection-identity">
            <div className="fuma-content-inspection-author">
              <CreatorProfilePhoto creatorName={content.author} src={content.profileImageUrl ?? ""} />
              <div className="fuma-content-inspection-author__copy">
                <div className="fuma-content-inspection-author__account">
                  <strong>{content.author}</strong>
                  <div>
                    <PlatformIcon decorative platform={contentPlatform(content.sourcePlatform)} />
                  </div>
                  <small>{content.accountId ?? content.author}</small>
                </div>
                <p className="fuma-content-inspection-author__title">{displayed.contentTitle}</p>
                <p className="fuma-content-inspection-author__format">
                  {displayed.sourcePlatform} · {displayed.contentFormat}
                </p>
              </div>
            </div>
            <div className="fuma-content-inspection-meta">
              <dl className="fuma-content-inspection-meta__dates">
                <div>
                  <dt>최초 등록일</dt>
                  <dd>
                    <time dateTime={content.submittedAt}>
                      {formatInspectionDate(content.submittedAt)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt>마지막 수정</dt>
                  <dd>
                    <time dateTime={displayed.currentSnapshot.capturedAt}>
                      {formatInspectionDate(displayed.currentSnapshot.capturedAt)}
                    </time>
                  </dd>
                </div>
              </dl>
              <label className="fuma-content-inspection-meta__version">
                <span>버전</span>
                <Select
                  aria-label="버전"
                  onChange={(event) => selectVersion(Number(event.target.value))}
                  options={versionOptions}
                  value={String(displayed.contentVersionId ?? latestVersion.contentVersionId)}
                />
              </label>
            </div>
          </section>
          <section
            aria-label="콘텐츠 원문"
            className="fuma-minimal-inspection-section fuma-creator-analysis-report fuma-content-analysis-report fuma-content-original"
          >
            <header className="fuma-minimal-inspection-section__header fuma-content-analysis-report__header">
              <div><span>CONTENT</span><h3>콘텐츠 원문</h3></div>
            </header>
            <div className="fuma-creator-analysis-report__content">
              <MinimalVersionCard
                content={displayed}
                focusedViolation={focusedViolation}
                label="콘텐츠 원문"
                onSelectViolation={navigateToViolation}
                snapshot={displayed.currentSnapshot}
              />
            </div>
          </section>
          <MinimalAiAnalysis
            content={displayed}
            focusedOrdinal={focusedViolation?.ordinal}
            onSelectViolation={navigateToViolation}
          />
        </main>
        <aside className="fuma-minimal-inspection-sidebar">
          <MinimalFinalInspection
            content={displayed}
            focusedOrdinal={focusedViolation?.ordinal}
            key={`${displayed.id}-${displayed.contentVersionId ?? "latest"}`}
            onConfirm={confirmInspection}
            onNavigateToViolation={navigateToViolation}
            readOnly={currentDisplayedVersionNo(displayed) < latestVersion.versionNo}
          />
        </aside>
      </div>
    </>
  );
}

export function ContentInspectionDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [studioDecision, setStudioDecision] = useState<"approve" | "reject" | null>(null);
  const [studioSelector, setStudioSelector] = useState<SelectorDetail | null>(null);
  const [studioHistoricalContents, setStudioHistoricalContents] = useState<ContentInspectionFixture[]>([]);
  const [studioHistoryError, setStudioHistoryError] = useState<string | null>(null);
  const [studioHistoryPending, setStudioHistoryPending] = useState(false);
  const [studioActionPending, setStudioActionPending] = useState<"report" | "confirmation" | null>(null);
  const [studioActionError, setStudioActionError] = useState<string | null>(null);
  const [studioActionFeedback, setStudioActionFeedback] = useState<string | null>(null);
  const [studioReportRefreshVersionId, setStudioReportRefreshVersionId] = useState<number | null>(null);
  const [studioViolationJudgments, setStudioViolationJudgments] = useState<
    Array<"violation" | "clear" | null>
  >([]);
  const [focusedStudioViolationIndex, setFocusedStudioViolationIndex] = useState(-1);
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);
  const [studioExiting, setStudioExiting] = useState(false);
  const [studioContentTransition, setStudioContentTransition] = useState<StudioContentTransition>("idle");
  const studioReportRef = useRef<HTMLElement>(null);
  const studioDecisionRef = useRef<HTMLDivElement>(null);
  const studioVersionsRef = useRef<HTMLElement>(null);
  const studioHistoryRequestRef = useRef<AbortController | null>(null);
  const studioActionRequestRef = useRef<AbortController | null>(null);
  const studioDetailRequestRef = useRef<AbortController | null>(null);
  const studioWheelLockedRef = useRef(false);
  const studioWheelReleaseTimerRef = useRef<number | null>(null);
  const studioContentTransitionRef = useRef<StudioContentTransition>("idle");
  const studioContentTransitionTimerRef = useRef<number | null>(null);
  const { contentId } = useParams();
  const numericContentId = Number(contentId);
  const invalidContentId = !Number.isSafeInteger(numericContentId) || numericContentId <= 0;
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
  const [loadError, setLoadError] = useState<{ id: string; message: string } | null>(null);
  const baseContent = detailContents.find((item) => item.id === contentId);
  const content = baseContent;
  const studioLatestVersion = baseContent
    ? latestContentVersion(baseContent)
    : null;
  const studioVersions = baseContent
    ? [...(baseContent.versions ?? [])].sort((left, right) => right.versionNo - left.versionNo)
    : [];
  const studioHistoricalVersionSummaries = studioLatestVersion
    ? studioVersions
        .filter(({ contentVersionId }) => contentVersionId !== studioLatestVersion.contentVersionId)
        .sort((left, right) => left.versionNo - right.versionNo)
    : [];
  const studioHistoryVersionKey = studioHistoricalVersionSummaries
    .map(({ contentVersionId }) => contentVersionId)
    .join(",");
  const visibleStudioHistoricalContents = studioHistoricalContents
    .filter((item) => item.id === contentId)
    .sort((left, right) => currentDisplayedVersionNo(left) - currentDisplayedVersionNo(right));
  const studioReviewReadOnly = content != null && content.inspectionStatus !== "검수 대기";
  const studioViolationSignals = useMemo(
    () => content
      ? studioReviewReadOnly
        ? inspectionIssueSignals(content)
        : pendingInspectionCandidates(content)
      : [],
    [content, studioReviewReadOnly],
  );
  const studioReportReady = content?.aiStatus === "ready";
  const studioViolationReviewComplete = studioReportReady
    && !studioReviewReadOnly
    && studioReportRefreshVersionId === null
    && studioViolationJudgments.length === studioViolationSignals.length
    && studioViolationJudgments.every(Boolean);
  const studioFinalFocused = studioViolationReviewComplete
    && focusedStudioViolationIndex < 0;
  const studioCardFocusedViolation = useMemo(() => {
    const focused = focusedStudioViolationIndex >= 0
      ? studioViolationSignals[focusedStudioViolationIndex]
      : undefined;
    return focused
      ? { ordinal: focused.ordinal, requestId: focusedStudioViolationIndex }
      : null;
  }, [focusedStudioViolationIndex, studioViolationSignals]);
  const judgedStudioViolationCount = studioViolationJudgments.filter(Boolean).length;
  const hasStudioViolationJudgment = studioViolationJudgments.includes("violation");
  const visibleError = loadError !== null && loadError.id === contentId
    ? loadError.message
    : null;
  const returnPath = routeState?.from;
  const pendingContents = inspectionRequiredContents(detailContents);
  const currentPendingIndex = pendingContents.findIndex((item) => item.id === contentId);
  const previousContent = currentPendingIndex > 0
    ? pendingContents[currentPendingIndex - 1]
    : undefined;
  const nextContent = currentPendingIndex >= 0
    ? pendingContents[currentPendingIndex + 1]
    : pendingContents[0];
  const studioInspectionComplete = studioReviewReadOnly
    && currentPendingIndex < 0
    && !nextContent;
  const studioShowFinish = studioInspectionComplete
    || (currentPendingIndex >= 0 && currentPendingIndex === pendingContents.length - 1);
  const remainingCount = currentPendingIndex >= 0
    ? Math.max(0, pendingContents.length - currentPendingIndex - 1)
    : pendingContents.length;
  const navigateStudioContent = useCallback((
    target?: ContentInspectionFixture,
    direction: StudioContentDirection = "next",
    contents: ContentInspectionFixture[] = detailContents,
  ) => {
    if (!target || studioContentTransitionRef.current !== "idle") return;
    studioHistoryRequestRef.current?.abort();
    studioActionRequestRef.current?.abort();
    studioActionRequestRef.current = null;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const exitDuration = reducedMotion ? 0 : STUDIO_CONTENT_SLIDE_EXIT_MS;
    const enterDuration = reducedMotion ? 0 : STUDIO_CONTENT_SLIDE_ENTER_MS;
    const exitTransition = `exit-${direction}` as const;
    const enterTransition = `enter-${direction}` as const;

    studioContentTransitionRef.current = exitTransition;
    setStudioContentTransition(exitTransition);
    if (studioContentTransitionTimerRef.current != null) {
      window.clearTimeout(studioContentTransitionTimerRef.current);
    }
    studioContentTransitionTimerRef.current = window.setTimeout(() => {
      setStudioDecision(null);
      setStudioSelector(null);
      setStudioHistoricalContents([]);
      setStudioHistoryError(null);
      setStudioHistoryPending(false);
      setStudioActionPending(null);
      setStudioActionError(null);
      setStudioActionFeedback(null);
      setStudioReportRefreshVersionId(null);
      setStudioViolationJudgments([]);
      setFocusedStudioViolationIndex(-1);
      navigate(`/content/inspections/${target.id}`, {
        state: { ...routeState, content: target, contents, inspectionSession: true },
      });
      studioContentTransitionRef.current = enterTransition;
      setStudioContentTransition(enterTransition);
      studioContentTransitionTimerRef.current = window.setTimeout(() => {
        studioContentTransitionRef.current = "idle";
        studioContentTransitionTimerRef.current = null;
        setStudioContentTransition("idle");
      }, enterDuration);
    }, exitDuration);
  }, [detailContents, navigate, routeState]);

  const judgeStudioViolation = useCallback((
    index: number,
    judgment: "violation" | "clear",
  ) => {
    setStudioDecision(null);
    setStudioViolationJudgments((current) => {
      const next = Array.from(
        { length: studioViolationSignals.length },
        (_, signalIndex) => current[signalIndex] ?? null,
      );
      next[index] = judgment;
      return next;
    });
  }, [studioViolationSignals.length]);

  const judgeStudioViolationAndAdvance = useCallback((
    index: number,
    judgment: "violation" | "clear",
  ) => {
    judgeStudioViolation(index, judgment);
    setFocusedStudioViolationIndex(
      index + 1 < studioViolationSignals.length ? index + 1 : -1,
    );
  }, [judgeStudioViolation, studioViolationSignals.length]);

  const selectStudioViolationFromContent = useCallback((ordinal: number) => {
    const index = studioViolationSignals.findIndex((signal) => signal.ordinal === ordinal);
    if (index >= 0) setFocusedStudioViolationIndex(index);
  }, [studioViolationSignals]);

  const generateStudioReport = useCallback(async () => {
    if (
      !baseContent
      || !studioLatestVersion
      || studioReviewReadOnly
      || studioActionPending
      || studioActionRequestRef.current
    ) return;
    if (studioLatestVersion.contentVersionId <= 0) {
      setStudioActionError("검수할 콘텐츠 버전 ID가 없습니다.");
      return;
    }

    const controller = new AbortController();
    studioDetailRequestRef.current?.abort();
    studioDetailRequestRef.current = null;
    studioActionRequestRef.current = controller;
    setStudioActionPending("report");
    setStudioActionError(null);
    setStudioActionFeedback(null);
    let inspectedVersionId = studioReportRefreshVersionId;
    let versionCreated: boolean | null = null;
    try {
      if (inspectedVersionId == null) {
        const result = await inspectContentVersion(
          studioLatestVersion.contentVersionId,
          controller.signal,
        );
        inspectedVersionId = result.inspectedContentVersionId;
        versionCreated = result.versionCreated;
        setStudioReportRefreshVersionId(inspectedVersionId);
      }
      const detail = await getContentVersionDetail(
        Number(baseContent.id),
        inspectedVersionId,
        controller.signal,
      );
      const adapted = adaptContentInspectionDetail(detail, baseContent);
      const refreshedSignals = pendingInspectionCandidates(adapted);
      setDetailContents((current) => (
        current.some((item) => item.id === adapted.id)
          ? current.map((item) => item.id === adapted.id ? adapted : item)
          : [adapted, ...current]
      ));
      setStudioHistoryError(null);
      setStudioReportRefreshVersionId(null);
      setStudioViolationJudgments(Array(refreshedSignals.length).fill(null));
      setFocusedStudioViolationIndex(refreshedSignals.length > 0 ? 0 : -1);
      setStudioDecision(null);
      setStudioActionFeedback(versionCreated === true
        ? `v${detail.selectedVersion.versionNo} 리포트를 생성했습니다.`
        : versionCreated === false
          ? `v${detail.selectedVersion.versionNo} 리포트를 갱신했습니다.`
          : `v${detail.selectedVersion.versionNo} 리포트를 불러왔습니다.`);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      if (inspectedVersionId != null) {
        setStudioReportRefreshVersionId(inspectedVersionId);
        setStudioActionError(versionCreated == null
          ? "생성된 리포트를 불러오지 못했습니다. 다시 눌러 불러오세요."
          : "리포트 생성은 완료됐지만 불러오지 못했습니다. 다시 눌러 불러오세요.");
      } else {
        setStudioActionError(error instanceof Error
          ? error.message
          : "리포트 생성에 실패했습니다.");
      }
    } finally {
      if (studioActionRequestRef.current === controller) {
        studioActionRequestRef.current = null;
        if (!controller.signal.aborted) setStudioActionPending(null);
      }
    }
  }, [
    baseContent,
    studioActionPending,
    studioLatestVersion,
    studioReportRefreshVersionId,
    studioReviewReadOnly,
  ]);

  const submitStudioDecision = useCallback(async (selected: "approve" | "reject") => {
    if (
      !content
      || !content.contentVersionId
      || !studioFinalFocused
      || studioReviewReadOnly
      || studioActionPending
      || studioActionRequestRef.current
    ) return;
    if (selected === "reject" ? !hasStudioViolationJudgment : hasStudioViolationJudgment) {
      setStudioActionError(hasStudioViolationJudgment
        ? "위반 판정이 있어 최종 반려만 가능합니다."
        : "모든 항목이 위반 아님이므로 최종 승인만 가능합니다.");
      return;
    }
    if (studioViolationSignals.some((signal) => signal.violationItemId == null)) {
      setStudioActionError("확정할 위반 항목 ID가 없습니다.");
      return;
    }

    const contentVersionId = content.contentVersionId;
    const controller = new AbortController();
    studioActionRequestRef.current = controller;
    setStudioDecision(selected);
    setStudioActionPending("confirmation");
    setStudioActionError(null);
    setStudioActionFeedback(null);
    try {
      const result = await confirmContentInspection(
        Number(content.id),
        contentVersionId,
        {
          decision: selected === "approve" ? "APPROVED" : "REJECTED",
          violations: studioViolationSignals.map((signal, index) => ({
            status: studioViolationJudgments[index] === "violation"
              ? "VIOLATION_CONFIRMED"
              : "DISMISSED",
            violationItemId: signal.violationItemId as number,
          })),
        },
        controller.signal,
      );
      setStudioActionFeedback(
        `${selected === "approve" ? "승인" : "반려"} 처리했습니다. 위반 항목 ${result.updatedCount}건을 갱신했습니다.`,
      );
      if (nextContent) navigateStudioContent(nextContent, "next");
      else setStudioExiting(true);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      setStudioDecision(null);
      setStudioActionError(error instanceof Error
        ? error.message
        : "콘텐츠 검수 확정에 실패했습니다.");
    } finally {
      if (studioActionRequestRef.current === controller) {
        studioActionRequestRef.current = null;
        if (!controller.signal.aborted) setStudioActionPending(null);
      }
    }
  }, [
    content,
    hasStudioViolationJudgment,
    navigateStudioContent,
    nextContent,
    studioActionPending,
    studioFinalFocused,
    studioReviewReadOnly,
    studioViolationJudgments,
    studioViolationSignals,
  ]);

  useEffect(() => {
    if (invalidContentId || !contentId) return undefined;

    const routeContents = routeState?.contents
      ?? (routeState?.content ? [routeState.content] : []);
    const hasRouteContent = routeContents.some((item) => item.id === contentId);
    const controller = new AbortController();
    studioDetailRequestRef.current?.abort();
    studioDetailRequestRef.current = controller;

    void Promise.all([
      hasRouteContent
        && !routeState?.inspectionSession
          ? Promise.resolve(routeContents)
          : getCurrentGenerationContents(controller.signal).then((result) => result.map(adaptContentInspection)),
      getContentDetail(numericContentId, controller.signal),
    ])
      .then(([contents, detail]) => {
        const adapted = adaptContentInspectionDetail(
          detail,
          contents.find((item) => item.id === String(detail.contentId)),
        );
        setDetailContents(
          contents.some((item) => item.id === adapted.id)
            ? contents.map((item) => item.id === adapted.id ? adapted : item)
            : [adapted, ...contents],
        );
        setLoadError((current) => current?.id === contentId ? null : current);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoadError({
          id: contentId,
          message: error instanceof Error ? error.message : "콘텐츠 상세 조회에 실패했습니다.",
        });
      })
      .finally(() => {
        if (studioDetailRequestRef.current === controller) {
          studioDetailRequestRef.current = null;
        }
      });

    return () => {
      controller.abort();
      if (studioDetailRequestRef.current === controller) {
        studioDetailRequestRef.current = null;
      }
    };
  }, [contentId, invalidContentId, numericContentId, routeState]);

  useEffect(() => {
    if (!routeState?.inspectionSession || !baseContent) return undefined;

    studioHistoryRequestRef.current?.abort();
    const controller = new AbortController();
    studioHistoryRequestRef.current = controller;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setStudioHistoricalContents([]);
      setStudioHistoryError(null);
      setStudioHistoryPending(studioHistoryVersionKey.length > 0);
    });

    if (!studioHistoryVersionKey) {
      return () => {
        active = false;
        controller.abort();
        if (studioHistoryRequestRef.current === controller) {
          studioHistoryRequestRef.current = null;
        }
      };
    }

    const versionIds = studioHistoryVersionKey.split(",").map(Number);
    void Promise.all(versionIds.map((contentVersionId) => (
      getContentVersionDetail(Number(baseContent.id), contentVersionId, controller.signal)
    )))
      .then((details) => {
        if (controller.signal.aborted) return;
        setStudioHistoricalContents(
          details.map((detail) => adaptContentInspectionDetail(detail, baseContent)),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setStudioHistoryError(error instanceof Error
          ? error.message
          : "과거 콘텐츠를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setStudioHistoryPending(false);
        if (studioHistoryRequestRef.current === controller) {
          studioHistoryRequestRef.current = null;
        }
      });

    return () => {
      active = false;
      controller.abort();
      if (studioHistoryRequestRef.current === controller) {
        studioHistoryRequestRef.current = null;
      }
    };
  }, [baseContent, routeState?.inspectionSession, studioHistoryVersionKey]);

  useEffect(() => {
    if (studioHistoryPending || visibleStudioHistoricalContents.length === 0) return undefined;
    const animationFrame = window.requestAnimationFrame(() => {
      const versions = studioVersionsRef.current;
      versions?.scrollTo({ behavior: "auto", left: versions.scrollWidth });
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [contentId, studioHistoryPending, visibleStudioHistoricalContents.length]);

  useEffect(() => {
    if (!routeState?.inspectionSession) return undefined;
    const resetFrame = window.requestAnimationFrame(() => {
      setStudioViolationJudgments(Array(studioViolationSignals.length).fill(null));
      setFocusedStudioViolationIndex(
        !studioReviewReadOnly && studioViolationSignals.length > 0 ? 0 : -1,
      );
      setStudioDecision(null);
    });

    return () => window.cancelAnimationFrame(resetFrame);
  }, [
    content?.contentVersionId,
    contentId,
    routeState?.inspectionSession,
    studioReviewReadOnly,
    studioViolationSignals.length,
  ]);

  useEffect(() => {
    if (!routeState?.inspectionSession) return undefined;
    studioActionRequestRef.current?.abort();
    studioActionRequestRef.current = null;
    const resetFrame = window.requestAnimationFrame(() => {
      setStudioActionPending(null);
      setStudioActionError(null);
      setStudioActionFeedback(null);
      setStudioReportRefreshVersionId(null);
    });

    return () => window.cancelAnimationFrame(resetFrame);
  }, [contentId, routeState?.inspectionSession]);

  useEffect(() => () => {
    studioHistoryRequestRef.current?.abort();
    studioActionRequestRef.current?.abort();
    studioDetailRequestRef.current?.abort();
    if (studioWheelReleaseTimerRef.current != null) {
      window.clearTimeout(studioWheelReleaseTimerRef.current);
    }
    if (studioContentTransitionTimerRef.current != null) {
      window.clearTimeout(studioContentTransitionTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!routeState?.inspectionSession) return undefined;
    const exitSession = (event: globalThis.KeyboardEvent) => {
      const decisionShortcut = event.code === "Digit1" || event.code === "Numpad1" || event.key === "1"
        ? "1"
        : event.code === "Digit2" || event.code === "Numpad2" || event.key === "2"
          ? "2"
          : null;
      const spacePressed = event.code === "Space" || event.key === " " || event.key === "Spacebar";
      if (studioExiting) return;
      if (event.target instanceof HTMLSelectElement) return;
      if (studioActionPending) {
        event.preventDefault();
        return;
      }
      if (event.repeat && (
        decisionShortcut !== null
        || spacePressed
      )) {
        event.preventDefault();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setExitConfirmationOpen((open) => !open);
        return;
      }
      if (exitConfirmationOpen) return;
      if (spacePressed) {
        event.preventDefault();
        if (
          !studioReportReady
          || studioReviewReadOnly
          || studioReportRefreshVersionId !== null
        ) return;
        if (focusedStudioViolationIndex >= 0) {
          if (!studioViolationJudgments[focusedStudioViolationIndex]) return;
          setFocusedStudioViolationIndex(
            focusedStudioViolationIndex + 1 < studioViolationSignals.length
              ? focusedStudioViolationIndex + 1
              : -1,
          );
          return;
        }
        if (studioFinalFocused && studioDecision) {
          void submitStudioDecision(studioDecision);
        }
        return;
      }
      if (decisionShortcut) {
        event.preventDefault();
        if (!studioReportReady || studioReviewReadOnly || studioReportRefreshVersionId !== null) return;
        if (focusedStudioViolationIndex >= 0) {
          judgeStudioViolation(
            focusedStudioViolationIndex,
            decisionShortcut === "1" ? "violation" : "clear",
          );
          return;
        }
        if (studioFinalFocused) {
          const selected = decisionShortcut === "1" ? "reject" : "approve";
          if ((selected === "reject") !== hasStudioViolationJudgment) return;
          setStudioActionError(null);
          setStudioDecision(selected);
        }
        return;
      }
    };

    window.addEventListener("keydown", exitSession);
    return () => window.removeEventListener("keydown", exitSession);
  }, [
    exitConfirmationOpen,
    focusedStudioViolationIndex,
    hasStudioViolationJudgment,
    judgeStudioViolation,
    routeState?.inspectionSession,
    studioActionPending,
    studioDecision,
    studioExiting,
    studioFinalFocused,
    studioReportReady,
    studioReportRefreshVersionId,
    studioReviewReadOnly,
    studioViolationJudgments,
    studioViolationSignals.length,
    submitStudioDecision,
  ]);

  useEffect(() => {
    if (!routeState?.inspectionSession) return undefined;

    const releaseWheelAfterIdle = () => {
      if (studioWheelReleaseTimerRef.current != null) {
        window.clearTimeout(studioWheelReleaseTimerRef.current);
      }
      studioWheelReleaseTimerRef.current = window.setTimeout(() => {
        studioWheelLockedRef.current = false;
      }, 180);
    };

    const navigateOnWheel = (event: globalThis.WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) < 4) return;
      if (
        studioExiting
        || exitConfirmationOpen
        || studioActionPending
        || studioContentTransition !== "idle"
      ) {
        event.preventDefault();
        return;
      }

      if (studioWheelLockedRef.current) {
        event.preventDefault();
        releaseWheelAfterIdle();
        return;
      }

      const scrollSurface = event.target instanceof Element
        ? event.target.closest<HTMLElement>(
            ".fuma-content-inspection-studio__report, .fuma-platform-inspection-frame__instagram-copy p, .fuma-platform-inspection-frame__youtube-description p",
          )
        : null;
      if (scrollSurface) {
        const canScroll = event.deltaY > 0
          ? scrollSurface.scrollTop + scrollSurface.clientHeight < scrollSurface.scrollHeight - 1
          : scrollSurface.scrollTop > 1;
        if (canScroll) return;
      }

      const direction: StudioContentDirection = event.deltaY > 0 ? "next" : "previous";
      const target = direction === "next" ? nextContent : previousContent;
      if (!target) return;
      event.preventDefault();
      studioWheelLockedRef.current = true;
      releaseWheelAfterIdle();
      navigateStudioContent(target, direction);
    };

    window.addEventListener("wheel", navigateOnWheel, { passive: false });
    return () => window.removeEventListener("wheel", navigateOnWheel);
  }, [
    exitConfirmationOpen,
    navigateStudioContent,
    nextContent,
    previousContent,
    routeState?.inspectionSession,
    studioActionPending,
    studioContentTransition,
    studioExiting,
  ]);

  useEffect(() => {
    if (!routeState?.inspectionSession || !studioReportReady || exitConfirmationOpen) return undefined;
    const focusFrame = window.requestAnimationFrame(() => {
      if (focusedStudioViolationIndex >= 0) {
        const violationItem = studioReportRef.current
          ?.querySelector<HTMLElement>(`[data-violation-index="${focusedStudioViolationIndex}"]`);
        violationItem?.focus({ preventScroll: true });
        violationItem?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }
      if (studioViolationReviewComplete) {
        studioDecisionRef.current?.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [
    exitConfirmationOpen,
    focusedStudioViolationIndex,
    routeState?.inspectionSession,
    studioReportReady,
    studioViolationReviewComplete,
  ]);

  useEffect(() => {
    if (!routeState?.inspectionSession || !studioExiting) return undefined;
    const exitTimer = window.setTimeout(() => {
      navigate(typeof returnPath === "string" ? returnPath : "/content/inspections", {
        replace: true,
      });
    }, 260);

    return () => window.clearTimeout(exitTimer);
  }, [navigate, returnPath, routeState?.inspectionSession, studioExiting]);

  useEffect(() => {
    if (!routeState?.inspectionSession || !content?.selectorsId) return undefined;
    const controller = new AbortController();

    void getSelector(content.selectorsId, controller.signal)
      .then((selector) => {
        if (!controller.signal.aborted) setStudioSelector(selector);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [content?.selectorsId, contentId, routeState?.inspectionSession]);

  if (routeState?.inspectionSession) {
    const snsAccount = studioSelector?.snsAccount;
    const accountId = snsAccount?.accountId ?? content?.accountId;
    const snsId = accountId ?? content?.author ?? "-";
    const snsIdLabel = snsId.startsWith("http")
      ? "프로필 보기"
      : snsId.startsWith("@") || snsId === "-" ? snsId : `@${snsId}`;
    const profileUrl = snsAccountHref(
      content ? contentPlatform(content.sourcePlatform) : null,
      accountId,
    );
    const followerCount = snsAccount?.followerCount;
    const generationSales = studioSelector?.generations.find(
      ({ generationName }) => generationName === content?.cohort,
    )?.totalSales;
    const registeredContentCount = studioSelector?.performance.contentCount == null
      ? null
      : Math.max(0, studioSelector.performance.contentCount - 1);
    const inspectionProgress = studioInspectionComplete
      ? 100
      : currentPendingIndex >= 0 && pendingContents.length > 0
      ? ((currentPendingIndex + 1) / pendingContents.length) * 100
      : 0;

    return (
      <main
        aria-busy={
          studioActionPending !== null
          || studioHistoryPending
          || studioContentTransition !== "idle"
        }
        aria-label="콘텐츠 검수"
        aria-modal="true"
        className="fuma-content-inspection-studio"
        data-exiting={studioExiting}
        role="dialog"
      >
        <header className="fuma-content-inspection-studio__header">
          <button
            aria-keyshortcuts="Escape"
            aria-label="검수 화면 나가기"
            className="fuma-content-inspection-studio__exit-button"
            disabled={studioActionPending !== null || studioContentTransition !== "idle"}
            onClick={() => setExitConfirmationOpen(true)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            나가기
            <kbd>ESC</kbd>
          </button>
          <div className="fuma-content-inspection-studio__header-title">
            <span>CONTENT INSPECTION</span>
            <strong>콘텐츠 검수</strong>
          </div>
          <nav aria-label="검수 콘텐츠 이동" className="fuma-content-inspection-studio__queue">
            <div className="fuma-content-inspection-studio__queue-progress">
              <span>검수 진행</span>
              <strong>
                {studioInspectionComplete ? (
                  <b>완료</b>
                ) : (
                  <>
                    <b>{currentPendingIndex >= 0 ? currentPendingIndex + 1 : 0}</b>
                    <small> / {pendingContents.length}</small>
                  </>
                )}
              </strong>
              <span aria-hidden="true" className="fuma-content-inspection-studio__queue-track">
                <i style={{ width: `${inspectionProgress}%` }} />
              </span>
            </div>
            <span className="fuma-content-inspection-studio__queue-actions">
              <button
                aria-label="이전 콘텐츠"
                disabled={
                  !previousContent
                  || studioActionPending !== null
                  || studioContentTransition !== "idle"
                }
                onClick={() => navigateStudioContent(previousContent, "previous")}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={20} />
                <span>이전</span>
              </button>
              <button
                aria-label={studioShowFinish ? "검수 마침" : "다음 콘텐츠"}
                disabled={
                  studioActionPending !== null
                  || studioContentTransition !== "idle"
                  || (!studioInspectionComplete && !nextContent)
                }
                onClick={() => studioInspectionComplete
                  ? setStudioExiting(true)
                  : navigateStudioContent(nextContent, "next")}
                type="button"
              >
                <span>{studioShowFinish ? "마침" : "다음"}</span>
                {studioShowFinish
                  ? <CheckCircle2 aria-hidden="true" size={19} />
                  : <ChevronRight aria-hidden="true" size={20} />}
              </button>
            </span>
          </nav>
        </header>
        {content ? (
          <>
            <aside aria-label="셀렉터스 프로필" className="fuma-content-inspection-studio__profile">
              <div className="fuma-content-inspection-studio__profile-identity">
                <span className="fuma-content-inspection-studio__profile-avatar">
                  {(snsAccount?.profileImageUrl ?? content.profileImageUrl)
                    ? (
                        <CreatorProfilePhoto
                          creatorName={studioSelector?.nickname ?? content.author}
                          src={snsAccount?.profileImageUrl ?? content.profileImageUrl ?? ""}
                        />
                      )
                    : <UserRound aria-label="익명 프로필 이미지" role="img" size={24} />}
                </span>
                <div>
                  <strong>{studioSelector?.nickname ?? content.author}</strong>
                  <span className="fuma-content-inspection-studio__profile-meta">
                    {profileUrl ? (
                      <a href={profileUrl} rel="noreferrer" target="_blank">
                        {snsIdLabel}
                      </a>
                    ) : <span>{snsIdLabel}</span>}
                    <PlatformIcon platform={contentPlatform(content.sourcePlatform)} />
                  </span>
                </div>
                <span className="fuma-content-inspection-studio__profile-id">
                  <small>셀렉터스 ID</small>
                  <b>{studioSelector?.selectorsCode ?? (content.selectorsId ? `#${content.selectorsId}` : "-")}</b>
                </span>
              </div>
              <dl>
                <div>
                  <dt>팔로워</dt>
                  <dd>{followerCount == null ? "-" : `${formatCompactCount(followerCount)}명`}</dd>
                </div>
                <div>
                  <dt>이번 기수 매출</dt>
                  <dd>{generationSales == null ? "-" : formatWon(generationSales)}</dd>
                </div>
                <div>
                  <dt>등록 콘텐츠 수 (현재 제외)</dt>
                  <dd>{registeredContentCount == null ? "-" : `${formatNumber(registeredContentCount)}건`}</dd>
                </div>
              </dl>
            </aside>
            <section
              aria-label="콘텐츠 버전 비교"
              className="fuma-content-inspection-studio__versions"
              data-content-format={contentCollectionFormatKey(content.contentFormat)}
              data-content-transition={studioContentTransition}
              data-revised={studioHistoricalVersionSummaries.length > 0}
              ref={studioVersionsRef}
            >
              {studioHistoricalVersionSummaries.length > 0 ? (
                <div className="fuma-content-inspection-studio__history">
                  {studioHistoryPending || (!studioHistoryError && visibleStudioHistoricalContents.length === 0) ? (
                    <p>과거 콘텐츠를 불러오는 중입니다.</p>
                  ) : studioHistoryError ? (
                    <p role="alert">{studioHistoryError}</p>
                  ) : visibleStudioHistoricalContents.map((historicalContent) => (
                    <div
                      className="fuma-content-inspection-studio__version"
                      data-latest="false"
                      key={historicalContent.contentVersionId}
                    >
                      <span className="fuma-content-inspection-studio__version-tag">
                        v{currentDisplayedVersionNo(historicalContent)} · 과거 콘텐츠
                      </span>
                      <MinimalVersionCard
                        content={historicalContent}
                        label={`v${currentDisplayedVersionNo(historicalContent)} 과거 콘텐츠`}
                        showAnnotations={false}
                        snapshot={historicalContent.currentSnapshot}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              <div
                className="fuma-content-inspection-studio__version"
                data-latest="true"
              >
                <span className="fuma-content-inspection-studio__version-tag">
                  v{currentDisplayedVersionNo(content)} · 최신 콘텐츠
                </span>
                <MinimalVersionCard
                  content={content}
                  focusedViolation={studioCardFocusedViolation}
                  label="최신 콘텐츠"
                  onSelectViolation={selectStudioViolationFromContent}
                  snapshot={content.currentSnapshot}
                />
              </div>
            </section>
          </>
        ) : null}
        {content ? (
          <aside
            aria-label="AI 검수 리포트"
            className="fuma-content-inspection-studio__report"
            ref={studioReportRef}
          >
            <header>
              <div>
                <span>AI ANALYSIS</span>
                <strong>검수 리포트</strong>
              </div>
              <div className="fuma-content-inspection-studio__report-tools">
                <em
                  data-clear={studioReportReady && studioViolationSignals.length === 0}
                  data-loading={!studioReportReady}
                >
                  {!studioReportReady
                    ? "불러오는 중"
                    : studioViolationSignals.length > 0
                      ? `${studioViolationSignals.length}건 감지`
                      : "이상 없음"}
                </em>
                <button
                  className="fuma-content-inspection-studio__report-generate"
                  data-pending={studioActionPending === "report"}
                  disabled={
                    studioActionPending !== null
                    || studioReviewReadOnly
                    || !studioLatestVersion?.contentVersionId
                  }
                  onClick={() => void generateStudioReport()}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={12} />
                  {studioActionPending === "report"
                    ? studioReportRefreshVersionId == null ? "생성 중" : "불러오는 중"
                    : studioReportRefreshVersionId == null ? "리포트 생성" : "리포트 불러오기"}
                </button>
              </div>
            </header>
            {studioActionError || visibleError ? (
              <p
                className="fuma-content-inspection-studio__report-feedback"
                data-error="true"
                role="alert"
              >
                {studioActionError ?? visibleError}
              </p>
            ) : studioActionFeedback ? (
              <p className="fuma-content-inspection-studio__report-feedback" role="status">
                {studioActionFeedback}
              </p>
            ) : null}
            <section
              aria-label="콘텐츠 정보"
              className="fuma-content-inspection-studio__content-meta"
            >
              <div>
                <span>최초 등록일</span>
                <strong>
                  <time dateTime={content.submittedAt}>
                    {formatInspectionDate(content.submittedAt)}
                  </time>
                </strong>
              </div>
              <div>
                <span>마지막 수정</span>
                <strong>
                  <time dateTime={content.currentSnapshot.capturedAt}>
                    {formatInspectionDate(content.currentSnapshot.capturedAt)}
                  </time>
                </strong>
              </div>
              <div>
                <span>콘텐츠 유형</span>
                <strong>{content.contentFormat}</strong>
              </div>
            </section>
            <section className="fuma-content-inspection-studio__report-summary">
              <span>콘텐츠 요약</span>
              <p>{content.aiSummary}</p>
            </section>
            <section className="fuma-content-inspection-studio__report-evidence">
              <div>
                <span>위반 사항</span>
                <small>
                  {studioReviewReadOnly
                    ? "완료"
                    : studioReportReady
                      ? `${judgedStudioViolationCount}/${studioViolationSignals.length}`
                      : "-"}
                </small>
              </div>
              {!studioReportReady ? (
                <p className="fuma-content-inspection-studio__report-empty">
                  위반 사항을 불러오는 중입니다.
                </p>
              ) : studioViolationSignals.length > 0 ? (
                <ul>
                  {studioViolationSignals.map((signal, index) => {
                    const judgment = studioViolationJudgments[index];
                    const focused = focusedStudioViolationIndex === index;

                    return (
                      <li
                        data-focused={focused}
                        data-judgment={judgment ?? "pending"}
                        data-tone={signal.tone}
                        data-violation-index={index}
                        key={`${signal.title}-${signal.source}-${index}`}
                        tabIndex={-1}
                      >
                        <div>
                          <div>
                            <strong>{signal.title}</strong>
                            <small data-judgment={judgment ?? "pending"}>
                              {judgment === "violation"
                                ? "위반"
                                : judgment === "clear" ? "위반 아님" : signal.source}
                            </small>
                          </div>
                          <p>{signal.evidence || signal.detail}</p>
                          {focused ? (
                            <div
                              aria-label={`${signal.title} 판정`}
                              className="fuma-content-inspection-studio__report-choices"
                              role="group"
                            >
                              <button
                                aria-keyshortcuts="1"
                                aria-pressed={judgment === "violation"}
                                disabled={
                                  studioActionPending !== null
                                  || studioReportRefreshVersionId !== null
                                }
                                onClick={() => judgeStudioViolationAndAdvance(index, "violation")}
                                type="button"
                              >
                                위반
                              </button>
                              <button
                                aria-keyshortcuts="2"
                                aria-pressed={judgment === "clear"}
                                disabled={
                                  studioActionPending !== null
                                  || studioReportRefreshVersionId !== null
                                }
                                onClick={() => judgeStudioViolationAndAdvance(index, "clear")}
                                type="button"
                              >
                                위반 허용
                              </button>
                              {judgment ? (
                                <Tooltip
                                  className="fuma-content-inspection-studio__report-choice-tooltip"
                                  placement="none"
                                  role="status"
                                  visible
                                >
                                  <kbd>Space</kbd> 바를 눌러 다음으로 이동하세요
                                </Tooltip>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="fuma-content-inspection-studio__report-empty">위반 사항이 없습니다.</p>}
            </section>
          </aside>
        ) : null}
        <div
          aria-label="최종 검수"
          className="fuma-content-inspection-studio__decision"
          data-active={studioFinalFocused}
          ref={studioDecisionRef}
          role="group"
          tabIndex={-1}
        >
          <button
            aria-keyshortcuts="1"
            aria-pressed={studioDecision === "reject"}
            className="is-reject"
            disabled={
              !studioFinalFocused
              || !hasStudioViolationJudgment
              || studioActionPending !== null
            }
            onClick={() => void submitStudioDecision("reject")}
            type="button"
          >
            <kbd>1</kbd>
            {studioActionPending === "confirmation" && studioDecision === "reject"
              ? "반려 처리 중"
              : "최종 반려"}
          </button>
          <button
            aria-keyshortcuts="2"
            aria-pressed={studioDecision === "approve"}
            className="is-approve"
            disabled={
              !studioFinalFocused
              || hasStudioViolationJudgment
              || studioActionPending !== null
            }
            onClick={() => void submitStudioDecision("approve")}
            type="button"
          >
            <kbd>2</kbd>
            {studioActionPending === "confirmation" && studioDecision === "approve"
              ? "승인 처리 중"
              : "최종 승인"}
          </button>
          {studioFinalFocused && studioDecision && studioActionPending === null ? (
            <Tooltip
              className="fuma-content-inspection-studio__report-choice-tooltip"
              placement="none"
              role="status"
              visible
            >
              <kbd>Space</kbd> 바를 눌러 검수를 확정하세요
            </Tooltip>
          ) : null}
        </div>
        <BubbleDialog
          actions={(
            <>
              <button autoFocus onClick={() => setExitConfirmationOpen(false)} type="button">
                취소
              </button>
              <button
                onClick={() => {
                  setExitConfirmationOpen(false);
                  setStudioExiting(true);
                }}
                type="button"
              >
                확인
              </button>
            </>
          )}
          description="그래도 검수 화면에서 나가시겠습니까?"
          layer="local"
          open={exitConfirmationOpen}
          title="검수가 완료되지 않았습니다."
        />
      </main>
    );
  }

  return (
    <section className="fuma-page fuma-content-inspection-detail" data-visual-contract="content-inspection">
      <PageHeader title="콘텐츠 검수 상세" />
      <div className="fuma-page__body">
        {visibleError ? (
          <p
            className="fuma-content-inspection-collection-feedback fuma-content-inspection-collection-feedback--error"
            role="alert"
          >
            {visibleError}
          </p>
        ) : content ? (
          <ContentInspectionDetailContent
            content={content}
            key={content.id}
            nextContent={nextContent}
            onBack={() => typeof returnPath === "string" ? navigate(-1) : navigate("/content/inspections")}
            onNext={() => nextContent && navigate(`/content/inspections/${nextContent.id}`, {
              state: { ...routeState, content: nextContent, contents: detailContents },
            })}
            remainingCount={remainingCount}
          />
        ) : invalidContentId ? (
          <EmptyState
            description="요청한 콘텐츠 검수 정보를 확인해 주세요."
            title="대상을 찾을 수 없습니다."
          />
        ) : (
          <EmptyState title="콘텐츠를 불러오는 중입니다." />
        )}
      </div>
    </section>
  );
}
