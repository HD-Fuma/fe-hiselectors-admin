import type { ReactNode } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import {
  NOTICES,
  SETTLEMENTS,
  formatWon,
  type NoticeFixture,
  type NoticeStatus,
  type PaymentStatus,
  type SettlementFixture,
} from "./fixtures";

function options(labels: string[]) {
  return labels.map((label) => ({ label, value: label === "전체" ? "" : label }));
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

function paymentTone(status: PaymentStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "지급 완료") return "approved";
  if (status === "지급 대기") return "pending";
  return "neutral";
}

function noticeTone(status: NoticeStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "게시 중") return "approved";
  if (status === "게시 예정") return "pending";
  return "neutral";
}

function SettlementFilters() {
  return (
    <div className="fuma-operations-search fuma-settlement-search">
      <SearchPanel actions={<SearchActions />}>
        <FilterField htmlFor="settlement-month" label="귀속월">
          <TextInput
            aria-label="귀속월"
            defaultValue="2026-08"
            id="settlement-month"
            type="month"
          />
        </FilterField>
        <FilterField htmlFor="settlement-selector" label="셀렉터스">
          <TextInput
            aria-label="셀렉터스"
            id="settlement-selector"
            placeholder="셀렉터스 ID 또는 이름 검색"
          />
        </FilterField>
        <FilterField htmlFor="settlement-editable" label="수정 가능 여부">
          <Select
            aria-label="수정 가능 여부"
            id="settlement-editable"
            options={options(["전체", "가능", "불가"])}
          />
        </FilterField>
        <FilterField htmlFor="settlement-confirmed" label="확정 상태">
          <Select
            aria-label="확정 상태"
            id="settlement-confirmed"
            options={options(["전체", "미확정", "확정"])}
          />
        </FilterField>
        <FilterField htmlFor="settlement-payment" label="지급 상태">
          <Select
            aria-label="지급 상태"
            id="settlement-payment"
            options={options(["전체", "지급 전", "지급 대기", "지급 완료"])}
          />
        </FilterField>
      </SearchPanel>
    </div>
  );
}

const SETTLEMENT_COLUMNS: DenseTableColumn<SettlementFixture>[] = [
  { key: "attributionMonth", header: "귀속월", width: 92, align: "center" },
  {
    id: "selector",
    header: "셀렉터스",
    width: 150,
    render: (settlement) => (
      <div className="fuma-operation-person">
        <span className="hsas-visually-hidden">{settlement.id}</span>
        <strong>{settlement.selectorName}</strong>
        <span>{settlement.selectorId}</span>
      </div>
    ),
  },
  {
    key: "expectedAmount",
    header: "예상액",
    width: 122,
    align: "right",
    render: (settlement) => formatWon(settlement.expectedAmount),
  },
  {
    id: "confirmedAmount",
    header: "확정액",
    width: 142,
    align: "right",
    render: (settlement) => {
      const canConfirm = settlement.editable && settlement.confirmationStatus === "미확정";
      return (
        <TextInput
          aria-label={`${settlement.selectorName} 확정액`}
          className="fuma-settlement-amount-input"
          defaultValue={formatWon(settlement.confirmedAmount)}
          disabled={!canConfirm}
          inputMode="numeric"
        />
      );
    },
  },
  {
    id: "editable",
    header: "수정 가능 여부",
    width: 104,
    align: "center",
    render: (settlement) => (
      <StatusPill tone={settlement.editable ? "approved" : "neutral"}>
        {settlement.editable ? "가능" : "불가"}
      </StatusPill>
    ),
  },
  {
    key: "confirmationStatus",
    header: "확정 상태",
    width: 86,
    align: "center",
    render: (settlement) => (
      <StatusPill tone={settlement.confirmationStatus === "확정" ? "approved" : "pending"}>
        {settlement.confirmationStatus}
      </StatusPill>
    ),
  },
  {
    key: "paymentStatus",
    header: "지급 상태",
    width: 90,
    align: "center",
    render: (settlement) => (
      <StatusPill tone={paymentTone(settlement.paymentStatus)}>
        {settlement.paymentStatus}
      </StatusPill>
    ),
  },
  {
    id: "management",
    header: "관리",
    width: 112,
    align: "center",
    render: (settlement) => {
      const canConfirm = settlement.editable && settlement.confirmationStatus === "미확정";
      return (
        <div className="fuma-table-actions">
          <Button
            aria-label={`${settlement.selectorName} 지급액 수정`}
            className="fuma-table-action"
            disabled={!canConfirm}
          >
            수정
          </Button>
          <Button
            aria-label={`${settlement.selectorName} 지급 확정`}
            className="fuma-table-action"
            disabled={!canConfirm}
            variant="primary"
          >
            확정
          </Button>
        </div>
      );
    },
  },
];

export function SettlementManagementPage() {
  return (
    <section className="fuma-page">
      <PageHeader screenCode="ST101" title="정산 지급 관리" />
      <div className="fuma-page__body">
        <SettlementFilters />
        <p className="fuma-operations-guide">토스 페이먼츠 연동 후순위</p>
        <div className="fuma-result-toolbar">
          <strong>정산 지급 목록</strong>
          <span>총 {SETTLEMENTS.length}건</span>
        </div>
        <div
          aria-label="정산 지급 목록"
          className="fuma-wide-table fuma-settlement-table"
          role="region"
        >
          <DenseTable
            columns={SETTLEMENT_COLUMNS}
            rowKey={(settlement) => settlement.id}
            rows={[...SETTLEMENTS]}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
  );
}

