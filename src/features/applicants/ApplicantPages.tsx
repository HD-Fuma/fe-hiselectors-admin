import { useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SectionTabs } from "../../components/ui/SectionTabs";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import {
  ApplicantAnalysisReport,
  ApplicantAutomaticReview,
  ApplicantFeaturedContents,
} from "./ApplicantAnalysisReport";
import { CreatorDetailPage } from "../creators/CreatorPages";
import { PlatformIcon } from "../creators/PlatformIcon";
import type { CreatorFixture, CreatorMediaVisual } from "../creators/fixtures";
import {
  APPLICANTS,
  applicantAnalysisFor,
  applicantFeaturedContentFor,
  applicantProfileImageUrl,
  applicantProfileUrl,
  findApplicantFixture,
  type ApplicantDeliveryRecord,
  type ApplicantFixture,
  type DeliveryStatus,
  type ReviewStatus,
} from "./fixtures";

const PLATFORM_OPTIONS = ["전체", "Instagram", "YouTube"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const REVIEW_STATUS_OPTIONS = ["전체", "검토 대기", "승인", "반려", "자동 반려"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
const AUTO_REJECTION_OPTIONS = ["전체", "해당", "비해당"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const DELIVERY_STATUS_OPTIONS = ["전체", "전송 대기", "전송 완료", "전송 실패"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
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

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
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

function PlatformLabel({ platform }: { platform: CreatorFixture["profile"]["platform"] }) {
  return (
    <span className="fuma-platform-label">
      <PlatformIcon platform={platform} />
      <span aria-hidden="true">{platform}</span>
    </span>
  );
}

const APPLICANT_VISUALS: CreatorMediaVisual[] = [
  "beauty",
  "fashion",
  "cooking",
  "table",
  "city",
  "coffee",
];

type ApplicantListRow = CreatorFixture & {
  autoRejected: boolean;
  reviewStatus: ReviewStatus;
};

function applicantToCreatorCard(applicant: ApplicantFixture): ApplicantListRow {
  const analysis = applicantAnalysisFor(applicant);
  const [primaryDelivery] = applicant.deliveries;

  return {
    id: applicant.id,
    name: applicant.name,
    profile: {
      platform: applicant.platform,
      handle: applicant.channelName,
      profileUrl: applicantProfileUrl(applicant),
      followers: applicant.followerCount,
      averageViews: applicant.averageViews,
      averageReactions: applicant.averageReactions,
      engagementRate: analysis.engagementRate,
      profileImageUrl: applicantProfileImageUrl(applicant),
    },
    category: analysis.category,
    keywords: analysis.keywords.slice(0, 3).map((keyword) => `#${keyword.label}`),
    tier: "T3",
    contentCount: applicant.contentCount,
    recentActivity: applicant.recentActivity,
    featuredContents: applicantFeaturedContentFor(applicant).map((content, index) => ({
      id: content.id,
      title: content.title,
      mediaType: content.mediaType,
      views: content.views,
      visual: APPLICANT_VISUALS[index % APPLICANT_VISUALS.length],
      thumbnailUrl: content.thumbnailUrl,
    })),
    aiReport: applicant.aiReport,
    proposalStatus: primaryDelivery.status === "전송 완료" ? "발송 완료" : "발송 전",
    availableProposalChannels: ["이메일"],
    autoRejected: applicant.autoRejected,
    email: applicant.email,
    reviewStatus: applicant.reviewStatus,
  };
}

function ApplicantApprovalToolbar({
  count,
  onApprove,
  onReject,
  onSelectionModeChange,
  selectedCount,
  selectionMode,
}: {
  count: number;
  onApprove: () => void;
  onReject: () => void;
  onSelectionModeChange: () => void;
  selectedCount: number;
  selectionMode: boolean;
}) {
  return (
    <div className="fuma-creator-toolbar">
      <strong className="fuma-creator-toolbar__summary">지원자 승인</strong>
      <span>총 {count}건</span>
      <div className="fuma-creator-toolbar__controls">
        <button
          aria-pressed={selectionMode}
          className="fuma-creator-toolbar__select-mode"
          onClick={onSelectionModeChange}
          type="button"
        >
          {selectionMode ? "선택 완료" : "선택"}
        </button>
        {selectionMode ? (
          <>
            <span className="fuma-creator-toolbar__selected">{selectedCount}명 선택</span>
            <button
              className="fuma-creator-toolbar__proposal"
              disabled={selectedCount === 0}
              onClick={onApprove}
              type="button"
            >
              일괄 승인
            </button>
            <button
              className="fuma-creator-toolbar__proposal"
              disabled={selectedCount === 0}
              onClick={onReject}
              type="button"
            >
              일괄 반려
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function applicantListColumns({
  allSelected,
  onOpen,
  onToggleAll,
  onToggleSelected,
  selectedIds,
  selectionMode,
}: {
  allSelected: boolean;
  onOpen: (applicant: ApplicantListRow) => void;
  onToggleAll: () => void;
  onToggleSelected: (applicantId: string) => void;
  selectedIds: ReadonlySet<string>;
  selectionMode: boolean;
}): DenseTableColumn<ApplicantListRow>[] {
  const columns: DenseTableColumn<ApplicantListRow>[] = [
  { key: "name", header: "이름", width: 70 },
  {
    id: "platform",
    header: "플랫폼",
    width: 115,
    render: (applicant) => <PlatformLabel platform={applicant.profile.platform} />,
  },
  {
    id: "account",
    header: "계정",
    width: 130,
    render: (applicant) => applicant.profile.handle,
  },
  {
    id: "categories",
    header: "카테고리",
    width: 110,
    render: (applicant) => applicant.category,
  },
  {
    id: "keywords",
    header: "키워드",
    width: 165,
    render: (applicant) => applicant.keywords.join(" "),
  },
  {
    id: "followers",
    header: "팔로워·구독자",
    width: 105,
    align: "right",
    render: (applicant) => formatNumber(applicant.profile.followers),
  },
  {
    id: "engagementRate",
    header: "ER",
    width: 72,
    align: "right",
    render: (applicant) => `${applicant.profile.engagementRate.toFixed(1)}%`,
  },
  {
    key: "recentActivity",
    header: "최근 활동일",
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
  {
    id: "detail",
    header: "상세",
    width: 60,
    align: "center",
    render: (applicant) => (
      <Button
        aria-label={`${applicant.name} 심사하기`}
        className="fuma-table-action"
        onClick={() => onOpen(applicant)}
      >
        심사
      </Button>
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
    ...columns.filter((column) => column.id !== "detail"),
  ];
}

export function ApplicantListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const detailApplicantId = searchParams.get("detail");
  const [reviewOverrides, setReviewOverrides] = useState<Partial<Record<string, ReviewStatus>>>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const applicants = APPLICANTS.map((applicant) => (
    applicantToCreatorCard({
      ...applicant,
      reviewStatus: reviewOverrides[applicant.id] ?? applicant.reviewStatus,
    })
  ));
  const detailApplicant = applicants.find((applicant) => applicant.id === detailApplicantId);
  const openApplicant = (applicant: ApplicantListRow) => navigate(`/applicants?detail=${applicant.id}`);
  const toggleSelected = (applicantId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      next.has(applicantId) ? next.delete(applicantId) : next.add(applicantId);
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
    setSelectedIds((current) => (
      current.size === applicants.length ? new Set() : new Set(applicants.map((applicant) => applicant.id))
    ));
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
  };
  const applySingleStatus = (applicantId: string, status: ReviewStatus) => {
    setReviewOverrides((current) => ({ ...current, [applicantId]: status }));
  };
  const columns = applicantListColumns({
    allSelected: applicants.length > 0 && selectedIds.size === applicants.length,
    onOpen: openApplicant,
    onToggleAll: toggleAll,
    onToggleSelected: toggleSelected,
    selectedIds,
    selectionMode,
  });

  return (
    <>
    <section className="fuma-page">
      <PageHeader screenCode="AP101" title="지원자 심사" />
      <div className="fuma-page__body">
        <SearchPanel actions={<SearchActions />}>
          <FilterField htmlFor="applicant-keyword" label="검색어">
            <TextInput
              id="applicant-keyword"
              name="keyword"
              placeholder="이름 또는 계정 검색"
            />
          </FilterField>
          <FilterField htmlFor="applicant-platform" label="SNS 채널">
            <Select
              id="applicant-platform"
              name="platform"
              options={PLATFORM_OPTIONS}
            />
          </FilterField>
          <FilterField htmlFor="applicant-review-status" label="심사 상태">
            <Select
              id="applicant-review-status"
              name="reviewStatus"
              options={REVIEW_STATUS_OPTIONS}
            />
          </FilterField>
          <FilterField htmlFor="applicant-auto-rejected" label="자동 반려">
            <Select
              id="applicant-auto-rejected"
              name="autoRejected"
              options={AUTO_REJECTION_OPTIONS}
            />
          </FilterField>
          <FilterField htmlFor="applicant-delivery-status" label="결과 전송">
            <Select
              id="applicant-delivery-status"
              name="deliveryStatus"
              options={DELIVERY_STATUS_OPTIONS}
            />
          </FilterField>
        </SearchPanel>
        <ApplicantApprovalToolbar
          count={applicants.length}
          onApprove={() => applyBatchStatus("승인")}
          onReject={() => applyBatchStatus("반려")}
          onSelectionModeChange={toggleSelectionMode}
          selectedCount={selectedIds.size}
          selectionMode={selectionMode}
        />
        <div aria-label="지원자 승인" className="fuma-wide-table" role="region">
          <DenseTable
            columns={columns}
            onRowClick={(applicant) => (
              selectionMode ? toggleSelected(applicant.id) : openApplicant(applicant)
            )}
            rowKey={(applicant) => applicant.id}
            rows={applicants}
            selectedRowKeys={selectionMode ? [...selectedIds] : undefined}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
    {detailApplicantId ? (
      <CreatorDetailPage
        actionSection={detailApplicant ? (
          <section className="fuma-creator-detail-sidebar__proposal fuma-applicant-detail-actions">
            <span>심사 처리</span>
            <strong><i aria-hidden="true" />{detailApplicant.reviewStatus}</strong>
            <p>분석 리포트를 확인한 뒤 지원자를 승인하거나 반려할 수 있습니다.</p>
            <div className="fuma-applicant-detail-actions__buttons">
              <Button
                onClick={() => applySingleStatus(detailApplicant.id, "승인")}
                variant="primary"
              >
                승인
              </Button>
              <Button
                onClick={() => applySingleStatus(detailApplicant.id, "반려")}
                variant="danger"
              >
                반려
              </Button>
            </div>
          </section>
        ) : undefined}
        creatorOverride={detailApplicant}
        embedded
        onClose={() => navigate("/applicants")}
        statusPill={detailApplicant ? (
          <StatusPill tone={reviewStatusTone(detailApplicant.reviewStatus)}>
            {detailApplicant.reviewStatus}
          </StatusPill>
        ) : undefined}
        title="지원자 상세"
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
          <div><dt>최근 90일 콘텐츠</dt><dd>{analysis.recent90ContentCount}건</dd></div>
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
  return (
    <KeyValueSection
      fields={[
        ["SNS 채널", applicant.platform],
        ["계정명", applicant.channelName],
        ["팔로워·구독자", formatNumber(applicant.followerCount)],
        ["콘텐츠 수", formatNumber(applicant.contentCount)],
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
  embedded?: boolean;
  onClose?: () => void;
}

export function ApplicantDetailPage({
  applicantIdOverride,
  embedded = false,
  onClose,
}: ApplicantDetailPageProps = {}) {
  const { applicantId: routeApplicantId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicantId = applicantIdOverride ?? routeApplicantId;
  const applicant = findApplicantFixture(applicantId);
  const showAutoRejectionDetails =
    applicant?.id === "ap-003" && searchParams.get("fixture") === "auto-rejected";
  const [activeSection, setActiveSection] = useState("featured");
  const [reviewDecision, setReviewDecision] = useState<ApplicantReviewDecision | null>(null);
  const currentDecision = reviewDecision?.applicantId === applicant?.id ? reviewDecision : null;

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
              onDecision={setReviewDecision}
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
