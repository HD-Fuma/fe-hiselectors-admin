import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { ProfileDetailShell, type ProfileDetailProfile } from "../../components/ui/ProfileDetailShell";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SelectionModeButton } from "../../components/ui/SelectionModeButton";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { formatNumber } from "../../lib/formatters";
import { paginate } from "../../lib/pagination";
import { ApplicantAnalysisReport } from "./ApplicantAnalysisReport";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { SOCIAL_PLATFORM_FILTER_OPTIONS } from "../../components/social/platforms";
import {
  APPLICANTS,
  APPLICANT_CATEGORIES,
  applicantAnalysisFor,
  applicantFeaturedContentFor,
  applicantProfileImageUrl,
  applicantProfileUrl,
  findApplicantFixture,
  type ApplicantCategory,
  type ApplicantFixture,
  type ReviewStatus,
} from "./fixtures";

const REVIEW_STATUS_OPTIONS = ["전체", "검토 대기", "승인", "반려", "자동 반려"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
const APPLICANT_PAGE_SIZE = 20;

interface ApplicantReviewDecision {
  applicantId: string;
  note: string;
  reason: string;
  status: "승인" | "반려";
}

function reviewStatusTone(status: ReviewStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "승인") {
    return "approved";
  }
  if (status === "검토 대기") {
    return "pending";
  }
  return "rejected";
}

function PlatformLabel({ platform }: { platform: ApplicantFixture["platform"] }) {
  return (
    <span className="fuma-platform-label">
      <PlatformIcon platform={platform} />
      <span aria-hidden="true">{platform}</span>
    </span>
  );
}

function ApplicantKeywordTags({ keywords }: { keywords: readonly string[] }) {
  return (
    <span className="fuma-creator-keyword-tags">
      {keywords.slice(0, 3).map((keyword) => <span key={keyword}>{keyword}</span>)}
    </span>
  );
}

type ApplicantListRow = ApplicantFixture & {
  category: ApplicantCategory;
  engagementRate: number;
  keywords: readonly string[];
};

function applicantToListRow(applicant: ApplicantFixture): ApplicantListRow {
  const analysis = applicantAnalysisFor(applicant);

  return {
    ...applicant,
    category: analysis.category,
    engagementRate: analysis.engagementRate,
    keywords: analysis.keywords.slice(0, 3).map((keyword) => `#${keyword.label}`),
  };
}

