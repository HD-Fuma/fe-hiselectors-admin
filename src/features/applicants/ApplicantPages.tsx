import { useEffect, useState, type FormEvent } from "react";
import { CircleHelp } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { SOCIAL_PLATFORM_FILTER_OPTIONS } from "../../components/social/platforms";
import { BubbleDialog } from "../../components/ui/BubbleDialog";
import { Button, Select, Switch, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { ProfileDetailShell, type ProfileDetailProfile } from "../../components/ui/ProfileDetailShell";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SocialAccountCell } from "../../components/ui/SocialAccountCell";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { Tooltip } from "../../components/ui/Tooltip";
import {
  createAdminApplicationTest,
  getAdminApplication,
  getAdminApplicationAiReport,
  getAdminApplications,
  getCachedAdminApplication,
  getCachedAdminApplicationAiReport,
  invalidateAdminApplicationCache,
  prefetchAdminApplication,
  updateAdminApplicationStatus,
  type AdminApplicationAiReport,
  type AdminApplicationDetail,
  type AdminApplicationIdentity,
  type AdminApplicationSummary,
  type ApplicationContent,
  type ApplicationSnsCode,
  type ApplicationStatus,
  type SpringPage,
} from "../../entities/application";
import {
  getSelectorFilterGenerations,
  type SelectorFilterGeneration,
} from "../../entities/selectors";
import { formatNumber } from "../../lib/formatters";
import { ApplicantAnalysisReport } from "./ApplicantAnalysisReport";

type ReviewStatus = "검토 대기" | "승인" | "반려" | "자동 반려";
type ApplicantPlatform = "Instagram" | "YouTube";