function NoticeFilters() {
  return (
    <div className="fuma-operations-search fuma-notice-search">
      <SearchPanel actions={<SearchActions />}>
        <FilterField htmlFor="notice-keyword" label="검색어">
          <TextInput
            aria-label="검색어"
            id="notice-keyword"
            placeholder="공지사항 제목 검색"
          />
        </FilterField>
        <FilterField htmlFor="notice-target" label="대상">
          <Select
            aria-label="대상"
            id="notice-target"
            options={options(["전체", "전체 셀렉터스", "3기 셀렉터스", "2기 셀렉터스"])}
          />
        </FilterField>
        <div className="fuma-operations-period-filter">
          <span>게시 기간</span>
          <div>
            <TextInput aria-label="게시 시작일" type="date" />
            <span aria-hidden="true">~</span>
            <TextInput aria-label="게시 종료일" type="date" />
          </div>
        </div>
        <FilterField htmlFor="notice-status" label="게시 상태">
          <Select
            aria-label="게시 상태"
            id="notice-status"
            options={options(["전체", "게시 예정", "게시 중", "게시 종료"])}
          />
        </FilterField>
      </SearchPanel>
    </div>
  );
}

const NOTICE_COLUMNS: DenseTableColumn<NoticeFixture>[] = [
  { key: "title", header: "제목", width: 245 },
  { key: "target", header: "대상", width: 110, align: "center" },
  {
    id: "period",
    header: "게시 기간",
    width: 200,
    align: "center",
    render: (notice) => `${notice.startDate} ~ ${notice.endDate}`,
  },
  {
    key: "status",
    header: "게시 상태",
    width: 88,
    align: "center",
    render: (notice) => (
      <StatusPill tone={noticeTone(notice.status)}>{notice.status}</StatusPill>
    ),
  },
  { key: "author", header: "작성자", width: 95, align: "center" },
  { key: "updatedAt", header: "수정일", width: 132, align: "center" },
  {
    id: "management",
    header: "관리",
    width: 102,
    align: "center",
    render: (notice) => (
      <div className="fuma-table-actions">
        <Button aria-label={`${notice.title} 수정`} className="fuma-table-action">
          수정
        </Button>
        <Button aria-label={`${notice.title} 삭제`} className="fuma-table-action">
          삭제
        </Button>
      </div>
    ),
  },
];

function NoticeEditor() {
  const notice = NOTICES[0];

  return (
    <section
      aria-labelledby="notice-editor-title"
      className="fuma-content-section fuma-notice-editor"
    >
      <header className="fuma-content-section__header">
        <h2 id="notice-editor-title">공지사항 작성/수정</h2>
      </header>
      <div className="fuma-notice-editor__form">
        <FormRow label="제목" required>
          <TextInput
            aria-label="제목"
            defaultValue={notice.title}
            placeholder="공지사항 제목을 입력하세요."
            required
          />
        </FormRow>
        <FormRow label="대상" required>
          <Select
            aria-label="대상"
            defaultValue="전체"
            options={[
              { label: "전체 셀렉터스", value: "전체" },
              { label: "3기 셀렉터스", value: "3기" },
              { label: "2기 셀렉터스", value: "2기" },
            ]}
            required
          />
        </FormRow>
        <FormRow label="게시 시작일" required>
          <TextInput
            aria-label="게시 시작일"
            defaultValue={notice.startDate}
            required
            type="date"
          />
        </FormRow>
        <FormRow label="게시 종료일" required>
          <TextInput
            aria-label="게시 종료일"
            defaultValue={notice.endDate}
            required
            type="date"
          />
        </FormRow>
        <FormRow label="게시 상태">
          <Select
            aria-label="게시 상태"
            defaultValue={notice.status}
            options={options(["게시 예정", "게시 중", "게시 종료"])}
          />
        </FormRow>
        <FormRow label="내용" required>
          <textarea
            aria-label="내용"
            className="hsas-control fuma-notice-editor__textarea"
            defaultValue={notice.body}
            placeholder="공지사항 내용을 입력하세요."
            required
          />
        </FormRow>
      </div>
      <footer className="fuma-notice-editor__footer">
        <p>알림/메시징 연동은 향후 확장 예정입니다.</p>
        <div>
          <Button variant="primary">저장</Button>
          <Button>취소</Button>
        </div>
      </footer>
    </section>
  );
}

export function NoticeManagementPage() {
  return (
    <section className="fuma-page">
      <PageHeader screenCode="SY101" title="공지사항 관리" />
      <div className="fuma-page__body">
        <NoticeFilters />
        <div className="fuma-result-toolbar">
          <strong>공지사항 목록</strong>
          <span>총 {NOTICES.length}건</span>
          <div className="fuma-result-toolbar__actions">
            <Button variant="primary">신규 작성</Button>
          </div>
        </div>
        <div
          aria-label="공지사항 목록"
          className="fuma-wide-table fuma-notice-table"
          role="region"
        >
          <DenseTable
            columns={NOTICE_COLUMNS}
            rowKey={(notice) => notice.id}
            rows={[...NOTICES]}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
        <NoticeEditor />
      </div>
    </section>
  );
}
