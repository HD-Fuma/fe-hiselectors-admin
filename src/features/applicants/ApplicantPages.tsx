import { useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { SOCIAL_PLATFORM_FILTER_OPTIONS } from "../../components/social/platforms";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { ProfileDetailShell, type ProfileDetailProfile } from "../../components/ui/ProfileDetailShell";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import {
  getAdminApplication,
  getAdminApplicationAiReport,
  getAdminApplications,
  updateAdminApplicationStatus,
  type AdminApplicationAiReport,
  type AdminApplicationDetail,
  type AdminApplicationIdentity,
  type AdminApplicationSummary,
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
const APPLICANT_PAGE_SIZE = 20;

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

function profileUrl(applicant: AdminApplicationIdentity) {
  if (applicant.snsCode === "INSTAGRAM") {
    return `https://www.instagram.com/${encodeURIComponent(applicant.snsAccountId.replace(/^@/, ""))}/`;
  }
  if (applicant.snsAccountId.startsWith("UC")) {
    return `https://www.youtube.com/channel/${encodeURIComponent(applicant.snsAccountId)}`;
  }
  return `https://www.youtube.com/@${encodeURIComponent(applicant.snsAccountId.replace(/^@/, ""))}`;
}

function PlatformLabel({ platform }: { platform: ApplicantPlatform }) {
  return (
    <span className="fuma-platform-label">
      <PlatformIcon platform={platform} />
      <span aria-hidden="true">{platform}</span>
    </span>
  );
}

interface ApplicantListRow {
  id: number;
  theHyundaiHiMemberNumber: string;
  name: string;
  platform: ApplicantPlatform;
  channelName: string;
  generationName: string;
  recent90DayContentCount: number | null;
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
    theHyundaiHiMemberNumber: applicant.hiId,
    name: applicant.applicantName,
    platform: platformFor(applicant.snsCode),
    channelName: applicant.snsAccountId,
    generationName: applicant.generationName,
    recent90DayContentCount: applicant.recent90DayContentCount,
    followerCount: applicant.followerCount,
    engagementRate: applicant.engagementRate,
    appliedAt: dateTime(applicant.appliedAt),
    reviewStatus: reviewStatusFor(applicant),
  };
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
        <label className="fuma-applicant-minimum-toggle">
          <input
            checked={minimumCriteriaOnly}
            onChange={(event) => onMinimumCriteriaOnlyChange(event.target.checked)}
            type="checkbox"
          />
          <span aria-hidden="true" />
          <b>최저 기준 필터링</b>
        </label>
        <span className="fuma-applicant-minimum-tooltip">
          <button
            aria-describedby="applicant-minimum-tooltip"
            aria-label="최저 기준 필터링 안내"
            type="button"
          >
            <CircleHelp aria-hidden="true" size={15} strokeWidth={1.8} />
          </button>
          <span id="applicant-minimum-tooltip" role="tooltip">
            팔로워·구독자 500명 이하 또는 최근 3개월 내 활동 콘텐츠가 3건 이하인 지원자를 필터링합니다.
          </span>
        </span>
        <label className="fuma-applicant-minimum-toggle fuma-applicant-ai-report-toggle">
          <input
            checked={hasAiReportOnly}
            onChange={(event) => onHasAiReportOnlyChange(event.target.checked)}
            type="checkbox"
          />
          <span aria-hidden="true" />
          <b>AI 리포트 있는 지원자만</b>
        </label>
      </div>
      <div className="fuma-settlement-result-meta">
        <span>총 {count}건</span>
      </div>
    </div>
  );
}