const REVIEW_STATUS_OPTIONS = ["전체", "검토 대기", "승인", "반려", "자동 반려"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
const DEFAULT_REVIEW_STATUS = "검토 대기";
const APPLICANT_PAGE_SIZE = 20;
const TEST_APPLICATION_POLL_INTERVAL_MS = 10_000;

function isTestApplicant(applicant: Pick<AdminApplicationIdentity, "hiId">) {
  return applicant.hiId.startsWith("test_");
}

export function ApplicantTestPage() {
  const navigate = useNavigate();
  const [profileUrl, setProfileUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const createTestApplicant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const application = await createAdminApplicationTest(profileUrl.trim());
      navigate(`/applicants?detail=${application.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "테스트 지원자 생성에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <section className="fuma-page">
      <PageHeader title="테스트 지원자 등록" />
      <div className="fuma-page__body">
        <section className="fuma-content-section">
          <header className="fuma-content-section__header">
            <h2>SNS 계정 등록</h2>
          </header>
          <form className="fuma-applicant-review__form" onSubmit={createTestApplicant}>
            <FormRow
              help="운영 DB에 테스트 데이터 1건을 생성하고 기존 수집·분석·리포트 흐름을 실행합니다."
              label="SNS 프로필 URL"
              required
            >
              <TextInput
                aria-label="SNS 프로필 URL"
                autoComplete="off"
                maxLength={500}
                onChange={(event) => setProfileUrl(event.target.value)}
                placeholder="https://www.instagram.com/account 또는 YouTube 채널 URL"
                required
                type="url"
                value={profileUrl}
              />
            </FormRow>
            {error ? <p role="alert">{error}</p> : null}
            <div className="fuma-applicant-section__actions">
              <Button disabled={isSubmitting} type="submit" variant="primary">
                {isSubmitting ? "생성 중..." : "테스트 지원자 생성"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}

function reviewStatusTone(status: ReviewStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "승인") return "approved";
  if (status === "검토 대기") return "pending";
  return "rejected";
}

function platformFor(snsCode: ApplicationSnsCode): ApplicantPlatform {
  return snsCode === "INSTAGRAM" ? "Instagram" : "YouTube";
}

function apiSnsCodeFor(platform: string): ApplicationSnsCode | undefined {
  if (platform === "Instagram") return "INSTAGRAM";
  if (platform === "YouTube") return "YOUTUBE";
  return undefined;
}

function meetsMinimumCriteria(applicant: AdminApplicationSummary | AdminApplicationDetail) {
  const recent90DayContentCount = "metrics" in applicant
    ? applicant.metrics.recent90DayContentCount
    : applicant.recent90DayContentCount;
  return (applicant.followerCount !== null && applicant.followerCount <= 500)
    || (applicant.mediaCollectedAt !== null
      && recent90DayContentCount !== null
      && recent90DayContentCount <= 3);
}

function reviewStatusFor(
  applicant: AdminApplicationSummary | AdminApplicationDetail,
): ReviewStatus {
  if (applicant.status === "APPROVED") return "승인";
  if (applicant.status === "REJECTED") return "반려";
  if (meetsMinimumCriteria(applicant)) return "자동 반려";
  return "검토 대기";
}

function apiStatusFor(status: string): ApplicationStatus | undefined {
  if (status === "검토 대기") return "PENDING";
  if (status === "자동 반려") return "PENDING";
  if (status === "승인") return "APPROVED";
  if (status === "반려") return "REJECTED";
  return undefined;
}

function apiMinimumCriteriaOnly(status: string, minimumCriteriaOnly: boolean) {
  if (minimumCriteriaOnly || status === "자동 반려") return true;
  if (status === "검토 대기") return false;
  return undefined;
}

function dateTime(value: string | null) {
  return value ? value.replace("T", " ").slice(0, 16).replaceAll("-", ".") : "-";
}

function displaySnsName(applicant: AdminApplicationIdentity) {
  return applicant.snsDisplayName || applicant.snsAccountId;
}

function profileUrl(applicant: AdminApplicationIdentity) {
  if (applicant.snsCode === "INSTAGRAM") {
    return `https://www.instagram.com/${encodeURIComponent(applicant.snsAccountId.replace(/^@/, ""))}/`;
  }
  if (applicant.snsAccountId.startsWith("UC")) {
    return `https://www.youtube.com/channel/${encodeURIComponent(applicant.snsAccountId)}`;
  }
  return `https://www.youtube.com/@${encodeURIComponent(applicant.snsAccountId.replace(/^@/, ""))}`;
}

function uniqueContentsByPost(contents: readonly ApplicationContent[]) {
  const posts = new Map<string, ApplicationContent>();
  contents.forEach((content) => {
    if (!posts.has(content.snsContentId)) posts.set(content.snsContentId, content);
  });
  return [...posts.values()];
}

interface ApplicantListRow {
  id: number;
  name: string;
  platform: ApplicantPlatform;
  channelName: string;
  profileImageUrl: string;
  profileUrl: string;
  recent90DayContentCount: number | null;
  lastPublishedAt: string;
  followerCount: number | null;
  engagementRate: number | null;
  appliedAt: string;
  reviewStatus: ReviewStatus;
}

function applicantToListRow(
  applicant: AdminApplicationSummary,
): ApplicantListRow {
  return {
    id: applicant.id,
    name: applicant.applicantName,
    platform: platformFor(applicant.snsCode),
    channelName: displaySnsName(applicant),
    profileImageUrl: applicant.profileImageUrl ?? "",
    profileUrl: profileUrl(applicant),
    recent90DayContentCount: applicant.recent90DayContentCount,
    lastPublishedAt: applicant.lastPublishedAt?.slice(0, 10) ?? "-",
    followerCount: applicant.followerCount,
    engagementRate: applicant.engagementRate,
    appliedAt: dateTime(applicant.appliedAt),
    reviewStatus: reviewStatusFor(applicant),
  };
}

function ApplicantAccountCell({
  applicant,
  onOpen,
}: {
  applicant: ApplicantListRow;
  onOpen: (applicant: ApplicantListRow) => void;
}) {
  const handle = applicant.platform === "Instagram"
    ? `@${applicant.channelName.replace(/^@/, "")}`
    : applicant.channelName;
  return (
    <SocialAccountCell
      displayName={applicant.name}
      handle={handle}
      onOpen={() => onOpen(applicant)}
      platform={applicant.platform}
      profileImageUrl={applicant.profileImageUrl}
      profileUrl={applicant.profileUrl}
    />
  );
}

function ApplicantApprovalToolbar({
  count,
  hasAiReportOnly,
  minimumCriteriaOnly,
  onHasAiReportOnlyChange,
  onMinimumCriteriaOnlyChange,
}: {
  count: number;
  hasAiReportOnly: boolean;
  minimumCriteriaOnly: boolean;
  onHasAiReportOnlyChange: (checked: boolean) => void;
  onMinimumCriteriaOnlyChange: (checked: boolean) => void;
}) {
  return (
    <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-applicant-result-toolbar">
      <div className="fuma-applicant-minimum-filter">
        <Switch
          checked={minimumCriteriaOnly}
          label="최저 기준 필터링"
          onChange={(event) => onMinimumCriteriaOnlyChange(event.target.checked)}
        />
        <span className="fuma-applicant-minimum-tooltip">
          <button
            aria-describedby="applicant-minimum-tooltip"
            aria-label="최저 기준 필터링 안내"
            type="button"
          >
            <CircleHelp aria-hidden="true" size={15} strokeWidth={1.8} />
          </button>
          <Tooltip id="applicant-minimum-tooltip">
            팔로워·구독자 500명 이하 또는 최근 3개월 내 활동 콘텐츠가 3건 이하인 지원자를 필터링합니다.
          </Tooltip>
        </span>
        <Switch
          checked={hasAiReportOnly}
          className="fuma-applicant-ai-report-toggle"
          label="AI 리포트 있는 지원자만"
          onChange={(event) => onHasAiReportOnlyChange(event.target.checked)}
        />
      </div>
      <div className="fuma-settlement-result-meta">
        <span>총 {count}건</span>
      </div>
    </div>
  );
}

function applicantListColumns(
  onOpen: (applicant: ApplicantListRow) => void,
): DenseTableColumn<ApplicantListRow>[] {
  return [
    {
      id: "account",
      header: "계정",
      width: 240,
      render: (applicant) => <ApplicantAccountCell applicant={applicant} onOpen={onOpen} />,
    },
    {
      key: "followerCount",
      header: "팔로워/구독자",
      width: 120,
      align: "right",
      render: (applicant) => applicant.followerCount === null
        ? "-"
        : formatNumber(applicant.followerCount),
    },
    {
      key: "engagementRate",
      header: "ER",
      width: 80,
      align: "right",
      render: (applicant) => applicant.engagementRate === null
        ? "-"
        : `${applicant.engagementRate.toFixed(2)}%`,
    },
    {
      key: "recent90DayContentCount",
      header: "최근 90일 활동",
      width: 120,
      align: "right",
      render: (applicant) => applicant.recent90DayContentCount === null
        ? "-"
        : `${formatNumber(applicant.recent90DayContentCount)}건`,
    },
    {
      key: "lastPublishedAt",
      header: "최근 활동일",
      width: 105,
      align: "center",
    },
    {
      key: "appliedAt",
      header: "신청일",
      width: 125,
      align: "center",
    },
    {
      key: "reviewStatus",
      header: "심사 상태",
      width: 88,
      align: "center",
      render: (applicant) => (
        <StatusPill tone={reviewStatusTone(applicant.reviewStatus)}>
          {applicant.reviewStatus}
        </StatusPill>
      ),
    },
  ];
}

export function ApplicantListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const detailApplicantId = searchParams.get("detail");
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState("");
  const [generationId, setGenerationId] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string>(DEFAULT_REVIEW_STATUS);
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedPlatform, setAppliedPlatform] = useState("");
  const [appliedGenerationId, setAppliedGenerationId] = useState("");
  const [appliedReviewStatus, setAppliedReviewStatus] = useState<string>(DEFAULT_REVIEW_STATUS);
  const [minimumCriteriaOnly, setMinimumCriteriaOnly] = useState(false);
  const [hasAiReportOnly, setHasAiReportOnly] = useState(false);
  const [decisionModal, setDecisionModal] = useState<{
    name: string;
    status: Exclude<ApplicationStatus, "PENDING">;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(APPLICANT_PAGE_SIZE);
  const [listRequestVersion, setListRequestVersion] = useState(0);
  const listRequestKey = [
    appliedKeyword,
    appliedPlatform,
    appliedGenerationId,
    appliedReviewStatus,
    minimumCriteriaOnly ? "minimum" : "all",
    hasAiReportOnly ? "hasAiReport" : "all",
    page,
    pageSize,
    listRequestVersion,
  ].join("|");
  const [pageData, setPageData] = useState<SpringPage<AdminApplicationSummary> | null>(null);
  const [listError, setListError] = useState("");
  const [resolvedListKey, setResolvedListKey] = useState<string | null>(null);
  const [generations, setGenerations] = useState<SelectorFilterGeneration[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    getSelectorFilterGenerations(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setGenerations(result);
      })
      .catch(() => { /* the applicant list remains usable without generation options */ });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getAdminApplications({
      keyword: appliedKeyword || undefined,
      snsCode: apiSnsCodeFor(appliedPlatform),
      status: apiStatusFor(appliedReviewStatus),
      generationId: appliedGenerationId ? Number(appliedGenerationId) : undefined,
      hasAiReport: hasAiReportOnly || undefined,
      minimumCriteriaOnly: apiMinimumCriteriaOnly(appliedReviewStatus, minimumCriteriaOnly),
      page: page - 1,
      size: pageSize,
    }, controller.signal).then((result) => {
      if (!controller.signal.aborted) {
        setPageData(result);
        setListError("");
        setResolvedListKey(listRequestKey);
        if (result.totalPages > 0 && page > result.totalPages) {
          setPage(1);
        }
      }
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setPageData(null);
        setListError(reason instanceof Error ? reason.message : "지원자 목록 조회에 실패했습니다.");
        setResolvedListKey(listRequestKey);
      }
    });
    return () => controller.abort();
  }, [
    appliedKeyword,
    appliedPlatform,
    appliedGenerationId,
    appliedReviewStatus,
    hasAiReportOnly,
    listRequestKey,
    minimumCriteriaOnly,
    page,
    pageSize,
  ]);

  const isListFetching = resolvedListKey !== listRequestKey;
  const applicants = (pageData?.content ?? []).map(applicantToListRow);
  const openApplicant = (applicant: ApplicantListRow) => navigate(`/applicants?detail=${applicant.id}`);
  const applySearch = () => {
    setAppliedKeyword(keyword.trim());
    setAppliedPlatform(platform);
    setAppliedGenerationId(generationId);
    setAppliedReviewStatus(reviewStatus);
    setPage(1);
  };
  const resetSearch = () => {
    setKeyword("");
    setPlatform("");
    setGenerationId("");
    setReviewStatus(DEFAULT_REVIEW_STATUS);
    setAppliedKeyword("");
    setAppliedPlatform("");
    setAppliedGenerationId("");
    setAppliedReviewStatus(DEFAULT_REVIEW_STATUS);
    setMinimumCriteriaOnly(false);
    setHasAiReportOnly(false);
    setPage(1);
    navigate("/applicants");
  };
  const columns = applicantListColumns(openApplicant);
  const loading = pageData === null && !listError;

  return (
    <>
      <section className="fuma-page">
        <PageHeader title="지원자 심사" />
        <div className="fuma-page__body">
          <div className="fuma-operations-search fuma-settlement-search fuma-applicant-search">
            <SearchPanel actions={<SearchActions onReset={resetSearch} onSearch={applySearch} />}>
              <FilterField htmlFor="applicant-keyword" label="검색어">
                <TextInput
                  id="applicant-keyword"
                  name="keyword"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="이름, 회원번호 또는 계정 검색"
                  value={keyword}
                />
              </FilterField>
              <FilterField htmlFor="applicant-platform" label="SNS 채널">
                <Select
                  id="applicant-platform"
                  name="platform"
                  onChange={(event) => setPlatform(event.target.value)}
                  options={SOCIAL_PLATFORM_FILTER_OPTIONS}
                  value={platform}
                />
              </FilterField>
              <FilterField htmlFor="applicant-review-status" label="심사 상태">
                <Select
                  id="applicant-review-status"
                  name="reviewStatus"
                  onChange={(event) => setReviewStatus(event.target.value)}
                  options={REVIEW_STATUS_OPTIONS}
                  value={reviewStatus}
                />
              </FilterField>
              <FilterField htmlFor="applicant-generation" label="기수">
                <Select
                  id="applicant-generation"
                  name="generationId"
                  onChange={(event) => setGenerationId(event.target.value)}
                  options={[
                    { label: "전체", value: "" },
                    ...generations.map((generation) => ({
                      label: generation.generationName,
                      value: String(generation.id),
                    })),
                  ]}
                  value={generationId}
                />
              </FilterField>
            </SearchPanel>
          </div>
          <ApplicantApprovalToolbar
            count={pageData?.totalElements ?? 0}
            hasAiReportOnly={hasAiReportOnly}
            minimumCriteriaOnly={minimumCriteriaOnly}
            onHasAiReportOnlyChange={(checked) => {
              setHasAiReportOnly(checked);
              setPage(1);
            }}
            onMinimumCriteriaOnlyChange={(checked) => {
              setMinimumCriteriaOnly(checked);
              setPage(1);
            }}
          />
          <div
            aria-busy={isListFetching}
            aria-label="지원자 목록"
            className={`fuma-wide-table fuma-settlement-table fuma-applicant-list-table${
              isListFetching && pageData ? " fuma-applicant-list-table--refreshing" : ""
            }`}
            role="region"
          >
            {listError ? (
              <div role="alert">
                <EmptyState description={listError} title="목록을 불러오지 못했습니다" />
              </div>
            ) : (
              <DenseTable
                columns={columns}
                emptyMessage={loading
                  ? <span aria-live="polite" role="status">지원자를 불러오는 중입니다.</span>
                  : "검색 결과가 없습니다."}
                onRowClick={openApplicant}
                onRowHover={(applicant) => prefetchAdminApplication(applicant.id)}
                rowKey={(applicant) => applicant.id}
                rows={applicants}
              />
            )}
          </div>
          {!loading && !listError ? (
            <Pagination
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
              page={page}
              pageSize={pageSize}
              totalPages={Math.max(1, pageData?.totalPages ?? 1)}
            />
          ) : null}
        </div>
      </section>
      {detailApplicantId ? (
        <ApplicantDetailPage
          applicantIdOverride={detailApplicantId}
          embedded
          initialSummary={pageData?.content.find((row) => String(row.id) === detailApplicantId) ?? null}
          onClose={() => navigate("/applicants")}
          onDecisionConfirmed={(name, status) => setDecisionModal({ name, status })}
          onStatusChanged={() => setListRequestVersion((version) => version + 1)}
        />
      ) : null}
      <BubbleDialog
        actions={(
          <button autoFocus onClick={() => setDecisionModal(null)} type="button">
            확인
          </button>
        )}
        description={decisionModal ? (
          <>
            <strong>{decisionModal.name}</strong>님을{" "}
            {decisionModal.status === "APPROVED" ? "승인" : "반려"} 처리했습니다.
          </>
        ) : ""}
        onClose={() => setDecisionModal(null)}
        open={decisionModal !== null}
        title="심사 처리 완료"
      />
    </>
  );
}

