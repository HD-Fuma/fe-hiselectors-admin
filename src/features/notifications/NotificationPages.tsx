import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { FilterField } from "../../components/ui/FilterField";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill } from "../../components/ui/StatusPill";
import {
  getNotificationHistory,
  NOTIFICATION_PURPOSES,
  NOTIFICATION_STATUSES,
  resendNotification,
  type NotificationHistoryItem,
  type NotificationStatus,
  type SpringPage,
} from "../../entities/notifications";

const PAGE_SIZE = 20;

interface NotificationFilters {
  purpose: string;
  status: NotificationStatus | "";
  from: string;
  to: string;
  recipientKeyword: string;
}

const EMPTY_FILTERS: NotificationFilters = {
  purpose: "",
  status: "",
  from: "",
  to: "",
  recipientKeyword: "",
};

function emptyPage(): SpringPage<NotificationHistoryItem> {
  return { content: [], number: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };
}

function purposeLabel(value: string) {
  return NOTIFICATION_PURPOSES.find((purpose) => purpose.value === value)?.label ?? value;
}

function statusLabel(value: NotificationStatus) {
  return NOTIFICATION_STATUSES.find((status) => status.value === value)?.label ?? value;
}

function statusTone(value: NotificationStatus) {
  if (value === "SENT") return "approved" as const;
  if (value === "FAILED") return "danger" as const;
  return "pending" as const;
}

function channelLabel(value: NotificationHistoryItem["channel"]) {
  return value === "EMAIL" ? "이메일" : "카카오 메시지";
}

function recipientLabel(item: NotificationHistoryItem) {
  if (item.receiver.startsWith("ME:")) return "관리자 테스트 발송";
  if (!item.recipientName) return "연결된 사용자 없음";
  return item.recipientHiId ? `${item.recipientName} (${item.recipientHiId})` : item.recipientName;
}

function recipientConnectionLabel(item: NotificationHistoryItem) {
  if (item.receiver.startsWith("ME:")) return "관리자 카카오 발신 연결";
  if (!item.recipientName) return "현재 연결된 사용자가 없습니다.";
  return item.recipientStatus === "READY" ? "카카오 메시지 수신 가능" : "카카오 수신 연결 상태 확인 필요";
}