function applicantListColumns(): DenseTableColumn<ApplicantListRow>[] {
  return [
    {
      key: "theHyundaiHiMemberNumber",
      header: "회원번호",
      width: 126,
      align: "center",
    },
    { key: "name", header: "이름", width: 70, align: "center" },
    {
      id: "platform",
      header: "플랫폼",
      width: 115,
      align: "center",
      render: (applicant) => <PlatformLabel platform={applicant.platform} />,
    },
    {
      id: "account",
      header: "SNS ID",
      width: 130,
      align: "center",
      render: (applicant) => applicant.channelName,
    },
    {
      key: "generationName",
      header: "기수",
      width: 110,
      align: "center",
    },
    {
      key: "recent90DayContentCount",
      header: "최근 90일 활동",
      width: 165,
      align: "right",
      render: (applicant) => applicant.recent90DayContentCount === null
        ? "-"
        : `${formatNumber(applicant.recent90DayContentCount)}건`,
    },
    {
      key: "followerCount",
      header: "팔로워/구독자",
      width: 105,
      align: "right",
      render: (applicant) => applicant.followerCount === null
        ? "-"
        : formatNumber(applicant.followerCount),
    },
    {
      key: "engagementRate",
      header: "ER",
      width: 72,
      align: "right",
      render: (applicant) => applicant.engagementRate === null
        ? "-"
        : `${applicant.engagementRate.toFixed(2)}%`,
    },
    {
      key: "appliedAt",
      header: "신청일",
      width: 96,
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
  const [reviewStatus, setReviewStatus] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedPlatform, setAppliedPlatform] = useState("");
  const [appliedGenerationId, setAppliedGenerationId] = useState("");
  const [appliedReviewStatus, setAppliedReviewStatus] = useState("");
  const [minimumCriteriaOnly, setMinimumCriteriaOnly] = useState(false);
  const [hasAiReportOnly, setHasAiReportOnly] = useState(false);
  const [decisionModal, setDecisionModal] = useState<{
    name: string;
    status: Exclude<ApplicationStatus, "PENDING">;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [listRequestVersion, setListRequestVersion] = useState(0);
  const listRequestKey = [
    appliedKeyword,
    appliedPlatform,
    appliedGenerationId,
    appliedReviewStatus,
    minimumCriteriaOnly ? "minimum" : "all",
    hasAiReportOnly ? "hasAiReport" : "all",
    page,
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
      size: APPLICANT_PAGE_SIZE,
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
    setReviewStatus("");
    setAppliedKeyword("");
    setAppliedPlatform("");
    setAppliedGenerationId("");
    setAppliedReviewStatus("");
    setMinimumCriteriaOnly(false);
    setHasAiReportOnly(false);
    setPage(1);
    navigate("/applicants");
  };
  const columns = applicantListColumns();
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
                rowKey={(applicant) => applicant.id}
                rows={applicants}
              />
            )}
          </div>
          {!loading && !listError ? (
            <Pagination
              onPageChange={setPage}
              page={page}
              pageSize={APPLICANT_PAGE_SIZE}
              totalPages={Math.max(1, pageData?.totalPages ?? 1)}
            />
          ) : null}
        </div>
      </section>
      {detailApplicantId ? (
        <ApplicantDetailPage
          applicantIdOverride={detailApplicantId}
          embedded
          onClose={() => navigate("/applicants")}
          onDecisionConfirmed={(name, status) => setDecisionModal({ name, status })}
          onStatusChanged={() => setListRequestVersion((version) => version + 1)}
        />
      ) : null}
      <Modal
        actions={<Button onClick={() => setDecisionModal(null)} variant="primary">확인</Button>}
        onClose={() => setDecisionModal(null)}
        open={decisionModal !== null}
        role="alertdialog"
        title="심사 처리 완료"
      >
        {decisionModal ? (
          <p>
            <strong>{decisionModal.name}</strong>님을{" "}
            {decisionModal.status === "APPROVED" ? "승인" : "반려"} 처리했습니다.
          </p>
        ) : null}
      </Modal>
    </>
  );
}

interface ApplicantDetailPageProps {
  applicantIdOverride?: string;
  embedded?: boolean;
  onClose?: () => void;
  onDecisionConfirmed?: (name: string, status: Exclude<ApplicationStatus, "PENDING">) => void;
  onStatusChanged?: () => void;
}

