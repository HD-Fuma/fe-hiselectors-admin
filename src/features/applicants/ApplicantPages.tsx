import { useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SelectionModeButton } from "../../components/ui/SelectionModeButton";
import { SectionTabs } from "../../components/ui/SectionTabs";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { formatNumber } from "../../lib/formatters";
import { paginate } from "../../lib/pagination";
import {
  ApplicantAnalysisReport,
  ApplicantAutomaticReview,
  ApplicantFeaturedContents,
} from "./ApplicantAnalysisReport";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { SOCIAL_PLATFORM_FILTER_OPTIONS } from "../../components/social/platforms";
import {
  APPLICANTS,
  APPLICANT_CATEGORIES,
  applicantAnalysisFor,
  applicantProfileImageUrl,
  applicantProfileUrl,
  findApplicantFixture,
  type ApplicantDeliveryRecord,
  type ApplicantCategory,
  type ApplicantFixture,
  type DeliveryStatus,
  type ReviewStatus,
} from "./fixtures";

const REVIEW_STATUS_OPTIONS = ["전체", "검토 대기", "승인", "반려", "자동 반려"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
const APPLICANT_PAGE_SIZE = 20;
const INTERNAL_REASON_OPTIONS = [
  { label: "선택", value: "" },
  { label: "정량 기준 미충족", value: "정량 기준 미충족" },
  { label: "채널 적합도 낮음", value: "채널 적합도 낮음" },
  { label: "운영 정책 미충족", value: "운영 정책 미충족" },
  { label: "기타", value: "기타" },
];

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

function deliveryStatusTone(
  status: DeliveryStatus,
): NonNullable<StatusPillProps["tone"]> {
  if (status === "전송 완료") {
    return "approved";
  }
  if (status === "전송 대기") {
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
        <nav aria-label="지원자 카테고리" className="fuma-creator-category-filter">
          <div>
            <button
              aria-pressed={!selectedCategory}
              className="fuma-creator-category-filter__option"
              onClick={() => openCategory()}
              type="button"
            >
              전체
            </button>
            {APPLICANT_CATEGORIES.map((category) => (
              <button
                aria-pressed={selectedCategory === category}
                className="fuma-creator-category-filter__option"
                key={category}
                onClick={() => openCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </nav>
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

interface KeyValueSectionProps {
  fields: Array<[string, ReactNode]>;
  id: string;
  sectionId: string;
  title: string;
}

function KeyValueSection({ fields, id, sectionId, title }: KeyValueSectionProps) {
  return (
    <section aria-labelledby={id} className="fuma-content-section" id={sectionId}>
      <header className="fuma-content-section__header">
        <h2 id={id}>{title}</h2>
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

export function BasicInformation({ applicant }: { applicant: ApplicantFixture }) {
  return (
    <KeyValueSection
      fields={[
        ["지원자 ID", applicant.id],
        ["이름", applicant.name],
        ["지원일", applicant.appliedAt],
        ["이메일", applicant.email],
        ["연락처", applicant.phone],
        [
          "심사 상태",
          <StatusPill key="review-status" tone={reviewStatusTone(applicant.reviewStatus)}>
            {applicant.reviewStatus}
          </StatusPill>,
        ],
      ]}
      id="applicant-basic-title"
      sectionId="basic"
      title="기본 정보"
    />
  );
}

function ApplicantReviewHero({
  applicant,
  decision,
}: {
  applicant: ApplicantFixture;
  decision: ApplicantReviewDecision | null;
}) {
  const analysis = applicantAnalysisFor(applicant);
  const audienceLabel = applicant.platform === "Instagram" ? "팔로워" : "구독자";
  const passes = applicant.followerCount >= 500 && analysis.recent90ContentCount >= 3;

  return (
    <section aria-label={`${applicant.name} 지원자 심사 요약`} className="fuma-creator-detail-hero fuma-applicant-detail-hero fuma-unified-detail-hero">
      <div className="fuma-creator-detail-hero__portrait">
        <img alt={`${applicant.name} 프로필`} src={applicantProfileImageUrl(applicant)} />
        <span className="fuma-creator-detail-hero__platform"><PlatformIcon platform={applicant.platform} /></span>
      </div>
      <div className="fuma-creator-detail-hero__content">
        <div className="fuma-creator-detail-hero__identity">
          <div className="fuma-creator-detail-hero__title-row">
            <h2>{applicant.name}</h2>
            <StatusPill tone={reviewStatusTone(applicant.reviewStatus)}>{applicant.reviewStatus}</StatusPill>
          </div>
          <a className="fuma-creator-detail-hero__channel" href={applicantProfileUrl(applicant)} rel="noreferrer" target="_blank">
            <PlatformIcon decorative platform={applicant.platform} />
            <span>{applicant.channelName}</span>
            <span aria-hidden="true">↗</span>
          </a>
          <div aria-label="카테고리와 키워드" className="fuma-creator-detail-hero__categories">
            <strong>{analysis.category}</strong>
            <span aria-hidden="true">/</span>
            <span>{analysis.keywords.slice(0, 3).map((keyword) => `#${keyword.label}`).join("  ")}</span>
          </div>
        </div>
        <p className="fuma-unified-detail-hero__summary">{analysis.summary}</p>
        <dl className="fuma-creator-detail-hero__metrics">
          <div><dt>{audienceLabel}</dt><dd>{formatNumber(applicant.followerCount)}</dd></div>
          <div><dt>{applicant.platform === "YouTube" ? "최근 90일 동영상" : "최근 90일 콘텐츠"}</dt><dd>{analysis.recent90ContentCount}건</dd></div>
          <div><dt>평균 조회</dt><dd>{formatNumber(applicant.averageViews)}</dd></div>
          <div><dt>ER</dt><dd>{analysis.engagementRate.toFixed(1)}%</dd></div>
        </dl>
      </div>
      <aside
        aria-label={decision ? "지원자 심사 결과" : "지원자 자동 심사 결과"}
        className={`fuma-creator-detail-hero__actions fuma-applicant-unified-decision fuma-applicant-unified-decision--${decision?.status === "반려" || (!decision && !passes) ? "fail" : "pass"} fuma-review-summary`}
      >
        <span>{decision ? "심사 결과" : "자동 심사"}</span>
        {decision ? (
          <StatusPill tone={decision.status === "승인" ? "approved" : "rejected"}>{decision.status}</StatusPill>
        ) : (
          <strong>{passes ? "통과" : "반려 대상"}</strong>
        )}
        <p>{decision?.note || (passes ? "최소 요건을 모두 충족했습니다." : "최소 요건 미충족 항목이 있습니다.")}</p>
        {decision?.status === "반려" && decision.reason ? <small>{decision.reason}</small> : null}
        <a href="#review">심사 처리로 이동 <span aria-hidden="true">↓</span></a>
      </aside>
    </section>
  );
}

function SnsMetrics({ applicant }: { applicant: ApplicantFixture }) {
  const contentCountLabel = applicant.platform === "YouTube" ? "동영상 수" : "콘텐츠 수";

  return (
    <KeyValueSection
      fields={[
        ["SNS 채널", applicant.platform],
        ["계정명", applicant.channelName],
        ["팔로워·구독자", formatNumber(applicant.followerCount)],
        [contentCountLabel, formatNumber(applicant.contentCount)],
        ["최근 활동일", applicant.recentActivity],
        ["평균 조회 수", formatNumber(applicant.averageViews)],
        ["평균 반응 수", formatNumber(applicant.averageReactions)],
      ]}
      id="applicant-metrics-title"
      sectionId="metrics"
      title="SNS 채널 정보"
    />
  );
}

function AutoRejectionDetails({
  applicant,
  showDetails,
}: {
  applicant: ApplicantFixture;
  showDetails: boolean;
}) {
  if (!showDetails) {
    return null;
  }

  return (
    <div className="fuma-auto-rejection">
      <div className="fuma-auto-rejection__criteria">
        <h3>정량 기준 미충족</h3>
        <ul>
          {applicant.failedCriteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
      </div>
      <dl className="fuma-auto-rejection__reason">
        <dt>내부 반려 사유</dt>
        <dd>{applicant.internalReason}</dd>
      </dl>
    </div>
  );
}

function ReviewSection({
  applicant,
  onDecision,
  showAutoRejectionDetails,
}: {
  applicant: ApplicantFixture;
  onDecision: (decision: ApplicantReviewDecision) => void;
  showAutoRejectionDetails: boolean;
}) {
  const [note, setNote] = useState(applicant.reviewNote);
  const [reason, setReason] = useState(applicant.autoRejected ? "정량 기준 미충족" : "");

  const decide = (status: ApplicantReviewDecision["status"]) => {
    onDecision({ applicantId: applicant.id, note, reason: status === "반려" ? reason : "", status });
  };

  return (
    <section
      aria-labelledby="applicant-review-title"
      className="fuma-content-section fuma-applicant-review"
      id="review"
    >
      <header className="fuma-content-section__header">
        <h2 id="applicant-review-title">심사 처리</h2>
      </header>
      <AutoRejectionDetails applicant={applicant} showDetails={showAutoRejectionDetails} />
      <div className="fuma-applicant-review__form">
        <FormRow label="자동 반려 여부">
          <StatusPill tone={applicant.autoRejected ? "rejected" : "neutral"}>
            {applicant.autoRejected ? "해당" : "비해당"}
          </StatusPill>
        </FormRow>
        <FormRow label="내부 검토 의견">
          <textarea
            aria-label="내부 검토 의견"
            className="hsas-control fuma-applicant-review__textarea"
            onChange={(event) => setNote(event.target.value)}
            value={note}
          />
        </FormRow>
        <FormRow label="반려 사유(내부)">
          <Select
            aria-label="반려 사유(내부)"
            onChange={(event) => setReason(event.target.value)}
            options={INTERNAL_REASON_OPTIONS}
            value={reason}
          />
        </FormRow>
      </div>
      <div className="fuma-applicant-section__actions">
        <Button onClick={() => decide("승인")} variant="primary">승인</Button>
        <Button onClick={() => decide("반려")} variant="danger">반려</Button>
      </div>
    </section>
  );
}

const DELIVERY_COLUMNS: DenseTableColumn<ApplicantDeliveryRecord>[] = [
  { key: "channel", header: "채널", width: 100 },
  { key: "recipient", header: "수신 정보" },
  {
    key: "status",
    header: "상태",
    width: 110,
    align: "center",
    render: (delivery) => (
      <StatusPill tone={deliveryStatusTone(delivery.status)}>{delivery.status}</StatusPill>
    ),
  },
  { key: "sentAt", header: "전송 시각", width: 160, align: "center" },
];

function DeliverySection({ applicant }: { applicant: ApplicantFixture }) {
  return (
    <section
      aria-labelledby="applicant-delivery-title"
      className="fuma-content-section fuma-applicant-delivery"
      id="delivery"
    >
      <header className="fuma-content-section__header">
        <h2 id="applicant-delivery-title">심사 결과 전송</h2>
      </header>
      <DenseTable
        columns={DELIVERY_COLUMNS}
        rowKey={(delivery) => `${delivery.channel}-${delivery.recipient}`}
        rows={[...applicant.deliveries]}
      />
      <div className="fuma-applicant-delivery__footer">
        <p>
          알림톡 미지원 시 이메일로 발송하며, 반려 사유는 지원자에게 공개하지 않습니다.
        </p>
        <Button variant="primary">심사 결과 전송</Button>
      </div>
    </section>
  );
}

const DETAIL_TABS = [
  { id: "featured", label: "대표 콘텐츠", targetId: "featured-content" },
  { id: "basic", label: "기본 정보" },
  { id: "metrics", label: "SNS 지표" },
  { id: "screening", label: "자동 심사" },
  { id: "analysis", label: "AI 분석 리포트" },
  { id: "review", label: "심사 처리" },
  { id: "delivery", label: "결과 전송" },
];

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicantId = applicantIdOverride ?? routeApplicantId;
  const applicant = applicantOverride ?? findApplicantFixture(applicantId);
  const showAutoRejectionDetails =
    applicant?.id === "ap-003" && searchParams.get("fixture") === "auto-rejected";
  const [activeSection, setActiveSection] = useState("featured");
  const [reviewDecision, setReviewDecision] = useState<ApplicantReviewDecision | null>(null);
  const currentDecision = reviewDecision?.applicantId === applicant?.id ? reviewDecision : null;
  const handleDecision = (decision: ApplicantReviewDecision) => {
    setReviewDecision(decision);
    onDecision?.(decision);
  };

  return (
    <>
      {embedded ? null : <ApplicantListPage />}
      <SidePanel onClose={onClose ?? (() => navigate("/applicants"))} title="지원자 상세 심사">
        <div className="fuma-detail-panel__content fuma-applicant-detail-page">
          {applicant ? (
            <>
            <ApplicantReviewHero applicant={applicant} decision={currentDecision} />
            <SectionTabs activeId={activeSection} items={DETAIL_TABS} onChange={setActiveSection} />
            <ApplicantFeaturedContents applicant={applicant} />
            <SnsMetrics applicant={applicant} />
            <ApplicantAutomaticReview applicant={applicant} />
            <ApplicantAnalysisReport applicant={applicant} />
            <ReviewSection
              applicant={applicant}
              key={`${applicant.id}-${showAutoRejectionDetails}`}
              onDecision={handleDecision}
              showAutoRejectionDetails={showAutoRejectionDetails}
            />
            <DeliverySection applicant={applicant} />
            </>
          ) : (
            <EmptyState
              description="요청한 지원자 정보를 확인할 수 없습니다."
              title="대상을 찾을 수 없습니다"
            />
          )}
        </div>
      </SidePanel>
    </>
  );
}
