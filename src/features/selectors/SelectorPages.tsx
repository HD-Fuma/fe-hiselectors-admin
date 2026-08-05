import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Checkbox, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import {
  COHORTS,
  QUALIFICATIONS,
  SELECTED_QUALIFICATION,
  SELECTORS,
  type CohortFixture,
  type QualificationFixture,
  type SelectorFixture,
} from "./fixtures";

const COHORT_STATUS_OPTIONS = ["전체", "모집 예정", "모집 중", "마감"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
const SELECTOR_COHORT_OPTIONS = ["전체", "4기", "3기", "2기"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const QUALIFICATION_COHORT_OPTIONS = ["전체", "3기", "2기"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const SELECTOR_STATUS_OPTIONS = ["전체", "활동 중", "경고", "박탈", "수료"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
const QUALIFICATION_CHANGE_OPTIONS = ["활동 중", "경고", "박탈", "수료"].map(
  (label) => ({ label, value: label }),
);
const BLACKLIST_OPTIONS = ["전체", "등록", "미등록"].map((label) => ({
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

function ResultToolbar({
  action,
  count,
  title,
}: {
  action?: ReactNode;
  count: number;
  title: string;
}) {
  return (
    <div className="fuma-result-toolbar">
      <strong>{title}</strong>
      <span>총 {count}건</span>
      {action ? <div className="fuma-result-toolbar__actions">{action}</div> : null}
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function selectorStatusTone(
  status: SelectorFixture["status"],
): NonNullable<StatusPillProps["tone"]> {
  if (status === "활동 중") {
    return "approved";
  }
  if (status === "경고") {
    return "pending";
  }
  if (status === "박탈") {
    return "rejected";
  }
  return "neutral";
}

function cohortStatusTone(
  status: CohortFixture["status"],
): NonNullable<StatusPillProps["tone"]> {
  if (status === "모집 중") {
    return "approved";
  }
  if (status === "모집 예정") {
    return "pending";
  }
  return "neutral";
}

const COHORT_COLUMNS: DenseTableColumn<CohortFixture>[] = [
  { key: "name", header: "기수명", width: 84 },
  { key: "recruitmentPeriod", header: "모집 기간", width: 210, align: "center" },
  { key: "activityPeriod", header: "활동 기간", width: 210, align: "center" },
  {
    key: "status",
    header: "모집 상태",
    width: 100,
    align: "center",
    render: (cohort) => (
      <StatusPill tone={cohortStatusTone(cohort.status)}>{cohort.status}</StatusPill>
    ),
  },
  {
    key: "participantCount",
    header: "참여자 수",
    width: 90,
    align: "right",
    render: (cohort) => formatNumber(cohort.participantCount),
  },
  {
    id: "manage",
    header: "관리",
    width: 68,
    align: "center",
    render: (cohort) => (
      <Button aria-label={`${cohort.name} 수정`} className="fuma-table-action">
        수정
      </Button>
    ),
  },
];

export function CohortManagementPage() {
  return (
    <section className="fuma-page">
      <PageHeader screenCode="SL101" title="셀렉터스 기수 관리" />
      <div className="fuma-page__body">
        <SearchPanel actions={<SearchActions />}>
          <FilterField htmlFor="cohort-name" label="기수명">
            <TextInput id="cohort-name" name="cohortName" placeholder="기수명 검색" />
          </FilterField>
          <FilterField htmlFor="cohort-status" label="모집 상태">
            <Select
              id="cohort-status"
              name="cohortStatus"
              options={COHORT_STATUS_OPTIONS}
            />
          </FilterField>
        </SearchPanel>
        <ResultToolbar
          action={<Button variant="primary">기수 생성</Button>}
          count={COHORTS.length}
          title="기수 목록"
        />
        <div aria-label="기수 목록" className="fuma-wide-table" role="region">
          <DenseTable columns={COHORT_COLUMNS} rowKey={(cohort) => cohort.id} rows={COHORTS} />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
  );
}

const SELECTOR_COLUMNS: DenseTableColumn<SelectorFixture>[] = [
  { key: "name", header: "이름", width: 88 },
  { key: "cohort", header: "기수", width: 60, align: "center" },
  { key: "sns", header: "SNS", width: 160 },
  {
    key: "status",
    header: "활동 상태",
    width: 88,
    align: "center",
    render: (selector) => (
      <StatusPill tone={selectorStatusTone(selector.status)}>{selector.status}</StatusPill>
    ),
  },
  { key: "contentCount", header: "콘텐츠 수", width: 78, align: "right" },
  { key: "violationCount", header: "위반 횟수", width: 78, align: "right" },
  {
    key: "clicks",
    header: "클릭",
    width: 90,
    align: "right",
    render: (selector) => formatNumber(selector.clicks),
  },
  {
    key: "conversions",
    header: "전환",
    width: 76,
    align: "right",
    render: (selector) => formatNumber(selector.conversions),
  },
  { key: "recentActivity", header: "최근 활동일", width: 104, align: "center" },
  {
    id: "detail",
    header: "상세",
    width: 62,
    align: "center",
    render: (selector) => (
      <Link aria-label={`${selector.name} 상세 보기`} className="fuma-table-action" to={`/selectors/${selector.id}`}>
        보기
      </Link>
    ),
  },
];

export function SelectorOverviewPage() {
  const navigate = useNavigate();

  return (
    <section className="fuma-page">
      <PageHeader screenCode="SL201" title="기수별 셀렉터스 현황" />
      <div className="fuma-page__body">
        <SearchPanel actions={<SearchActions />}>
          <FilterField htmlFor="selector-name" label="셀렉터스명">
            <TextInput id="selector-name" name="selectorName" placeholder="이름 검색" />
          </FilterField>
          <FilterField htmlFor="selector-cohort" label="기수">
            <Select
              id="selector-cohort"
              name="cohort"
              options={SELECTOR_COHORT_OPTIONS}
            />
          </FilterField>
          <FilterField htmlFor="selector-status" label="활동 상태">
            <Select
              id="selector-status"
              name="activityStatus"
              options={SELECTOR_STATUS_OPTIONS}
            />
          </FilterField>
        </SearchPanel>
        <ResultToolbar count={SELECTORS.length} title="셀렉터스 목록" />
        <div aria-label="셀렉터스 목록" className="fuma-wide-table" role="region">
          <DenseTable
            columns={SELECTOR_COLUMNS}
            onRowClick={(selector) => navigate(`/selectors/${selector.id}`)}
            rowKey={(selector) => selector.id}
            rows={SELECTORS}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
  );
}

function SelectorDetailFields({ selector }: { selector: SelectorFixture }) {
  const conversionRate = selector.clicks === 0 ? "0.0" : ((selector.conversions / selector.clicks) * 100).toFixed(1);
  const fields: Array<[string, ReactNode]> = [
    ["셀렉터스 ID", selector.id],
    ["기수", selector.cohort],
    ["활동 상태", <StatusPill key="status" tone={selectorStatusTone(selector.status)}>{selector.status}</StatusPill>],
    ["SNS 채널", selector.sns],
    ["콘텐츠 수", `${selector.contentCount}건`],
    ["최근 활동일", selector.recentActivity],
    ["누적 위반", `${selector.violationCount}회`],
    ["클릭 수", formatNumber(selector.clicks)],
    ["구매 전환 수", formatNumber(selector.conversions)],
    ["전환율", `${conversionRate}%`],
  ];

  return (
    <section aria-labelledby="selector-detail-basic" className="fuma-content-section">
      <header className="fuma-content-section__header">
        <h2 id="selector-detail-basic">셀렉터스 정보</h2>
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

export function SelectorDetailPage() {
  const { selectorId } = useParams();
  const selector = SELECTORS.find((item) => item.id === selectorId);

  return (
    <section className="fuma-page">
      <PageHeader screenCode="SL202" title="셀렉터스 상세" />
      <div className="fuma-page__body">
        {selector ? (
          <>
            <div className="fuma-detail-toolbar">
              <Link className="hsas-button hsas-button--secondary ui-button ui-button--secondary" to="/selectors">목록</Link>
            </div>
            <section aria-label="셀렉터스 프로필" className="fuma-selector-profile-summary">
              <div>
                <span>{selector.cohort}</span>
                <h2>{selector.name}</h2>
                <p>{selector.sns}</p>
              </div>
              <StatusPill tone={selectorStatusTone(selector.status)}>{selector.status}</StatusPill>
            </section>
            <SelectorDetailFields selector={selector} />
            <section aria-labelledby="selector-detail-operation" className="fuma-content-section">
              <header className="fuma-content-section__header">
                <h2 id="selector-detail-operation">운영 참고</h2>
              </header>
              <div className="fuma-selector-operation-note">
                <strong>{selector.violationCount === 0 ? "정상 활동 중" : `위반 ${selector.violationCount}건 확인 필요`}</strong>
                <p>콘텐츠 검수와 자격 관리 화면에서 세부 이력 및 처리 상태를 확인할 수 있습니다.</p>
              </div>
            </section>
          </>
        ) : (
          <section className="fuma-empty-state" aria-label="셀렉터스 없음">
            <h2>대상을 찾을 수 없습니다</h2>
            <p>요청한 셀렉터스 정보를 확인할 수 없습니다.</p>
          </section>
        )}
      </div>
    </section>
  );
}

const QUALIFICATION_COLUMNS: DenseTableColumn<QualificationFixture>[] = [
  {
    id: "selector",
    header: "셀렉터스",
    width: 138,
    render: (qualification) => `${qualification.name} (${qualification.selectorId})`,
  },
  { key: "cohort", header: "기수", width: 60, align: "center" },
  {
    key: "currentStatus",
    header: "현재 자격",
    width: 84,
    align: "center",
    render: (qualification) => (
      <StatusPill tone={selectorStatusTone(qualification.currentStatus)}>
        {qualification.currentStatus}
      </StatusPill>
    ),
  },
  {
    key: "penaltyCount",
    header: "누적 패널티",
    width: 86,
    align: "right",
    render: (qualification) => `${qualification.penaltyCount}회`,
  },
  { key: "revocationReason", header: "박탈 사유", width: 250 },
  {
    key: "blacklisted",
    header: "블랙리스트",
    width: 92,
    align: "center",
    render: (qualification) => (
      <StatusPill tone={qualification.blacklisted ? "rejected" : "neutral"}>
        {qualification.blacklisted ? "등록" : "미등록"}
      </StatusPill>
    ),
  },
  {
    key: "nextCohortRestricted",
    header: "차기 기수 제한",
    width: 104,
    align: "center",
    render: (qualification) => (
      <StatusPill tone={qualification.nextCohortRestricted ? "rejected" : "neutral"}>
        {qualification.nextCohortRestricted ? "참여 제한" : "없음"}
      </StatusPill>
    ),
  },
  {
    id: "manage",
    header: "관리",
    width: 68,
    align: "center",
    render: (qualification) => (
      <Button aria-label={`${qualification.name} 자격 선택`} className="fuma-table-action">
        선택
      </Button>
    ),
  },
];

function ManualQualificationSection({
  qualification,
}: {
  qualification: QualificationFixture;
}) {
  return (
    <section
      aria-labelledby="manual-qualification-title"
      className="fuma-content-section fuma-qualification-section"
    >
      <header className="fuma-content-section__header">
        <h2 id="manual-qualification-title">수동 자격 관리</h2>
      </header>
      <div className="fuma-qualification-form">
        <FormRow label="선택 셀렉터스">
          <TextInput
            aria-label="선택 셀렉터스"
            readOnly
            value={`${qualification.name} (${qualification.selectorId})`}
          />
        </FormRow>
        <FormRow label="현재 자격">
          <StatusPill tone={selectorStatusTone(qualification.currentStatus)}>
            {qualification.currentStatus}
          </StatusPill>
        </FormRow>
        <FormRow label="변경 자격">
          <Select
            aria-label="변경 자격"
            defaultValue={qualification.proposedStatus}
            options={QUALIFICATION_CHANGE_OPTIONS}
          />
        </FormRow>
        <FormRow label="차기 기수 제한">
          <Checkbox
            defaultChecked={qualification.nextCohortRestricted}
            label="차기 기수 참여 제한"
          />
        </FormRow>
        <FormRow label="블랙리스트">
          <Checkbox defaultChecked={qualification.blacklisted} label="블랙리스트 등록" />
        </FormRow>
        <FormRow label="변경 사유">
          <TextInput
            aria-label="변경 사유"
            defaultValue={qualification.changeReason}
            placeholder="변경 사유를 입력하세요."
          />
        </FormRow>
      </div>
      <div className="fuma-qualification-section__actions">
        <Button variant="primary">자격 변경</Button>
      </div>
    </section>
  );
}

export function QualificationManagementPage() {
  return (
    <section className="fuma-page">
      <PageHeader screenCode="SL301" title="셀렉터스 자격 관리" />
      <div className="fuma-page__body">
        <SearchPanel actions={<SearchActions />}>
          <FilterField htmlFor="qualification-name" label="셀렉터스명">
            <TextInput id="qualification-name" name="selectorName" placeholder="이름 검색" />
          </FilterField>
          <FilterField htmlFor="qualification-cohort" label="기수">
            <Select
              id="qualification-cohort"
              name="cohort"
              options={QUALIFICATION_COHORT_OPTIONS}
            />
          </FilterField>
          <FilterField htmlFor="qualification-status" label="현재 자격">
            <Select
              id="qualification-status"
              name="currentStatus"
              options={SELECTOR_STATUS_OPTIONS}
            />
          </FilterField>
          <FilterField htmlFor="qualification-blacklist" label="블랙리스트">
            <Select
              id="qualification-blacklist"
              name="blacklist"
              options={BLACKLIST_OPTIONS}
            />
          </FilterField>
        </SearchPanel>
        <ResultToolbar count={QUALIFICATIONS.length} title="자격 관리 목록" />
        <div aria-label="자격 관리 목록" className="fuma-wide-table" role="region">
          <DenseTable
            columns={QUALIFICATION_COLUMNS}
            rowKey={(qualification) => qualification.selectorId}
            rows={QUALIFICATIONS}
          />
        </div>
        <ManualQualificationSection qualification={SELECTED_QUALIFICATION} />
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
  );
}