function canResend(item: NotificationHistoryItem) {
  return item.status === "FAILED"
    && item.channel === "KAKAO_MESSAGE"
    && item.recipientUserId !== null
    && item.recipientStatus === "READY";
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function NotificationFiltersPanel({
  filters,
  onChange,
  onReset,
  onSearch,
}: {
  filters: NotificationFilters;
  onChange: <Key extends keyof NotificationFilters>(key: Key, value: NotificationFilters[Key]) => void;
  onReset: () => void;
  onSearch: () => void;
}) {
  return (
    <div className="fuma-notification-search">
      <SearchPanel actions={<SearchActions onReset={onReset} onSearch={onSearch} />}>
        <FilterField htmlFor="notification-purpose" label="발송 목적">
          <Select
            aria-label="발송 목적"
            id="notification-purpose"
            onChange={(event) => onChange("purpose", event.target.value)}
            options={[
              { label: "전체", value: "" },
              ...NOTIFICATION_PURPOSES,
            ]}
            value={filters.purpose}
          />
        </FilterField>
        <FilterField htmlFor="notification-status" label="발송 상태">
          <Select
            aria-label="발송 상태"
            id="notification-status"
            onChange={(event) => onChange("status", event.target.value as NotificationStatus | "")}
            options={[
              { label: "전체", value: "" },
              ...NOTIFICATION_STATUSES,
            ]}
            value={filters.status}
          />
        </FilterField>
        <FilterField htmlFor="notification-from" label="요청일 시작">
          <TextInput
            aria-label="요청일 시작"
            id="notification-from"
            onChange={(event) => onChange("from", event.target.value)}
            type="date"
            value={filters.from}
          />
        </FilterField>
        <FilterField htmlFor="notification-to" label="요청일 종료">
          <TextInput
            aria-label="요청일 종료"
            id="notification-to"
            onChange={(event) => onChange("to", event.target.value)}
            type="date"
            value={filters.to}
          />
        </FilterField>
        <FilterField htmlFor="notification-recipient" label="수신자">
          <TextInput
            aria-label="수신자 이름 또는 Hi ID"
            id="notification-recipient"
            onChange={(event) => onChange("recipientKeyword", event.target.value)}
            placeholder="이름 또는 Hi ID"
            value={filters.recipientKeyword}
          />
        </FilterField>
      </SearchPanel>
    </div>
  );
}

function NotificationDetailPanel({
  item,
  onClose,
  onResend,
  resendPending,
}: {
  item: NotificationHistoryItem;
  onClose: () => void;
  onResend: () => void;
  resendPending: boolean;
}) {
  return (
    <SidePanel
      actions={canResend(item) ? (
        <Button disabled={resendPending} onClick={onResend} variant="primary">
          {resendPending ? "재발송 중" : "재발송"}
        </Button>
      ) : null}
      onClose={onClose}
      title="발송 내역 상세"
    >
      <div className="fuma-detail-panel__content fuma-notification-detail-panel">
        <section className="fuma-notification-detail-section">
          <h3>발송 정보</h3>
          <dl>
            <div><dt>발송 목적</dt><dd>{purposeLabel(item.purposeCode)}</dd></div>
            <div><dt>발송 상태</dt><dd><StatusPill tone={statusTone(item.status)}>{statusLabel(item.status)}</StatusPill></dd></div>
            <div><dt>채널</dt><dd>{channelLabel(item.channel)}</dd></div>
            <div><dt>참조 ID</dt><dd>{item.referenceId ?? "-"}</dd></div>
            <div><dt>요청 시각</dt><dd>{formatDateTime(item.requestAt)}</dd></div>
            <div><dt>발송 시각</dt><dd>{formatDateTime(item.sentAt)}</dd></div>
          </dl>
        </section>
        {item.status === "FAILED" && item.channel === "KAKAO_MESSAGE" && !canResend(item) ? (
          <p className="fuma-notification-resend-unavailable" role="status">
            현재 카카오 수신 연결 정보를 확인할 수 없어 재발송할 수 없습니다.
          </p>
        ) : null}
        <section className="fuma-notification-detail-section">
          <h3>수신자</h3>
          <dl>
            <div><dt>서비스 사용자</dt><dd>{recipientLabel(item)}</dd></div>
            <div><dt>카카오 연결</dt><dd>{recipientConnectionLabel(item)}</dd></div>
          </dl>
        </section>
        <section className="fuma-notification-detail-section">
          <h3>메시지 본문</h3>
          <pre>{item.body}</pre>
        </section>
      </div>
    </SidePanel>
  );
}

export function NotificationHistoryPage() {
  const [filters, setFilters] = useState<NotificationFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<NotificationFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [requestVersion, setRequestVersion] = useState(0);
  const [historyPage, setHistoryPage] = useState(emptyPage);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NotificationHistoryItem | null>(null);
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState("");
  const latestRequestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    getNotificationHistory({
      ...appliedFilters,
      page: page - 1,
      size: PAGE_SIZE,
      purpose: appliedFilters.purpose || undefined,
      status: appliedFilters.status || undefined,
      from: appliedFilters.from || undefined,
      to: appliedFilters.to || undefined,
      recipientKeyword: appliedFilters.recipientKeyword.trim() || undefined,
    }, controller.signal)
      .then((result) => {
        if (latestRequestId.current !== requestId) return;
        setHistoryPage(result);
        setHasError(false);
      })
      .catch((error: unknown) => {
        if (latestRequestId.current !== requestId || (error instanceof Error && error.name === "AbortError")) {
          return;
        }
        setHistoryPage(emptyPage());
        setHasError(true);
      })
      .finally(() => {
        if (latestRequestId.current === requestId) setIsLoading(false);
      });

    return () => controller.abort();
  }, [appliedFilters, page, requestVersion]);

  const columns = useMemo<DenseTableColumn<NotificationHistoryItem>[]>(() => [
    { header: "요청 시각", key: "requestAt", width: "16%", render: (item) => formatDateTime(item.requestAt) },
    { header: "발송 목적", key: "purposeCode", width: "15%", render: (item) => purposeLabel(item.purposeCode) },
    { header: "수신자", key: "receiver", width: "22%", render: recipientLabel },
    { header: "채널", key: "channel", width: "12%", align: "center", render: (item) => channelLabel(item.channel) },
    { header: "상태", key: "status", width: "13%", align: "center", render: (item) => <StatusPill tone={statusTone(item.status)}>{statusLabel(item.status)}</StatusPill> },
    { header: "발송 시각", key: "sentAt", width: "16%", render: (item) => formatDateTime(item.sentAt) },
  ], []);

  const prepareRequest = () => {
    latestRequestId.current += 1;
    setIsLoading(true);
    setHasError(false);
    setRequestVersion((version) => version + 1);
  };

  const updateFilter = <Key extends keyof NotificationFilters>(key: Key, value: NotificationFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
    prepareRequest();
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
    prepareRequest();
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    prepareRequest();
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setIsResendDialogOpen(false);
    setResendError("");
  };

  const confirmResend = async () => {
    if (!selectedItem) return;
    setIsResending(true);
    setResendError("");
    try {
      await resendNotification(selectedItem.notificationId);
      setIsResendDialogOpen(false);
      closeDetail();
      prepareRequest();
    } catch (error) {
      setResendError(error instanceof Error ? error.message : "메시지를 재발송하지 못했습니다.");
    } finally {
      setIsResending(false);
    }
  };

  const emptyMessage = isLoading ? (
    <span aria-live="polite" role="status">알림 및 메시지 내역을 불러오는 중입니다.</span>
  ) : hasError ? (
    <span role="alert">알림 및 메시지 내역 조회에 실패했습니다.</span>
  ) : "조회된 발송 내역이 없습니다.";

  return (
    <section className="fuma-page">
      <PageHeader title="알림 및 메시지" />
      <div className="fuma-page__body">
        <NotificationFiltersPanel
          filters={filters}
          onChange={updateFilter}
          onReset={resetFilters}
          onSearch={applyFilters}
        />
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={<span>총 {historyPage.totalElements.toLocaleString("ko-KR")}건</span>}
          title="알림 및 메시지 발송 내역"
        />
        <section aria-label="알림 및 메시지 발송 내역" className="fuma-notification-table">
          <DenseTable
            columns={columns}
            emptyMessage={emptyMessage}
            onRowClick={setSelectedItem}
            rowKey={(item) => item.notificationId}
            rows={historyPage.content}
            selectedRowKeys={selectedItem ? [selectedItem.notificationId] : []}
          />
        </section>
        {!isLoading && !hasError && historyPage.totalPages > 0 ? (
          <Pagination
            onPageChange={changePage}
            page={historyPage.number + 1}
            pageSize={historyPage.size}
            totalPages={historyPage.totalPages}
          />
        ) : null}
      </div>
      {selectedItem && !isResendDialogOpen ? (
        <NotificationDetailPanel
          item={selectedItem}
          onClose={closeDetail}
          onResend={() => setIsResendDialogOpen(true)}
          resendPending={isResending}
        />
      ) : null}
      <Modal
        actions={(
          <>
            <Button disabled={isResending} onClick={() => setIsResendDialogOpen(false)}>취소</Button>
            <Button disabled={isResending} onClick={confirmResend} variant="primary">
              {isResending ? "재발송 중" : "재발송"}
            </Button>
          </>
        )}
        onClose={() => !isResending && setIsResendDialogOpen(false)}
        open={isResendDialogOpen}
        title="메시지 재발송"
      >
        {selectedItem ? (
          <div className="fuma-notification-resend-confirmation">
            <p><strong>{recipientLabel(selectedItem)}</strong> 님에게 아래 메시지를 다시 발송합니다.</p>
            <p>발송 목적: {purposeLabel(selectedItem.purposeCode)}</p>
            <pre>{selectedItem.body}</pre>
            {resendError ? <p role="alert">{resendError}</p> : null}
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
