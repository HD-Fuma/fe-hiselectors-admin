import { useEffect, useRef, useState } from "react";
import { Button, Checkbox, Select, TextInput } from "../../components/ui/Controls";
import { CreatorProfilePhoto } from "../../components/ui/CreatorProfilePhoto";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { FormRow } from "../../components/ui/FormRow";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { StatusPill } from "../../components/ui/StatusPill";
import type { CampaignProduct } from "../../entities/campaign";
import {
  getSelectorMatching,
  sendSelectorProposals,
  type SelectorMatch,
} from "../../entities/selectors";
import { formatNumber, formatWon } from "../../lib/formatters";

const MATCHING_LIMIT = 50;
const MATCHING_PAGE_SIZE = 10;
const DEFAULT_SUBJECT = "[더현대Hi 셀렉터스] 새 기획전에 함께할 셀렉터스를 찾고 있어요";
const DEFAULT_BODY = `안녕하세요, \${recipientName}님.
더현대Hi 셀렉터스 운영팀입니다.

그동안 보여 주신 판매 성과를 보고, 이번 기획전에도 함께하시면 좋겠다는 생각에 연락드립니다.
비슷한 카테고리의 캠페인에서 좋은 성과를 내셨던 만큼, 이번에도 수익을 올려 보시는 건 어떨까요?

자세한 내용은 아래 링크에서 확인하실 수 있습니다.
\${proposalLink}

감사합니다.
더현대Hi 셀렉터스 운영팀 드림`;

