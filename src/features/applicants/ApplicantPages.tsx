import { useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Checkbox, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SectionTabs } from "../../components/ui/SectionTabs";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { ApplicantAnalysisReport } from "./ApplicantAnalysisReport";
import { PlatformIcon } from "../creators/PlatformIcon";
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

const APPLICANT_COLUMNS: DenseTableColumn<ApplicantFixture>[] = [
  {
    id: "selection",
    header: "선택",
    width: 48,
    align: "center",
    render: (applicant) => (
      <Checkbox
        label={<span className="hsas-visually-hidden">{applicant.name} 선택</span>}
      />
    ),
  },
  { key: "id", header: "지원자 ID", width: 78 },
  { key: "name", header: "이름", width: 70 },
  { key: "platform", header: "SNS 채널", width: 88 },
  {
    key: "followerCount",
    header: "팔로워·구독자",
    width: 105,
    align: "right",
    render: (applicant) => formatNumber(applicant.followerCount),
  },
  {
    key: "contentCount",
    header: "콘텐츠 수",
    width: 76,
    align: "right",
    render: (applicant) => formatNumber(applicant.contentCount),
  },
  { key: "recentActivity", header: "최근 활동일", width: 92, align: "center" },
  {
    key: "averageViews",
    header: "평균 조회 수",
    width: 92,
    align: "right",
    render: (applicant) => formatNumber(applicant.averageViews),
  },
  {
    key: "averageReactions",
    header: "평균 반응 수",
    width: 92,
    align: "right",
    render: (applicant) => formatNumber(applicant.averageReactions),
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
    key: "autoRejected",
    header: "자동 반려",
    width: 76,
    align: "center",
    render: (applicant) => (
      <StatusPill tone={applicant.autoRejected ? "rejected" : "neutral"}>
        {applicant.autoRejected ? "해당" : "비해당"}
      </StatusPill>
    ),
  },
  {
    id: "deliveryStatus",
    header: "결과 전송",
    width: 84,
    align: "center",
    render: (applicant) => {
      const [primaryDelivery] = applicant.deliveries;

      return (
        <StatusPill tone={deliveryStatusTone(primaryDelivery.status)}>
          {primaryDelivery.status}
        </StatusPill>
      );
    },
  },
  {
    id: "detail",
    header: "상세",
    width: 58,
    align: "center",
    render: (applicant) => (
      <Link
        aria-label={`${applicant.name} 상세 보기`}
        className="fuma-table-action fuma-table-link"
        to={`/applicants/${applicant.id}`}
      >
        보기
      </Link>
    ),
  },
];