function ApplicantApprovalToolbar({
  count,
  minimumCriteriaOnly,
  onApprove,
  onMinimumCriteriaOnlyChange,
  onReject,
  onSelectionModeChange,
  selectedCount,
  selectionMode,
}: {
  count: number;
  minimumCriteriaOnly: boolean;
  onApprove: () => void;
  onMinimumCriteriaOnlyChange: (checked: boolean) => void;
  onReject: () => void;
  onSelectionModeChange: () => void;
  selectedCount: number;
  selectionMode: boolean;
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
      </div>
      <div className="fuma-settlement-result-meta">
        <span>{selectionMode ? `${selectedCount}/${count}명` : `총 ${count}건`}</span>
      </div>
      <div className="fuma-creator-toolbar__controls">
        <SelectionModeButton active={selectionMode} onClick={onSelectionModeChange} />
        {selectionMode ? (
          <div className="fuma-applicant-batch-actions">
            <button
              className="fuma-creator-toolbar__proposal fuma-applicant-batch-reject"
              disabled={selectedCount === 0}
              onClick={onReject}
              type="button"
            >
              일괄 반려
            </button>
            <button
              className="fuma-creator-toolbar__proposal"
              disabled={selectedCount === 0}
              onClick={onApprove}
              type="button"
            >
              일괄 승인
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function applicantListColumns({
  allSelected,
  onToggleAll,
  onToggleSelected,
  selectedIds,
  selectionMode,
}: {
  allSelected: boolean;
  onToggleAll: () => void;
  onToggleSelected: (applicantId: string) => void;
  selectedIds: ReadonlySet<string>;
  selectionMode: boolean;
}): DenseTableColumn<ApplicantListRow>[] {
  const columns: DenseTableColumn<ApplicantListRow>[] = [
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
    id: "categories",
    header: "카테고리",
    width: 110,
    align: "center",
    render: (applicant) => applicant.category,
  },
  {
    id: "keywords",
    header: "키워드",
    width: 165,
    align: "center",
    render: (applicant) => <ApplicantKeywordTags keywords={applicant.keywords} />,
  },
  {
    id: "followers",
    header: "팔로워/구독자",
    width: 105,
    align: "right",
    render: (applicant) => formatNumber(applicant.followerCount),
  },
  {
    id: "engagementRate",
    header: "ER",
    width: 72,
    align: "right",
    render: (applicant) => `${applicant.engagementRate.toFixed(1)}%`,
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

  if (!selectionMode) {
    return columns;
  }

  return [
    {
      id: "select",
      header: (
        <input
          aria-label="전체 선택"
          checked={allSelected}
          onChange={onToggleAll}
          type="checkbox"
        />
      ),
      width: 40,
      align: "center",
      render: (applicant) => (
        <input
          aria-label={`${applicant.name} 선택`}
          checked={selectedIds.has(applicant.id)}
          onChange={() => onToggleSelected(applicant.id)}
          type="checkbox"
        />
      ),
    },
    ...columns,
  ];
}

export function ApplicantListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedCategory = APPLICANT_CATEGORIES.find((category) => category === searchParams.get("category")) ?? "";
  const applicantPoolPath = selectedCategory ? `/applicants?category=${encodeURIComponent(selectedCategory)}` : "/applicants";
  const detailApplicantId = searchParams.get("detail");
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedPlatform, setAppliedPlatform] = useState("");
  const [appliedReviewStatus, setAppliedReviewStatus] = useState("");
  const [minimumCriteriaOnly, setMinimumCriteriaOnly] = useState(false);
  const [reviewOverrides, setReviewOverrides] = useState<Partial<Record<string, ReviewStatus>>>({});
  const [page, setPage] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const applicants = APPLICANTS
    .filter((applicant) => !selectedCategory || applicantAnalysisFor(applicant).category === selectedCategory)
    .filter((applicant) => !minimumCriteriaOnly || applicant.autoRejected)
    .filter((applicant) => {
      const normalizedKeyword = appliedKeyword.trim().toLowerCase();
      const effectiveReviewStatus = reviewOverrides[applicant.id] ?? applicant.reviewStatus;
      const matchesKeyword = !normalizedKeyword || [
        applicant.name,
        applicant.theHyundaiHiMemberNumber,
        applicant.channelName,
      ].some((value) => value.toLowerCase().includes(normalizedKeyword));

      return matchesKeyword
        && (!appliedPlatform || applicant.platform === appliedPlatform)
        && (!appliedReviewStatus || effectiveReviewStatus === appliedReviewStatus);
    })
    .map((applicant) => (
      applicantToListRow({
        ...applicant,
        reviewStatus: reviewOverrides[applicant.id] ?? applicant.reviewStatus,
      })
    ));
  const { currentPage, pagedItems: pagedApplicants, totalPages } = paginate(
    applicants,
    page,
    APPLICANT_PAGE_SIZE,
  );
  const detailApplicant = applicants.find((applicant) => applicant.id === detailApplicantId);
  const openApplicant = (applicant: ApplicantListRow) => navigate(
    `${applicantPoolPath}${selectedCategory ? "&" : "?"}detail=${applicant.id}`,
  );
  const openCategory = (category?: ApplicantCategory) => {
    setPage(1);
    setSelectedIds(new Set());
    const nextParams = new URLSearchParams(searchParams);
    if (category) nextParams.set("category", category);
    else nextParams.delete("category");
    nextParams.delete("detail");
    setSearchParams(nextParams);
  };
  const applySearch = () => {
    setAppliedKeyword(keyword);
    setAppliedPlatform(platform);
    setAppliedReviewStatus(reviewStatus);
    setSelectedIds(new Set());
    setPage(1);
  };
  const resetSearch = () => {
    setKeyword("");
    setPlatform("");
    setReviewStatus("");
    setAppliedKeyword("");
    setAppliedPlatform("");
    setAppliedReviewStatus("");
    setMinimumCriteriaOnly(false);
    setSelectedIds(new Set());
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    nextParams.delete("detail");
    setSearchParams(nextParams);
  };
  const toggleSelected = (applicantId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(applicantId)) {
        next.delete(applicantId);
      } else {
        next.add(applicantId);
      }
      return next;
    });
  };
  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedIds(new Set());
    }
    setSelectionMode((current) => !current);
  };
  const toggleAll = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const shouldClearPage = pagedApplicants.every((applicant) => next.has(applicant.id));
      pagedApplicants.forEach((applicant) => {
        if (shouldClearPage) next.delete(applicant.id);
        else next.add(applicant.id);
      });
      return next;
    });
  };
  const applyBatchStatus = (status: ReviewStatus) => {
    setReviewOverrides((current) => {
      const next = { ...current };
      selectedIds.forEach((applicantId) => {
        next[applicantId] = status;
      });
      return next;
    });
    setSelectedIds(new Set());
    setPage(1);
  };
  const applySingleStatus = (applicantId: string, status: ReviewStatus) => {
    setReviewOverrides((current) => ({ ...current, [applicantId]: status }));
  };
  const columns = applicantListColumns({
    allSelected: pagedApplicants.length > 0
      && pagedApplicants.every((applicant) => selectedIds.has(applicant.id)),
    onToggleAll: toggleAll,
    onToggleSelected: toggleSelected,
    selectedIds,
    selectionMode,
  });

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
          </SearchPanel>
        </div>
        <ChoiceTabs
          ariaLabel="지원자 카테고리"
          emptyOption={{ label: "전체", onSelect: () => openCategory() }}
          onChange={openCategory}
          options={APPLICANT_CATEGORIES}
          value={selectedCategory || null}
        />
        <ApplicantApprovalToolbar
          count={applicants.length}
          minimumCriteriaOnly={minimumCriteriaOnly}
          onApprove={() => applyBatchStatus("승인")}
          onMinimumCriteriaOnlyChange={(checked) => {
            setMinimumCriteriaOnly(checked);
            setSelectedIds(new Set());
            setPage(1);
          }}
          onReject={() => applyBatchStatus("반려")}
          onSelectionModeChange={toggleSelectionMode}
          selectedCount={selectedIds.size}
          selectionMode={selectionMode}
        />
        <div aria-label="지원자 승인" className="fuma-wide-table fuma-settlement-table fuma-applicant-list-table" role="region">
          <DenseTable
            columns={columns}
            onRowClick={(applicant) => (
              selectionMode ? toggleSelected(applicant.id) : openApplicant(applicant)
            )}
            rowKey={(applicant) => applicant.id}
            rows={pagedApplicants}
            selectedRowKeys={selectionMode ? [...selectedIds] : undefined}
          />
        </div>
        <Pagination
          onPageChange={setPage}
          page={currentPage}
          pageSize={APPLICANT_PAGE_SIZE}
          totalPages={totalPages}
        />
      </div>
    </section>
    {detailApplicantId ? (
      <ApplicantDetailPage
        applicantIdOverride={detailApplicantId}
        applicantOverride={detailApplicant}
        embedded
        onClose={() => navigate(applicantPoolPath)}
        onDecision={(decision) => applySingleStatus(decision.applicantId, decision.status)}
      />
    ) : null}
    </>
  );
}