export function ApplicantDetailPage({
  applicantIdOverride,
  embedded = false,
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

  useEffect(() => {
    if (invalidApplicantId) return;
    const controller = new AbortController();
    getAdminApplication(numericApplicantId, controller.signal).then((applicant) => {
      if (!controller.signal.aborted) {
        setDetailState({ id: numericApplicantId, applicant, error: "" });
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
    return () => controller.abort();
  }, [invalidApplicantId, numericApplicantId]);

  useEffect(() => {
    if (invalidApplicantId) return;
    const controller = new AbortController();
    getAdminApplicationAiReport(numericApplicantId, controller.signal).then((report) => {
      if (!controller.signal.aborted) setAiReport({ id: numericApplicantId, report });
    });
    return () => controller.abort();
  }, [invalidApplicantId, numericApplicantId]);

  const currentDetailState = detailState?.id === numericApplicantId ? detailState : null;
  const applicant = currentDetailState?.applicant ?? null;
  const effectiveReviewStatus = applicant ? reviewStatusFor(applicant) : undefined;
  const audienceLabel = applicant?.snsCode === "INSTAGRAM" ? "팔로워" : "구독자";
  const detailProfile: ProfileDetailProfile | undefined = applicant && effectiveReviewStatus ? {
    audienceLabel,
    audienceValue: applicant.followerCount === null ? "-" : formatNumber(applicant.followerCount),
    contentCount: applicant.metrics.totalContentCount === null
      ? "-"
      : formatNumber(applicant.metrics.totalContentCount),
    engagementValue: applicant.metrics.engagementRate.value === null
      ? "-"
      : `${applicant.metrics.engagementRate.value.toFixed(2)}%`,
    gallery: applicant.contents.slice(0, 3).map((content) => ({
      id: String(content.id),
      imageUrl: content.mediaUrl ?? "",
      title: content.snsContentId,
    })),
    handle: applicant.snsAccountId,
    infoFields: [
      { label: "지원자 ID", value: applicant.id },
      { label: "계정 ID", value: applicant.snsAccountId },
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
    profileImageUrl: "",
    profileUrl: profileUrl(applicant),
    status: (
      <StatusPill tone={reviewStatusTone(effectiveReviewStatus)}>
        {effectiveReviewStatus}
      </StatusPill>
    ),
  } : undefined;
  const loading = !invalidApplicantId && !currentDetailState;
  const detailError = invalidApplicantId
    ? "요청한 지원자 ID가 올바르지 않습니다."
    : currentDetailState?.error;

  const updateStatus = async (status: Exclude<ApplicationStatus, "PENDING">) => {
    setUpdatingStatus(status);
    try {
      await updateAdminApplicationStatus(numericApplicantId, status);
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "지원자 심사 처리에 실패했습니다.");
      setUpdatingStatus(null);
      return;
    }

    onStatusChanged?.();
    onDecisionConfirmed?.(applicant?.applicantName ?? "지원자", status);
    (onClose ?? (() => navigate("/applicants")))();
  };

  return (
    <>
      {embedded ? null : <ApplicantListPage />}
      <ProfileDetailShell
        actionSection={applicant?.status === "PENDING" && effectiveReviewStatus ? (
          <section className="fuma-creator-detail-sidebar__proposal fuma-applicant-detail-actions">
            <div className="fuma-applicant-detail-actions__heading">
              <span>심사 처리</span>
              <StatusPill tone={reviewStatusTone(effectiveReviewStatus)}>
                {effectiveReviewStatus}
              </StatusPill>
            </div>
            <div className="fuma-applicant-detail-actions__buttons">
              <Button
                disabled={updatingStatus !== null}
                onClick={() => updateStatus("APPROVED")}
                variant="primary"
              >
                {updatingStatus === "APPROVED" ? "승인 처리 중..." : "승인"}
              </Button>
              <Button
                disabled={updatingStatus !== null}
                onClick={() => updateStatus("REJECTED")}
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
        profile={detailProfile}
        title="지원자 상세"
      >
        {applicant ? (
          <ApplicantAnalysisReport
            aiReport={aiReport?.id === numericApplicantId ? aiReport.report : null}
            applicant={applicant}
          />
        ) : null}
      </ProfileDetailShell>
    </>
  );
}
