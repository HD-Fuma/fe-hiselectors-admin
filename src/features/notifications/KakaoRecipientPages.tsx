import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "../../components/shell/PageHeader";
import { TextInput } from "../../components/ui/Controls";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { FilterField } from "../../components/ui/FilterField";
import { Pagination } from "../../components/ui/Pagination";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import {
  getKakaoRecipients,
  KAKAO_RECIPIENT_FILTERS,
  type KakaoRecipientConnectionStatus,
  type KakaoRecipientFilterStatus,
  type KakaoRecipientItem,
  type SpringPage,
} from "../../entities/kakao";

const PAGE_SIZE = 20;

function emptyPage(): SpringPage<KakaoRecipientItem> {
  return { content: [], number: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };
}

function displayValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || "-";
}

function canReceiveEmail(item: KakaoRecipientItem) {
  return Boolean(item.email?.trim());
}

function recipientStatusLabel(status: KakaoRecipientConnectionStatus) {
  if (status === "READY") return "수신 가능";
  if (status === "UNLINKED") return "미연결";
  return "수신 불가";
}

function recipientStatusDescription(status: KakaoRecipientConnectionStatus) {
  if (status === "READY") return "알림 메시지 수신 가능";
  if (status === "UNLINKED") return "알림 메시지 미연결";
  if (status === "REAUTH_REQUIRED") return "알림 메시지 수신 불가, 재인증 필요";
  return "알림 메시지 수신 불가, 비활성";
}

function recipientStatusTone(
  status: KakaoRecipientConnectionStatus,
): NonNullable<StatusPillProps["tone"]> {
  if (status === "READY") return "approved";
  if (status === "UNLINKED") return "neutral";
  return "danger";
}

export function KakaoRecipientStatusPage() {
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [status, setStatus] = useState<KakaoRecipientFilterStatus | null>(null);
  const [page, setPage] = useState(1);
  const [requestVersion, setRequestVersion] = useState(0);
  const [recipientPage, setRecipientPage] = useState(emptyPage);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const latestRequestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    getKakaoRecipients({
      keyword: appliedKeyword.trim() || undefined,
      page: page - 1,
      size: PAGE_SIZE,
      status: status ?? undefined,
    }, controller.signal)
      .then((result) => {
        if (latestRequestId.current !== requestId) return;
        setRecipientPage(result);
        setHasError(false);
      })
      .catch((error: unknown) => {
        if (latestRequestId.current !== requestId || (error instanceof Error && error.name === "AbortError")) {
          return;
        }
        setRecipientPage(emptyPage());
        setHasError(true);
      })
      .finally(() => {
        if (latestRequestId.current === requestId) setIsLoading(false);
      });

    return () => controller.abort();
  }, [appliedKeyword, page, requestVersion, status]);

  const columns = useMemo<DenseTableColumn<KakaoRecipientItem>[]>(() => [
    {
      header: "셀렉터스명",
      key: "nickname",
      width: "22%",
    },
    {
      header: "셀렉터스코드",
      id: "selectorsCode",
      width: "18%",
      render: (item) => displayValue(item.selectorsCode),
    },
    {
      align: "center",
      header: "이메일 수신가능 여부",
      id: "emailReceivable",
      width: "28%",
      render: (item) => {
        const receivable = canReceiveEmail(item);
        return (
          <StatusPill
            aria-label={receivable ? "이메일 수신 가능" : "이메일 수신 불가"}
            tone={receivable ? "approved" : "danger"}
          >
            {receivable ? "수신 가능" : "수신 불가"}
          </StatusPill>
        );
      },
    },
    {
      align: "center",
      header: "알림 메시지 수신 가능 여부",
      id: "recipientStatus",
      width: "32%",
      render: (item) => (
        <StatusPill
          aria-label={recipientStatusDescription(item.recipientStatus)}
          tone={recipientStatusTone(item.recipientStatus)}
        >
          {recipientStatusLabel(item.recipientStatus)}
        </StatusPill>
      ),
    },
  ], []);

  const prepareRequest = () => {
    latestRequestId.current += 1;
    setIsLoading(true);
    setHasError(false);
    setRequestVersion((version) => version + 1);
  };

  const applyKeyword = () => {
    setAppliedKeyword(keyword);
    setPage(1);
    prepareRequest();
  };

  const resetFilters = () => {
    setKeyword("");
    setAppliedKeyword("");
    setStatus(null);
    setPage(1);
    prepareRequest();
  };

  const changeStatus = (nextStatus: KakaoRecipientFilterStatus | null) => {
    setStatus(nextStatus);
    setPage(1);
    prepareRequest();
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    prepareRequest();
  };

  const emptyMessage = isLoading ? (
    <span aria-live="polite" role="status">카카오 수신 현황을 불러오는 중입니다.</span>
  ) : hasError ? (
    <span role="alert">카카오 수신 현황 조회에 실패했습니다.</span>
  ) : "조회된 셀렉터스가 없습니다.";

  return (
    <section className="fuma-page">
      <PageHeader title="카카오 수신 현황" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-kakao-recipient-search">
          <SearchPanel actions={<SearchActions onReset={resetFilters} onSearch={applyKeyword} />}>
            <FilterField htmlFor="kakao-recipient-keyword" label="검색">
              <TextInput
                aria-label="이름, 이메일 또는 셀렉터스 코드"
                id="kakao-recipient-keyword"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="이름, 이메일 또는 셀렉터스 코드"
                value={keyword}
              />
            </FilterField>
          </SearchPanel>
        </div>
        <ChoiceTabs
          ariaLabel="카카오 수신 상태"
          emptyOption={{
            label: "전체",
            onSelect: () => changeStatus(null),
          }}
          onChange={changeStatus}
          options={KAKAO_RECIPIENT_FILTERS}
          value={status}
        />
        <ResultToolbar
          className="fuma-simple-result-toolbar"
          meta={<span>총 {recipientPage.totalElements.toLocaleString("ko-KR")}명</span>}
          title="카카오 수신 현황"
        />
        <section aria-label="카카오 수신 현황" className="fuma-notification-table">
          <DenseTable
            columns={columns}
            emptyMessage={emptyMessage}
            rowKey={(item) => item.selectorsId}
            rows={recipientPage.content}
          />
        </section>
        {!isLoading && !hasError && recipientPage.totalPages > 0 ? (
          <Pagination
            onPageChange={changePage}
            page={recipientPage.number + 1}
            pageSize={recipientPage.size}
            totalPages={recipientPage.totalPages}
          />
        ) : null}
      </div>
    </section>
  );
}