interface ApplicantDetailPageProps {
  applicantIdOverride?: string;
  applicantOverride?: ApplicantFixture;
  embedded?: boolean;
  onClose?: () => void;
  onDecision?: (decision: ApplicantReviewDecision) => void;
}

export function ApplicantDetailPage({
  applicantIdOverride,
  applicantOverride,
  embedded = false,
  onClose,
  onDecision,
}: ApplicantDetailPageProps = {}) {
  const { applicantId: routeApplicantId } = useParams();
  const navigate = useNavigate();
  const applicantId = applicantIdOverride ?? routeApplicantId;
  const applicant = applicantOverride ?? findApplicantFixture(applicantId);
  const [reviewDecision, setReviewDecision] = useState<ApplicantReviewDecision | null>(null);
  const currentDecision = reviewDecision?.applicantId === applicant?.id ? reviewDecision : null;
  const effectiveReviewStatus = currentDecision?.status ?? applicant?.reviewStatus;
  const analysis = applicant ? applicantAnalysisFor(applicant) : null;
  const audienceLabel = applicant?.platform === "Instagram" ? "팔로워" : "구독자";
  const handleDecision = (decision: ApplicantReviewDecision) => {
    setReviewDecision(decision);
    onDecision?.(decision);
  };
  const decide = (status: ApplicantReviewDecision["status"]) => {
    if (!applicant) return;
    handleDecision({
      applicantId: applicant.id,
      note: applicant.reviewNote,
      reason: status === "반려" ? applicant.internalReason : "",
      status,
    });
  };
  const detailProfile: ProfileDetailProfile | undefined = applicant && analysis && effectiveReviewStatus ? {
    audienceLabel,
    audienceValue: formatNumber(applicant.followerCount),
    contentCount: applicant.contentCount,
    engagementValue: "-",
    gallery: applicantFeaturedContentFor(applicant).map((content) => ({
      id: content.id,
      imageUrl: content.thumbnailUrl,
      title: content.title,
    })),
    handle: applicant.channelName,
    infoFields: [
      { label: "지원자 ID", value: applicant.id },
      { label: "계정 ID", value: applicant.channelName },
      { label: "이메일", value: applicant.email },
      { label: "카테고리", value: analysis.category },
      { label: audienceLabel, value: formatNumber(applicant.followerCount) },
      { label: "콘텐츠 수", value: `${formatNumber(applicant.contentCount)}건` },
      { label: "최근 활동", value: applicant.recentActivity },
      { label: "ER", value: "집계 불가" },
    ],
    name: applicant.name,
    platform: applicant.platform,
    profileImageUrl: applicantProfileImageUrl(applicant),
    profileUrl: applicantProfileUrl(applicant),
    status: <StatusPill tone={reviewStatusTone(effectiveReviewStatus)}>{effectiveReviewStatus}</StatusPill>,
  } : undefined;
  const actionSection = applicant && effectiveReviewStatus ? (
    <section className="fuma-creator-detail-sidebar__proposal fuma-applicant-detail-actions">
      <div className="fuma-applicant-detail-actions__heading">
        <span>심사 처리</span>
        <StatusPill tone={reviewStatusTone(effectiveReviewStatus)}>{effectiveReviewStatus}</StatusPill>
      </div>
      <div className="fuma-applicant-detail-actions__buttons">
        <Button onClick={() => decide("승인")} variant="primary">승인</Button>
        <Button onClick={() => decide("반려")} variant="danger">반려</Button>
      </div>
    </section>
  ) : null;

  return (
    <>
      {embedded ? null : <ApplicantListPage />}
      <ProfileDetailShell
        actionSection={actionSection}
        emptyDescription="요청한 지원자 정보를 확인할 수 없습니다."
        onClose={onClose ?? (() => navigate("/applicants"))}
        profile={detailProfile}
        title="지원자 상세"
      >
        {applicant ? <ApplicantAnalysisReport applicant={applicant} /> : null}
      </ProfileDetailShell>
    </>
  );
}