function matchColumns(
  selected: ReadonlySet<number>,
  toggle: (selectorId: number) => void,
): DenseTableColumn<SelectorMatch>[] {
  return [
    {
      id: "select",
      header: "선택",
      width: 56,
      align: "center",
      render: (match) => (
        <Checkbox
          checked={selected.has(match.selectorId)}
          label={<span className="hsas-visually-hidden">{`${match.nickname} 선택`}</span>}
          onChange={() => toggle(match.selectorId)}
        />
      ),
    },
    {
      key: "nickname",
      header: "셀렉터스",
      render: (match) => (
        <div className="fuma-creator-account-cell">
          <div className="fuma-creator-account-cell__profile is-static">
            <span className="fuma-selector-matching__photo">
              <CreatorProfilePhoto creatorName={match.nickname} src={match.profileImageUrl ?? ""} />
            </span>
            <span className="fuma-creator-account-cell__identity">
              <strong>{match.nickname}</strong>
              <small>{match.selectorsCode}</small>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "대표 카테고리",
      width: 140,
      align: "center",
      render: (match) => (
        <StatusPill tone={match.representativeMatch ? "approved" : "neutral"}>
          {match.category || "미분류"}
        </StatusPill>
      ),
    },
    {
      key: "categorySales",
      header: "카테고리 확정매출",
      width: 140,
      align: "right",
      render: (match) => formatWon(match.categorySales),
    },
    {
      key: "categoryOrderCount",
      header: "주문",
      width: 80,
      align: "center",
      render: (match) => `${formatNumber(match.categoryOrderCount)}건`,
    },
    { key: "matchReason", header: "추천 사유" },
  ];
}

/**
 * 캠페인·상품에 맞는 셀렉터스를 추천하고, 선택한 대상에게 제안 메일을 보낸다.
 * 저장 전 캠페인 등록 화면에서는 campaignId가 없어 선택한 상품 기준으로 추천한다.
 */
export function SelectorMatchingSection({
  campaignId,
  products,
}: {
  campaignId?: number;
  products: readonly CampaignProduct[];
}) {
  const [target, setTarget] = useState("campaign");
  const [page, setPage] = useState(1);
  const [matches, setMatches] = useState<SelectorMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sentCount, setSentCount] = useState<number | null>(null);
  // 재시도해도 중복 발송되지 않도록 발송 시도마다 같은 키를 유지한다.
  const idempotencyKey = useRef(crypto.randomUUID());

  const targetOptions = [
    ...(campaignId === undefined
      ? []
      : [{ label: "캠페인 전체 상품 기준", value: "campaign" }]),
    ...products.map((product) => ({
      label: product.productName || `상품 ${product.id}`,
      value: String(product.id),
    })),
  ];
  // 상품 선택이 바뀌어 사라진 대상을 고르고 있으면 첫 대상으로 되돌린다.
  const activeTarget = targetOptions.some((option) => option.value === target)
    ? target
    : targetOptions[0]?.value ?? "";

  const changeTarget = (value: string) => {
    setTarget(value);
    setPage(1);
    setLoading(true);
    setError("");
    setSelected(new Set());
  };

  useEffect(() => {
    if (!activeTarget) return;

    const controller = new AbortController();
    const productId = activeTarget === "campaign" ? undefined : Number(activeTarget);
    void getSelectorMatching(
      {
        campaignId: productId === undefined ? campaignId : undefined,
        limit: MATCHING_LIMIT,
        productId,
      },
      controller.signal,
    )
      .then((rows) => {
        setMatches(rows);
        setError("");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setMatches([]);
        setError(reason instanceof Error ? reason.message : "적합 셀렉터스 추천 조회에 실패했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [activeTarget, campaignId]);

  const toggle = (selectorId: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(selectorId)) next.add(selectorId);
      return next;
    });
  };

  const visibleMatches = error ? [] : matches;
  const totalPages = Math.max(1, Math.ceil(visibleMatches.length / MATCHING_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const allSelected = visibleMatches.length > 0 && selected.size === visibleMatches.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(visibleMatches.map((match) => match.selectorId)));
  };

  const send = async () => {
    if (sending || selected.size === 0) return;
    if (!subject.trim() || !body.trim()) {
      setSendError("제목과 제안 메시지를 입력해 주세요.");
      return;
    }
    setSending(true);
    setSendError("");
    try {
      await sendSelectorProposals(
        { body: body.trim(), selectorIds: [...selected], subject: subject.trim() },
        idempotencyKey.current,
      );
      idempotencyKey.current = crypto.randomUUID();
      setSentCount(selected.size);
      setComposeOpen(false);
      setSelected(new Set());
    } catch (reason) {
      setSendError(reason instanceof Error ? reason.message : "셀렉터스 제안 메일 발송 요청에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-labelledby="campaign-matching-title" className="fuma-campaign-detail-list-section">
      <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-campaign-detail-list-toolbar">
        <strong id="campaign-matching-title">연관 셀렉터스</strong>
        <div className="fuma-settlement-result-meta">
          <span>총 {visibleMatches.length}명</span>
        </div>
      </div>
      <div className="fuma-selector-matching__toolbar">
        <Select
          aria-label="추천 기준"
          onChange={(event) => changeTarget(event.target.value)}
          options={targetOptions}
          value={activeTarget}
        />
        <Button disabled={visibleMatches.length === 0} onClick={toggleAll}>
          {allSelected ? "선택 해제" : "전체 선택"}
        </Button>
        <Button
          disabled={selected.size === 0}
          onClick={() => {
            setSendError("");
            setComposeOpen(true);
          }}
          variant="primary"
        >
          선택 {selected.size}명에게 제안 발송
        </Button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <div className="fuma-wide-table fuma-settlement-table fuma-selector-list-table">
        <DenseTable
          columns={matchColumns(selected, toggle)}
          emptyMessage={loading ? "추천 셀렉터스를 불러오는 중입니다." : "추천할 셀렉터스가 없습니다."}
          rowKey={(match) => match.selectorId}
          rows={visibleMatches.slice((currentPage - 1) * MATCHING_PAGE_SIZE, currentPage * MATCHING_PAGE_SIZE)}
        />
      </div>
      {totalPages > 1 ? (
        <Pagination
          onPageChange={setPage}
          page={currentPage}
          pageSize={MATCHING_PAGE_SIZE}
          totalPages={totalPages}
        />
      ) : null}

      {composeOpen ? (
        <Modal
          actions={(
            <>
              <Button disabled={sending} onClick={() => setComposeOpen(false)}>취소</Button>
              <Button disabled={sending} onClick={() => void send()} variant="primary">
                {sending ? "발송 요청 중..." : `${selected.size}명에게 발송`}
              </Button>
            </>
          )}
          onClose={() => setComposeOpen(false)}
          open
          title="셀렉터스 제안 발송"
        >
          {sendError ? <p role="alert">{sendError}</p> : null}
          <FormRow label="제목" required>
            <TextInput
              aria-label="제목"
              disabled={sending}
              maxLength={200}
              onChange={(event) => setSubject(event.target.value)}
              value={subject}
            />
          </FormRow>
          <FormRow label="제안 메시지" required>
            <textarea
              aria-label="제안 메시지"
              className="hsas-control fuma-proposal-compose__textarea"
              disabled={sending}
              maxLength={10_000}
              onChange={(event) => setBody(event.target.value)}
              rows={14}
              value={body}
            />
          </FormRow>
          <p className="fuma-proposal-compose__creator-note">
            {"메시지에 ${recipientName}, ${proposalLink}, ${adminName}을 넣으면 발송 시 자동으로 채워집니다."}
          </p>
        </Modal>
      ) : null}

      {sentCount === null ? null : (
        <Modal
          actions={<Button onClick={() => setSentCount(null)} variant="primary">확인</Button>}
          onClose={() => setSentCount(null)}
          open
          role="alertdialog"
          title="제안 발송 요청 완료"
        >
          <p>{sentCount}명에게 제안 발송을 요청했습니다. 발송 성공·실패는 태스크 현황에서 확인할 수 있습니다.</p>
        </Modal>
      )}
    </section>
  );
}