export function ApplicantListPage() {
  return (
    <section className="fuma-page">
      <PageHeader screenCode="AP101" title="지원자 심사" />
      <div className="fuma-page__body">
        <SearchPanel actions={<SearchActions />}>
          <FilterField htmlFor="applicant-keyword" label="검색어">
            <TextInput
              id="applicant-keyword"
              name="keyword"
              placeholder="지원자 ID 또는 이름 검색"
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
        <div className="fuma-result-toolbar">
          <strong>지원자 목록</strong>
          <span>총 {APPLICANTS.length}건</span>
        </div>
        <div
          aria-label="지원자 목록"
          className="fuma-wide-table fuma-applicant-list-table"
          role="region"
        >
          <DenseTable
            columns={APPLICANT_COLUMNS}
            rowKey={(applicant) => applicant.id}
            rows={[...APPLICANTS]}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
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

function BasicInformation({ applicant }: { applicant: ApplicantFixture }) {
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

function ApplicantReviewHero({ applicant }: { applicant: ApplicantFixture }) {
  const analysis = applicantAnalysisFor(applicant);
  const contents = applicantFeaturedContentFor(applicant);
  const audienceLabel = applicant.platform === "Instagram" ? "팔로워" : "구독자";
  const passes = applicant.followerCount >= 500 && analysis.recent90ContentCount >= 3;

  return (
    <section aria-label={`${applicant.name} 지원자 심사 요약`} className="fuma-applicant-detail-hero">
      <div className="fuma-applicant-detail-hero__visual">
        {contents.slice(0, 3).map((content, index) => (
          <img alt="" className={`fuma-applicant-detail-hero__content-${index + 1}`} key={content.id} src={content.thumbnailUrl} />
        ))}
        <span className="fuma-applicant-detail-hero__portrait">
          <img alt={`${applicant.name} 프로필`} src={applicantProfileImageUrl(applicant)} />
          <span className="fuma-applicant-detail-hero__platform"><PlatformIcon platform={applicant.platform} /></span>
        </span>
      </div>
      <div className="fuma-applicant-detail-hero__body">
        <div className="fuma-applicant-detail-hero__topline">
          <span>APPLICANT REVIEW · {applicant.id}</span>
          <StatusPill tone={reviewStatusTone(applicant.reviewStatus)}>{applicant.reviewStatus}</StatusPill>
        </div>
        <div className="fuma-applicant-detail-hero__identity">
          <h2>{applicant.name}</h2>
          <a href={applicantProfileUrl(applicant)} rel="noreferrer" target="_blank">
            <PlatformIcon decorative platform={applicant.platform} />
            <span>{applicant.channelName}</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="fuma-applicant-detail-hero__summary">{analysis.summary}</p>
        <div className="fuma-applicant-detail-hero__categories">
          {analysis.categories.map((category) => <span key={category}>{category}</span>)}
          {analysis.keywords.slice(0, 2).map((keyword) => <span key={keyword.label}>#{keyword.label}</span>)}
        </div>
        <dl className="fuma-applicant-detail-hero__metrics">
          <div><dt>{audienceLabel}</dt><dd>{formatNumber(applicant.followerCount)}</dd></div>
          <div><dt>최근 90일 콘텐츠</dt><dd>{analysis.recent90ContentCount}건</dd></div>
          <div><dt>평균 조회</dt><dd>{formatNumber(applicant.averageViews)}</dd></div>
          <div><dt>ER</dt><dd>{analysis.engagementRate.toFixed(1)}%</dd></div>
        </dl>
      </div>
      <aside className={`fuma-applicant-detail-hero__decision fuma-applicant-detail-hero__decision--${passes ? "pass" : "fail"}`}>
        <span>자동 심사</span>
        <strong>{passes ? "통과" : "반려 대상"}</strong>
        <p>{passes ? "최소 요건을 모두 충족했습니다." : "최소 요건 미충족 항목이 있습니다."}</p>
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
  showAutoRejectionDetails,
}: {
  applicant: ApplicantFixture;
  showAutoRejectionDetails: boolean;
}) {
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
            defaultValue={applicant.reviewNote}
          />
        </FormRow>
        <FormRow label="반려 사유(내부)">
          <Select
            aria-label="반려 사유(내부)"
            defaultValue={applicant.autoRejected ? "정량 기준 미충족" : ""}
            options={INTERNAL_REASON_OPTIONS}
          />
        </FormRow>
      </div>
      <div className="fuma-applicant-section__actions">
        <Button variant="primary">승인</Button>
        <Button variant="danger">반려</Button>
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
  { id: "basic", label: "기본 정보" },
  { id: "metrics", label: "SNS 지표" },
  { id: "screening", label: "자동 심사" },
  { id: "featured", label: "대표 콘텐츠", targetId: "featured-content" },
  { id: "analysis", label: "AI 분석 리포트" },
  { id: "review", label: "심사 처리" },
  { id: "delivery", label: "결과 전송" },
];

export function ApplicantDetailPage() {
  const { applicantId } = useParams();
  const [searchParams] = useSearchParams();
  const applicant = findApplicantFixture(applicantId);
  const showAutoRejectionDetails =
    applicant?.id === "ap-003" && searchParams.get("fixture") === "auto-rejected";
  const [activeSection, setActiveSection] = useState("basic");

  return (
    <section className="fuma-page fuma-applicant-detail-page">
      <PageHeader screenCode="AP102" title="지원자 상세 심사" />
      <div className="fuma-page__body">
        {applicant ? (
          <>
            <div className="fuma-detail-toolbar">
              <Link className="hsas-button fuma-detail-toolbar__link" to="/applicants">
                목록
              </Link>
            </div>
            <ApplicantReviewHero applicant={applicant} />
            <SectionTabs activeId={activeSection} items={DETAIL_TABS} onChange={setActiveSection} />
            <BasicInformation applicant={applicant} />
            <SnsMetrics applicant={applicant} />
            <ApplicantAnalysisReport applicant={applicant} />
            <ReviewSection
              applicant={applicant}
              key={`${applicant.id}-${showAutoRejectionDetails}`}
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
    </section>
  );
}