interface ApplicantDetailPageProps {
  applicantIdOverride?: string;
  embedded?: boolean;
  initialSummary?: AdminApplicationSummary | null;
  onClose?: () => void;
  onDecisionConfirmed?: (name: string, status: Exclude<ApplicationStatus, "PENDING">) => void;
  onStatusChanged?: () => void;
}

export function ApplicantDetailPage({
  applicantIdOverride,
  embedded = false,
  initialSummary = null,
  onClose,
  onDecisionConfirmed,
  onStatusChanged,
}: ApplicantDetailPageProps = {}) {
  const { applicantId: routeApplicantId } = useParams();
  const navigate = useNavigate();
  const applicantId = applicantIdOverride ?? routeApplicantId;
  const numericApplicantId = Number(applicantId);
  const invalidApplicantId = !Number.isSafeInteger(numericApplicantId) || numericApplicantId <= 0;
  const [detailState, setDetailState] = useState<{
    id: number;
    applicant: AdminApplicationDetail | null;
    error: string;
  } | null>(null);
  const [aiReport, setAiReport] = useState<{ id: number; report: AdminApplicationAiReport | null } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<ApplicationStatus | null>(null);
  const [pendingDecision, setPendingDecision] = useState<Exclude<ApplicationStatus, "PENDING"> | null>(null);

  useEffect(() => {
    if (invalidApplicantId) return;
    const controller = new AbortController();
    let pollTimeout: number | undefined;
    let useCache = true;
    const loadApplication = () => {
      const request = useCache
        ? getCachedAdminApplication(numericApplicantId) ?? getAdminApplication(numericApplicantId, controller.signal)
        : getAdminApplication(numericApplicantId, controller.signal);
      useCache = false;
      request.then((applicant) => {
        if (controller.signal.aborted) return;
        setDetailState({ id: numericApplicantId, applicant, error: "" });
        const pending = applicant.mediaCollectionStatus === "PENDING"
          || applicant.analysisStatus === "PENDING"
          || applicant.analysisStatus === "IN_PROGRESS";
        const failed = applicant.mediaCollectionStatus === "FAILED"
          || applicant.analysisStatus === "FAILED";
        if (isTestApplicant(applicant) && pending && !failed) {
          pollTimeout = window.setTimeout(loadApplication, TEST_APPLICATION_POLL_INTERVAL_MS);
        }
      }).catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setDetailState({
            id: numericApplicantId,
            applicant: null,
            error: reason instanceof Error ? reason.message : "지원자 상세 조회에 실패했습니다.",
          });
        }
      });
    };
    loadApplication();
    return () => {
      controller.abort();
      if (pollTimeout !== undefined) window.clearTimeout(pollTimeout);
    };
  }, [invalidApplicantId, numericApplicantId]);

  useEffect(() => {
    if (invalidApplicantId) return;
    const controller = new AbortController();
    const request = getCachedAdminApplicationAiReport(numericApplicantId)
      ?? getAdminApplicationAiReport(numericApplicantId, controller.signal);
    request.then((report) => {
      if (!controller.signal.aborted) setAiReport({ id: numericApplicantId, report });
    });
    return () => controller.abort();
  }, [invalidApplicantId, numericApplicantId]);

  const currentDetailState = detailState?.id === numericApplicantId ? detailState : null;
  const applicant = currentDetailState?.applicant ?? null;
  const currentInitialSummary = initialSummary?.id === numericApplicantId ? initialSummary : null;
  const summarySource = applicant ?? currentInitialSummary;
  const effectiveReviewStatus = summarySource ? reviewStatusFor(summarySource) : undefined;
  const pendingDecisionLabel = pendingDecision === "APPROVED"
    ? "승인"
    : pendingDecision === "REJECTED"
      ? "반려"
      : "";
  const audienceLabel = summarySource?.snsCode === "INSTAGRAM" ? "팔로워" : "구독자";
  const representativeContents = applicant ? uniqueContentsByPost(applicant.contents) : [];
  const fallbackReviewStatus = currentInitialSummary ? reviewStatusFor(currentInitialSummary) : undefined;
  const fallbackProfile: ProfileDetailProfile | undefined = !applicant && currentInitialSummary && fallbackReviewStatus ? {
    audienceLabel: currentInitialSummary.snsCode === "INSTAGRAM" ? "팔로워" : "구독자",
    audienceValue: currentInitialSummary.followerCount === null ? "-" : formatNumber(currentInitialSummary.followerCount),
    contentCount: currentInitialSummary.totalContentCount === null
      ? "-"
      : formatNumber(currentInitialSummary.totalContentCount),
    engagementValue: currentInitialSummary.engagementRate === null
      ? "-"
      : `${currentInitialSummary.engagementRate.toFixed(2)}%`,
    gallery: [],
    handle: displaySnsName(currentInitialSummary),
    infoFields: [
      { label: "지원자 ID", value: currentInitialSummary.id },
      { label: "SNS 계정", value: displaySnsName(currentInitialSummary) },
      { label: "이메일", value: currentInitialSummary.email },
      { label: "기수", value: currentInitialSummary.generationName },
      { label: "최종 업데이트", value: dateTime(currentInitialSummary.updatedAt) },
      {
        label: currentInitialSummary.snsCode === "INSTAGRAM" ? "팔로워" : "구독자",
        value: currentInitialSummary.followerCount === null ? "-" : formatNumber(currentInitialSummary.followerCount),
      },
      {
        label: "최근 90일 콘텐츠",
        value: currentInitialSummary.recent90DayContentCount === null
          ? "-"
          : `${formatNumber(currentInitialSummary.recent90DayContentCount)}건`,
      },
    ],
    name: currentInitialSummary.applicantName,
    platform: platformFor(currentInitialSummary.snsCode),
    profileImageUrl: currentInitialSummary.profileImageUrl ?? "",
    profileUrl: profileUrl(currentInitialSummary),
    status: (
      <StatusPill tone={reviewStatusTone(fallbackReviewStatus)}>
        {fallbackReviewStatus}
      </StatusPill>
    ),
  } : undefined;
  const detailProfile: ProfileDetailProfile | undefined = applicant && effectiveReviewStatus ? {
    audienceLabel,
    audienceValue: applicant.followerCount === null ? "-" : formatNumber(applicant.followerCount),
    contentCount: applicant.metrics.totalContentCount === null
      ? "-"
      : formatNumber(applicant.metrics.totalContentCount),
    engagementValue: applicant.metrics.engagementRate.value === null
      ? "-"
      : `${applicant.metrics.engagementRate.value.toFixed(2)}%`,
    gallery: representativeContents.slice(0, 3).map((content) => ({
      id: content.snsContentId,
      imageUrl: content.thumbnailUrl
        ?? (content.mediaType === "IMAGE" ? content.mediaUrl : null)
        ?? "",
      title: content.title || content.caption || content.description || content.snsContentId,
      url: content.contentUrl,
    })),
    handle: displaySnsName(applicant),
    infoFields: [
      { label: "지원자 ID", value: applicant.id },
      { label: "SNS 계정", value: displaySnsName(applicant) },
      { label: "이메일", value: applicant.email },
      { label: "기수", value: applicant.generationName },
      { label: "최종 업데이트", value: dateTime(applicant.updatedAt) },
      {
        label: audienceLabel,
        value: applicant.followerCount === null ? "-" : formatNumber(applicant.followerCount),
      },
      {
        label: "최근 90일 콘텐츠",
        value: applicant.metrics.recent90DayContentCount === null
          ? "-"
          : `${formatNumber(applicant.metrics.recent90DayContentCount)}건`,
      },
      { label: "최근 활동", value: dateTime(applicant.metrics.lastPublishedAt).slice(0, 10) },
      {
        label: "ER",
        value: applicant.metrics.engagementRate.value === null
          ? "-"
          : `${applicant.metrics.engagementRate.value.toFixed(2)}%`,
      },
    ],
    name: applicant.applicantName,
    platform: platformFor(applicant.snsCode),
    profileImageUrl: applicant.profileImageUrl ?? "",
    profileUrl: profileUrl(applicant),
    status: (
      <StatusPill tone={reviewStatusTone(effectiveReviewStatus)}>
        {effectiveReviewStatus}
      </StatusPill>
    ),
  } : undefined;
  const detailError = invalidApplicantId
    ? "요청한 지원자 ID가 올바르지 않습니다."
    : currentDetailState?.error;
  const profile = detailProfile ?? (detailError ? undefined : fallbackProfile);
  const loading = !invalidApplicantId && !currentDetailState && !profile;

  const updateStatus = async (status: Exclude<ApplicationStatus, "PENDING">) => {
    setUpdatingStatus(status);
    try {
      await updateAdminApplicationStatus(numericApplicantId, status);
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "지원자 심사 처리에 실패했습니다.");
      setUpdatingStatus(null);
      return;
    }

    setPendingDecision(null);
    invalidateAdminApplicationCache(numericApplicantId);
    onStatusChanged?.();
    onDecisionConfirmed?.(applicant?.applicantName ?? "지원자", status);
    (onClose ?? (() => navigate("/applicants")))();
  };

  return (
    <>
      {embedded ? null : <ApplicantListPage />}
      <ProfileDetailShell
        actionSection={summarySource?.status === "PENDING" && effectiveReviewStatus ? (
          <section className="fuma-creator-detail-sidebar__proposal fuma-applicant-detail-actions">
            <div className="fuma-applicant-detail-actions__heading">
              <span>심사 처리</span>
              <StatusPill tone={reviewStatusTone(effectiveReviewStatus)}>
                {effectiveReviewStatus}
              </StatusPill>
            </div>
            <div className="fuma-applicant-detail-actions__buttons">
              <Button
                disabled={updatingStatus !== null || pendingDecision !== null}
                onClick={() => setPendingDecision("APPROVED")}
                variant="primary"
              >
                {updatingStatus === "APPROVED" ? "승인 처리 중..." : "승인"}
              </Button>
              <Button
                disabled={updatingStatus !== null || pendingDecision !== null}
                onClick={() => setPendingDecision("REJECTED")}
                variant="danger"
              >
                {updatingStatus === "REJECTED" ? "반려 처리 중..." : "반려"}
              </Button>
            </div>
          </section>
        ) : null}
        emptyDescription={loading
          ? "지원자 정보를 불러오는 중입니다."
          : detailError || "요청한 지원자 정보를 확인할 수 없습니다."}
        emptyRole={loading ? "status" : "alert"}
        emptyTitle={loading ? "지원자 정보를 불러오는 중입니다" : "지원자를 찾을 수 없습니다"}
        onClose={onClose ?? (() => navigate("/applicants"))}
        profile={profile}
        title="지원자 상세"
      >
        {applicant ? (
          <ApplicantAnalysisReport
            aiReport={aiReport?.id === numericApplicantId ? aiReport.report : null}
            applicant={applicant}
          />
        ) : profile ? (
          <div aria-live="polite" className="fuma-applicant-report-skeleton" role="status">
            <span className="fuma-applicant-report-skeleton__bar fuma-applicant-report-skeleton__bar--title" />
            <span className="fuma-applicant-report-skeleton__bar" />
            <span className="fuma-applicant-report-skeleton__bar fuma-applicant-report-skeleton__bar--short" />
            <div className="fuma-applicant-report-skeleton__card" />
            <div className="fuma-applicant-report-skeleton__grid">
              <span className="fuma-applicant-report-skeleton__tile" />
              <span className="fuma-applicant-report-skeleton__tile" />
              <span className="fuma-applicant-report-skeleton__tile" />
              <span className="fuma-applicant-report-skeleton__tile" />
            </div>
            <span className="fuma-applicant-report-skeleton__bar" />
            <span className="fuma-applicant-report-skeleton__bar fuma-applicant-report-skeleton__bar--short" />
            <span className="hsas-visually-hidden">상세 분석 리포트를 불러오는 중입니다...</span>
          </div>
        ) : null}
        <BubbleDialog
          actions={(
            <>
              <button
                autoFocus
                disabled={updatingStatus !== null}
                onClick={() => setPendingDecision(null)}
                type="button"
              >
                취소
              </button>
              <button
                disabled={updatingStatus !== null}
                onClick={() => {
                  if (pendingDecision) void updateStatus(pendingDecision);
                }}
                type="button"
              >
                {updatingStatus ? `${pendingDecisionLabel} 처리 중...` : "확인"}
              </button>
            </>
          )}
          description={pendingDecision
            ? `${pendingDecisionLabel}하면 ${summarySource?.applicantName ?? "지원자"}님께 ${pendingDecisionLabel} 알림톡이 발송됩니다.`
            : ""}
          onClose={updatingStatus === null ? () => setPendingDecision(null) : undefined}
          open={pendingDecision !== null}
          title={pendingDecision ? `${pendingDecisionLabel}하시겠습니까?` : ""}
        />
      </ProfileDetailShell>
    </>
  );
}
