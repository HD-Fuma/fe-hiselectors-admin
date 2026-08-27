import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Eye, Pencil, RefreshCw } from "lucide-react";
import { getAdministratorSession } from "../../lib/adminAuthentication";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, Switch, TextInput } from "../../components/ui/Controls";
import { BubbleDialog } from "../../components/ui/BubbleDialog";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { CreatorProfilePhoto } from "../../components/ui/CreatorProfilePhoto";
import { ResultToolbar } from "../../components/ui/ResultToolbar";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SidePanel } from "../../components/ui/SidePanel";
import { SocialAccountCell } from "../../components/ui/SocialAccountCell";
import { Tooltip } from "../../components/ui/Tooltip";
import { formatCompactCount, formatNumber } from "../../lib/formatters";
import { CREATOR_POOL_RESET_EVENT } from "../../lib/creatorPoolEvents";
import { paginate } from "../../lib/pagination";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { DiscoverySettingsPanel } from "./DiscoverySettingsPanel";
import "../../styles/creator-discovery-settings.css";
import { getDiscoveryCategories } from "../../entities/discovery-category";
import {
  categoryLabel,
  CREATOR_CATEGORY_OPTIONS,
  getAdminProposals,
  getCreator,
  getCreators,
  postAdminProposal,
  runCreatorDiscovery,
  type CreatorDetail,
  type CreatorProfileFixture,
  type CreatorSummary,
  type ProposalHistoryEntry,
} from "../../entities/creator";

const PROPOSAL_PAGE_SIZE = 20;
const PROPOSAL_LIST_FETCH_SIZE = 100;
const CREATOR_LIST_PAGE_SIZE = 20;
const DEFAULT_PROPOSAL_SUBJECT = "[셀렉터스] ${creatorName}님, 크리에이터 활동을 제안드립니다";
const DEFAULT_PROPOSAL_MESSAGE = `안녕하세요, \${creatorName}님.
셀렉터스 운영팀입니다.

\${creatorName}님의 콘텐츠를 관심 있게 보고, 셀렉터스 활동을 제안드리고자 연락드립니다.

셀렉터스는 크리에이터의 개성과 전문성을 바탕으로 다양한 상품과 브랜드를 소개하는 크리에이터 파트너 프로그램입니다.

[제안 내용]
- 주요 캠페인 및 콘텐츠 협업
- 채널 특성에 맞춘 상품과 캠페인 제안
- 캠페인별 활동 조건 및 상세 가이드 별도 안내

참여 의향이 있으시다면 본 메일에 회신하거나 아래 링크에서 신청해 주세요.
\${proposalLink}

감사합니다.
셀렉터스 운영팀 드림`;

const CREATOR_PLATFORM_OPTIONS = [
  { label: "전체", value: "" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "YouTube", value: "YOUTUBE" },
] as const;
const CREATOR_PLATFORM_TABS = CREATOR_PLATFORM_OPTIONS.filter(
  (option): option is Exclude<(typeof CREATOR_PLATFORM_OPTIONS)[number], { value: "" }> =>
    option.value !== "",
);

const EMPTY_CREATOR_FILTERS = {
  keyword: "",
  snsCode: "",
  categoryCode: "",
  minFollower: "",
  maxFollower: "",
  excludeBrands: false,
};

function dateTime(value: string) {
  return value.replace("T", " ").slice(0, 16).replaceAll("-", ".");
}

function matchesSentPeriod(createdAt: string, from: string, to: string) {
  const sentAt = new Date(createdAt).getTime();
  if (Number.isNaN(sentAt)) return false;
  if (from) {
    const start = new Date(`${from}T00:00:00`).getTime();
    if (sentAt < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`).getTime();
    if (sentAt > end) return false;
  }
  return true;
}

function numericFilter(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function recentActivityLabel(count: number | null) {
  if (count === null) return "-";
  return count >= 25 ? "25+건" : `${formatNumber(count)}건`;
}

function visibleCategoryLabel(
  code: string | null,
  options: readonly { label: string; value: string }[],
) {
  if (!code) return "미분류";
  const label = categoryLabel(code, options);
  return !label || label === code ? "기타" : label;
}

function platformFor(code: CreatorSummary["snsCode"]): CreatorProfileFixture["platform"] {
  return code === "INSTAGRAM" ? "Instagram" : "YouTube";
}

type CreatorIdentity = Pick<CreatorSummary, "accountId" | "creatorName" | "snsCode">;

function instagramUsernameFor(creator: CreatorIdentity) {
  const instagramUsernameCandidate = /^\d+$/.test(creator.accountId)
    ? creator.creatorName?.replace(/^@/, "")
    : creator.accountId.replace(/^@/, "");
  return instagramUsernameCandidate
    && /^[A-Za-z0-9._]{1,30}$/.test(instagramUsernameCandidate)
    ? instagramUsernameCandidate
    : null;
}

function creatorProfileUrl(creator: CreatorIdentity) {
  const instagramUsername = instagramUsernameFor(creator);
  return creator.snsCode === "YOUTUBE"
    ? `https://www.youtube.com/channel/${encodeURIComponent(creator.accountId)}`
    : instagramUsername
      ? `https://www.instagram.com/${encodeURIComponent(instagramUsername)}`
      : null;
}

function creatorDisplayName(creator: CreatorIdentity) {
  const instagramUsername = instagramUsernameFor(creator);
  return creator.creatorName
    || (creator.snsCode === "INSTAGRAM" && instagramUsername ? `@${instagramUsername}` : creator.accountId);
}

function creatorHandle(creator: CreatorIdentity) {
  if (creator.snsCode === "INSTAGRAM") {
    const username = instagramUsernameFor(creator);
    return username ? `@${username}` : "Instagram 계정";
  }
  return creator.accountId.startsWith("UC") ? "YouTube 채널" : `@${creator.accountId.replace(/^@/, "")}`;
}

function CreatorAccountCell({
  creator,
  onOpen,
}: {
  creator: CreatorSummary;
  onOpen: (creator: CreatorSummary) => void;
}) {
  const accountName = creatorDisplayName(creator);
  const accountMeta = creator.snsCode === "YOUTUBE" ? creator.accountId : creatorHandle(creator);
  const href = creatorProfileUrl(creator);
  const platform = platformFor(creator.snsCode);

  return (
    <SocialAccountCell
      displayName={accountName}
      handle={accountMeta}
      onOpen={() => onOpen(creator)}
      platform={platform}
      profileImageUrl={creator.profileImageUrl ?? ""}
      profileUrl={href}
    />
  );
}

function PlatformLabel({ platform }: { platform: CreatorProfileFixture["platform"] }) {
  return (
    <span className="fuma-platform-label">
      <PlatformIcon platform={platform} />
      <span aria-hidden="true">{platform}</span>
    </span>
  );
}

function creatorColumns(
  categoryOptions: readonly { label: string; value: string }[],
  onOpen: (creator: CreatorSummary) => void,
): DenseTableColumn<CreatorSummary>[] {
  return [
  {
    key: "creatorName",
    header: "계정",
    width: 220,
    render: (creator) => <CreatorAccountCell creator={creator} onOpen={onOpen} />,
  },
  {
    id: "categories",
    header: "카테고리",
    width: 110,
    align: "center",
    render: (creator) => visibleCategoryLabel(creator.category, categoryOptions),
  },
  {
    id: "followers",
    header: "팔로워·구독자",
    width: 105,
    align: "right",
    render: (creator) => creator.followerCount === null ? "-" : formatNumber(creator.followerCount),
  },
  {
    id: "engagementRate",
    header: "ER",
    width: 72,
    align: "right",
    render: (creator) => creator.engagementRate === null ? "-" : `${creator.engagementRate.toFixed(2)}%`,
  },
  {
    key: "recent90DayContentCount",
    header: "최근 90일 활동",
    width: 110,
    align: "right",
    render: (creator) => recentActivityLabel(creator.recent90DayContentCount),
  },
  {
    key: "lastContentAt",
    header: "최근 활동일",
    width: 110,
    align: "center",
    render: (creator) => creator.lastContentAt?.slice(0, 10) ?? "-",
  },
  ];
}

function resizeProposalMessage(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

const PROPOSAL_VARIABLE_LABELS: Record<string, string> = {
  adminEmail: "담당자 이메일",
  adminPosition: "담당자 직책",
};

const PROPOSAL_APPLY_BASE_URL = "https://hiselectors.shop/apply";
const PROPOSAL_VARIABLE_PATTERN = /\$\{(\w+)\}/g;

function proposalLinkFor(creator: CreatorSummary) {
  return `${PROPOSAL_APPLY_BASE_URL}?creatorId=${creator.id}`;
}

/** ${creatorName} 같은 코드 표기를 실제 값(대상 정보·로그인한 담당자 정보)이나 남은 항목은 안내 칩으로 바꿔 보여준다. */
function renderProposalPreview(text: string, creator: CreatorSummary) {
  const adminName = getAdministratorSession()?.name ?? null;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  PROPOSAL_VARIABLE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PROPOSAL_VARIABLE_PATTERN.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const variableName = match[1];
    if (variableName === "creatorName") {
      nodes.push(
        <strong className="fuma-proposal-preview__value" key={key++}>
          {creator.creatorName || creator.accountId}
        </strong>,
      );
    } else if (variableName === "proposalLink") {
      nodes.push(
        <strong className="fuma-proposal-preview__value" key={key++}>
          {proposalLinkFor(creator)}
        </strong>,
      );
    } else if (variableName === "adminName" && adminName) {
      nodes.push(
        <strong className="fuma-proposal-preview__value" key={key++}>
          {adminName}
        </strong>,
      );
    } else {
      nodes.push(
        <span className="fuma-proposal-preview__var" key={key++}>
          {PROPOSAL_VARIABLE_LABELS[variableName] ?? variableName}
        </span>,
      );
    }
    lastIndex = PROPOSAL_VARIABLE_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function ProposalComposer({
  creators,
  onComplete,
  onFailed,
}: {
  creators: CreatorSummary[];
  onComplete: (count: number) => void;
  onFailed?: (creators: CreatorSummary[]) => void;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState(DEFAULT_PROPOSAL_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_PROPOSAL_MESSAGE);
  const [composeMode, setComposeMode] = useState<"edit" | "preview">("preview");
  const [previewCreatorId, setPreviewCreatorId] = useState(creators[0]?.id ?? null);
  const proposalInvalid = !subject.trim() || !message.trim();
  const previewCreator = creators.find((creator) => creator.id === previewCreatorId) ?? creators[0] ?? null;

  const sendProposals = async () => {
    if (sending || creators.length === 0) return;
    if (proposalInvalid) {
      setError("제목과 제안 메시지를 입력해 주세요.");
      return;
    }
    setSending(true);
    setError("");
    const failed: CreatorSummary[] = [];
    let accepted = 0;
    let firstFailure = "";

    for (const creator of creators) {
      try {
        await postAdminProposal(creator.id, { subject: subject.trim(), body: message.trim() });
        accepted += 1;
      } catch (reason) {
        failed.push(creator);
        if (!firstFailure) {
          firstFailure = reason instanceof Error ? reason.message : "제안 메일 발송에 실패했습니다.";
        }
      }
    }

    setSending(false);
    if (failed.length > 0) {
      onFailed?.(failed);
      setError(`${accepted > 0 ? `${accepted}명 요청됨, ` : ""}${failed.length}명 요청에 실패했습니다. ${firstFailure}`);
      return;
    }
    onComplete(accepted);
  };

  return (
    <div className="fuma-detail-panel__content fuma-proposal-compose">
        <div className="fuma-proposal-compose__intro">
          <div>
            <p>CREATOR OUTREACH</p>
            <h2>{creators.length}명의 크리에이터에게 보낼 제안을 작성합니다.</h2>
          </div>
        </div>
        {error ? <p role="alert">{error}</p> : null}
        <div className="fuma-proposal-compose__layout fuma-proposal-compose__layout--panel">
          <aside aria-label="제안 대상" className="fuma-proposal-compose__creator--batch">
            <p className="fuma-proposal-compose__eyebrow">제안 대상</p>
            <strong>{creators.length}명 선택됨</strong>
            <ul className="fuma-proposal-compose__creator-cards">
              {creators.map((creator) => (
                <li key={creator.id}>
                  <button
                    aria-pressed={creator.id === previewCreator?.id}
                    className="fuma-proposal-compose__creator-card"
                    onClick={() => setPreviewCreatorId(creator.id)}
                    type="button"
                  >
                    <span className="fuma-proposal-compose__creator-photo">
                      <CreatorProfilePhoto
                        creatorName={creator.creatorName || creator.accountId}
                        src={creator.profileImageUrl ?? ""}
                      />
                    </span>
                    <span>{creator.creatorName || creator.accountId}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <form
            aria-busy={sending}
            aria-label="제안 작성"
            className="fuma-proposal-compose__form"
            onSubmit={(event) => {
              event.preventDefault();
              void sendProposals();
            }}
          >
            <div className="fuma-proposal-compose__form-heading">
              <h2>제안 내용</h2>
            </div>
            {composeMode === "edit" ? (
              <>
                <div className="fuma-proposal-compose__edit-heading">
                  <span>제안 내용 편집</span>
                  <button
                    className="fuma-proposal-compose__edit-toggle fuma-proposal-compose__edit-toggle--subtle"
                    onClick={() => setComposeMode("preview")}
                    type="button"
                  >
                    <Eye aria-hidden="true" size={13} />
                    미리보기
                  </button>
                </div>
                <FormRow label="제목" required>
                  <TextInput
                    aria-label="제목"
                    disabled={sending}
                    maxLength={200}
                    onChange={(event) => setSubject(event.target.value)}
                    required
                    value={subject}
                  />
                </FormRow>
                <FormRow label="제안 메시지" required>
                  <textarea
                    aria-label="제안 메시지"
                    className="hsas-control fuma-proposal-compose__textarea"
                    disabled={sending}
                    maxLength={10_000}
                    onChange={(event) => setMessage(event.target.value)}
                    onInput={(event) => resizeProposalMessage(event.currentTarget)}
                    ref={(textarea) => {
                      if (textarea) resizeProposalMessage(textarea);
                    }}
                    required
                    value={message}
                  />
                </FormRow>
                <p className="fuma-proposal-compose__creator-note">
                  {"제목·메시지에 ${creatorName}, ${proposalLink}, ${adminName}을 넣으면 발송 시 자동으로 채워집니다."}
                </p>
              </>
            ) : previewCreator ? (
              <div className="fuma-proposal-preview">
                <div className="fuma-proposal-preview__email">
                  <button
                    aria-label="수정"
                    className="fuma-proposal-compose__edit-toggle-emoji"
                    onClick={() => setComposeMode("edit")}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={14} />
                  </button>
                  <strong className="fuma-proposal-preview__subject">
                    {renderProposalPreview(subject, previewCreator)}
                  </strong>
                  <div className="fuma-proposal-preview__body">
                    {renderProposalPreview(message, previewCreator)}
                  </div>
                </div>
              </div>
            ) : null}
            <footer className="fuma-proposal-compose__footer">
              <div className="fuma-applicant-detail-actions__buttons fuma-proposal-compose__submit-actions">
                <Button
                  className="fuma-proposal-compose__submit fuma-creator-proposal-action"
                  disabled={sending || proposalInvalid}
                  type="submit"
                  variant="primary"
                >
                  {creators.length}명에게 제안 발송
                </Button>
              </div>
            </footer>
          </form>
        </div>
      </div>
  );
}

function BatchProposalPanel({
  creators,
  onClose,
  onComplete,
  onFailed,
}: {
  creators: CreatorSummary[];
  onClose: () => void;
  onComplete: (count: number) => void;
  onFailed: (creators: CreatorSummary[]) => void;
}) {
  return (
    <SidePanel defaultWidth={1160} onClose={onClose} title="제안 발송">
      <ProposalComposer creators={creators} onComplete={onComplete} onFailed={onFailed} />
    </SidePanel>
  );
}

export function CreatorTestPage() {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");

  const buildTestPool = async () => {
    setIsRunning(true);
    setError("");
    try {
      await runCreatorDiscovery(true);
      navigate("/creators");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "테스트 크리에이터 풀 구축에 실패했습니다.");
      setIsRunning(false);
    }
  };

  return (
    <section className="fuma-page">
      <PageHeader title="테스트 크리에이터 풀 구축" />
      <div className="fuma-page__body">
        <section className="fuma-content-section">
          <header className="fuma-content-section__header">
            <h2>빠른 구축</h2>
          </header>
          <FormRow
            help="활성 카테고리마다 우선순위가 가장 높은 키워드 1개만 실행합니다."
            label="구축 범위"
          >
            카테고리별 키워드 1개
          </FormRow>
          <FormRow label="플랫폼">Instagram · YouTube</FormRow>
          <FormRow label="실행">
            <div>
              <Button
                disabled={isRunning}
                onClick={() => void buildTestPool()}
                type="button"
                variant="primary"
              >
                {isRunning ? "구축 중..." : "테스트 풀 구축"}
              </Button>
              {error ? <p role="alert">{error}</p> : null}
            </div>
          </FormRow>
        </section>
      </div>
    </section>
  );
}

function shortDate(value: string | null | undefined) {
  return value ? value.slice(0, 10).replaceAll("-", ".") : "-";
}

function instagramProfileUrl(handle: string | null) {
  const username = handle?.replace(/^@/, "") ?? "";
  return /^[A-Za-z0-9._]{1,30}$/.test(username)
    ? `https://www.instagram.com/${encodeURIComponent(username)}`
    : null;
}

function instagramConnectionLabel(confidence: number | null) {
  if (confidence === null) return "발견되지 않음";
  if (confidence >= 0.95) return "프로필 URL에서 발견";
  if (confidence >= 0.75) return "채널 소개에서 발견 · 확인 필요";
  return "채널 멘션에서 발견 · 확인 필요";
}

function CreatorProfilePanel({
  categoryOptions,
  creator,
  onClose,
  onProposalComplete,
}: {
  categoryOptions: readonly { label: string; value: string }[];
  creator: CreatorSummary;
  onClose: () => void;
  onProposalComplete: () => void;
}) {
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalRequested, setProposalRequested] = useState(false);
  const [result, setResult] = useState<{
    creatorId: number;
    detail: CreatorDetail | null;
    error: string;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getCreator(creator.id, controller.signal).then((detail) => {
      if (!controller.signal.aborted) setResult({ creatorId: creator.id, detail, error: "" });
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setResult({
          creatorId: creator.id,
          detail: null,
          error: reason instanceof Error ? reason.message : "크리에이터 정보를 불러오지 못했습니다.",
        });
      }
    });
    return () => controller.abort();
  }, [creator.id]);

  const currentResult = result?.creatorId === creator.id ? result : null;
  const detail = currentResult?.detail ?? null;
  const loading = currentResult === null;
  const displayName = detail ? creatorDisplayName(detail) : creatorDisplayName(creator);
  const profileUrl = detail ? creatorProfileUrl(detail) : creatorProfileUrl(creator);
  const connectedInstagramUrl = detail?.snsCode === "YOUTUBE"
    ? instagramProfileUrl(detail.igHandle)
    : null;
  const categoryName = visibleCategoryLabel(detail?.category ?? creator.category, categoryOptions);
  const shares = detail?.categoryShares ?? [];
  const shareTotal = shares.reduce((total, share) => total + Number(share.totalShare), 0);
  const platform = detail ? platformFor(detail.snsCode) : platformFor(creator.snsCode);
  const audienceLabel = platform === "Instagram" ? "팔로워" : "구독자";

  if (proposalOpen && detail) {
    return (
      <>
        <SidePanel
          actions={<Button onClick={() => setProposalOpen(false)}>프로필로 돌아가기</Button>}
          defaultWidth={1160}
          onClose={onClose}
          title="제안 발송"
        >
          <ProposalComposer creators={[creator]} onComplete={() => setProposalRequested(true)} />
        </SidePanel>
        <BubbleDialog
          actions={<button autoFocus onClick={onProposalComplete} type="button">확인</button>}
          description="제안 발송 요청을 완료했습니다."
          open={proposalRequested}
          title="발송 요청 완료"
        />
      </>
    );
  }

  return (
    <SidePanel onClose={onClose} title="크리에이터 상세">
      <div className="fuma-detail-panel__content fuma-selector-detail-panel fuma-creator-pool-detail-panel">
        {detail ? (
          <>
            <section
              aria-label="크리에이터 프로필"
              className="fuma-creator-detail-hero fuma-selector-detail-hero fuma-unified-detail-hero"
            >
              <div className="fuma-creator-detail-hero__portrait">
                <CreatorProfilePhoto
                  creatorName={displayName}
                  src={detail.profileImageUrl ?? creator.profileImageUrl ?? ""}
                />
                <span className="fuma-creator-detail-hero__platform">
                  <PlatformIcon platform={platform} />
                </span>
              </div>
              <div className="fuma-creator-detail-hero__content">
                <div className="fuma-creator-detail-hero__identity">
                  <div className="fuma-creator-detail-hero__generation">크리에이터 풀</div>
                  <div className="fuma-creator-detail-hero__title-row"><h2>{displayName}</h2></div>
                  <div className="fuma-creator-detail-hero__channel">
                    {profileUrl ? (
                      <a href={profileUrl} rel="noreferrer" target="_blank">
                        <strong>{creatorHandle(detail)}</strong> ↗
                      </a>
                    ) : <strong>{creatorHandle(detail)}</strong>}
                  </div>
                  <div className="fuma-creator-detail-hero__categories">
                    <strong>{categoryName}</strong>
                    <span aria-hidden="true">/</span>
                    <span>{detail.accountId}</span>
                  </div>
                </div>
                <p className="fuma-unified-detail-hero__summary">
                  풀 등록 {shortDate(detail.registeredAt)} · 최근 업데이트 {shortDate(detail.updatedAt)}
                </p>
                <dl className="fuma-creator-detail-hero__metrics">
                  <div><dt>{audienceLabel}</dt><dd>{detail.followerCount === null ? "-" : formatCompactCount(detail.followerCount)}</dd></div>
                  <div><dt>90일 활동</dt><dd>{recentActivityLabel(creator.recent90DayContentCount)}</dd></div>
                  <div><dt>참여율</dt><dd>{detail.engagementRate === null ? "-" : `${detail.engagementRate.toFixed(2)}%`}</dd></div>
                  <div><dt>최근 콘텐츠</dt><dd>{shortDate(detail.lastContentAt)}</dd></div>
                </dl>
              </div>
            </section>

            <section aria-labelledby="creator-discovery-title" className="fuma-campaign-detail-list-section">
              <ResultToolbar
                className="fuma-simple-result-toolbar fuma-campaign-detail-list-toolbar"
                title="발굴 정보"
                titleId="creator-discovery-title"
              />
              <dl className="fuma-key-value-grid">
                <div className="fuma-key-value-grid__item"><dt>계정 유형</dt><dd>{detail.brandScore === null ? "판정 정보 없음" : detail.brandScore >= 2 ? "브랜드 계정 확인 필요" : "개인 크리에이터 후보"}</dd></div>
                <div className="fuma-key-value-grid__item"><dt>최초 발굴</dt><dd>{shortDate(detail.firstDiscoveredAt)}</dd></div>
                <div className="fuma-key-value-grid__item"><dt>확인 근거</dt><dd>{detail.brandHits || "-"}</dd></div>
                <div className="fuma-key-value-grid__item"><dt>최근 업데이트</dt><dd>{shortDate(detail.updatedAt)}</dd></div>
                {detail.snsCode === "YOUTUBE" ? (
                  <div className="fuma-key-value-grid__item">
                    <dt>추정 Instagram</dt>
                    <dd className="fuma-creator-pool-profile__links">
                      {connectedInstagramUrl ? <a href={connectedInstagramUrl} rel="noreferrer" target="_blank">@{detail.igHandle?.replace(/^@/, "")} ↗</a> : null}
                      <small>{instagramConnectionLabel(detail.igConfidence)}</small>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {shares.length > 0 && shareTotal > 0 ? (
              <section aria-labelledby="creator-category-share-title" className="fuma-campaign-detail-list-section">
                <ResultToolbar
                  className="fuma-simple-result-toolbar fuma-campaign-detail-list-toolbar"
                  meta={<span>총 {shares.length}개 카테고리</span>}
                  title="카테고리 발굴 비중"
                  titleId="creator-category-share-title"
                />
                <ul className="fuma-creator-pool-profile__shares">
                  {shares.map((share) => {
                    const percentage = Math.round((Number(share.totalShare) / shareTotal) * 100);
                    return (
                      <li key={share.categoryCode}>
                        <div><strong>{visibleCategoryLabel(share.categoryCode, categoryOptions)}</strong><span>{percentage}%</span></div>
                        <progress aria-label={`${visibleCategoryLabel(share.categoryCode, categoryOptions)} 발굴 비중`} max="100" value={percentage} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <div className="fuma-creator-pool-detail-panel__actions">
              <Button className="fuma-creator-proposal-action" onClick={() => setProposalOpen(true)} variant="primary">제안 작성</Button>
            </div>
          </>
        ) : (
          <div aria-live={loading ? "polite" : undefined} role={loading ? "status" : "alert"}>
            <EmptyState
              description={loading ? "크리에이터 프로필을 불러오는 중입니다." : currentResult?.error || "요청한 크리에이터 정보를 확인할 수 없습니다."}
              title={loading ? "프로필을 불러오는 중입니다" : "크리에이터를 찾을 수 없습니다"}
            />
          </div>
        )}
      </div>
    </SidePanel>
  );
}

export function CreatorListPage() {
  const navigate = useNavigate();
  const buildPoolTooltipId = useId();
  const [filters, setFilters] = useState(EMPTY_CREATOR_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_CREATOR_FILTERS);
  const [selectedCreators, setSelectedCreators] = useState<Map<number, CreatorSummary>>(new Map());
  const [profileCreator, setProfileCreator] = useState<CreatorSummary | null>(null);
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<Awaited<ReturnType<typeof getCreators>> | null>(null);
  const [error, setError] = useState("");
  const [discoveryRunning, setDiscoveryRunning] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState("");
  const [discoverySettingsOpen, setDiscoverySettingsOpen] = useState(false);
  const [proposalPanelOpen, setProposalPanelOpen] = useState(false);
  const [proposalRequestedCount, setProposalRequestedCount] = useState(0);
  const [buildPoolTooltipInitial, setBuildPoolTooltipInitial] = useState(true);
  const [buildPoolTooltipHovered, setBuildPoolTooltipHovered] = useState(false);
  const [buildPoolTooltipFocused, setBuildPoolTooltipFocused] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<readonly { label: string; value: string }[]>(
    CREATOR_CATEGORY_OPTIONS,
  );

  const refreshCategoryOptions = useCallback((signal?: AbortSignal) => (
    getDiscoveryCategories(signal).then((categories) => {
      setCategoryOptions([
        { label: "전체", value: "" },
        ...categories.map((category) => ({ label: category.name, value: category.code })),
      ]);
    })
  ), []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setBuildPoolTooltipInitial(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getCreators({
      keyword: appliedFilters.keyword || undefined,
      snsCode: appliedFilters.snsCode || undefined,
      categoryCode: appliedFilters.categoryCode || undefined,
      minFollower: numericFilter(appliedFilters.minFollower),
      maxFollower: numericFilter(appliedFilters.maxFollower),
      maxBrandScore: appliedFilters.excludeBrands ? 1 : undefined,
      page: page - 1,
      size: CREATOR_LIST_PAGE_SIZE,
    }, controller.signal).then((result) => {
      setPageData(result);
      setError("");
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : "크리에이터 목록 조회에 실패했습니다.");
      }
    });
    return () => controller.abort();
  }, [appliedFilters, page]);

  useEffect(() => {
    const controller = new AbortController();
    refreshCategoryOptions(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [refreshCategoryOptions]);

  useEffect(() => {
    const refreshCreatorPool = () => {
      setPageData(null);
      setSelectedCreators(new Map());
      setPage(1);
      setAppliedFilters((current) => ({ ...current }));
    };
    window.addEventListener(CREATOR_POOL_RESET_EVENT, refreshCreatorPool);
    return () => window.removeEventListener(CREATOR_POOL_RESET_EVENT, refreshCreatorPool);
  }, []);

  const applySearch = () => {
    const minFollower = numericFilter(filters.minFollower);
    const maxFollower = numericFilter(filters.maxFollower);
    if ((filters.minFollower.trim() && minFollower === undefined)
      || (filters.maxFollower.trim() && maxFollower === undefined)
      || (minFollower !== undefined && maxFollower !== undefined && minFollower > maxFollower)) {
      setError("팔로워·구독자 범위를 올바르게 입력해 주세요.");
      return;
    }
    setError("");
    setAppliedFilters({ ...filters, keyword: filters.keyword.trim() });
    setSelectedCreators(new Map());
    setPage(1);
  };
  const resetSearch = () => {
    setFilters(EMPTY_CREATOR_FILTERS);
    setAppliedFilters(EMPTY_CREATOR_FILTERS);
    setSelectedCreators(new Map());
    setPage(1);
  };
  const changeExcludeBrands = (excludeBrands: boolean) => {
    setFilters((current) => ({ ...current, excludeBrands }));
    setAppliedFilters((current) => ({ ...current, excludeBrands }));
    setSelectedCreators(new Map());
    setPage(1);
  };
  const buildCreatorPool = async () => {
    setDiscoveryRunning(true);
    setDiscoveryStatus("크리에이터 풀을 구축하는 중입니다.");
    try {
      await runCreatorDiscovery();
      setDiscoveryStatus("크리에이터 풀 구축을 완료했습니다.");
      setAppliedFilters((current) => ({ ...current }));
    } catch (reason: unknown) {
      setDiscoveryStatus(
        reason instanceof Error ? reason.message : "크리에이터 풀 구축에 실패했습니다.",
      );
    } finally {
      setDiscoveryRunning(false);
    }
  };
  const selectCategory = (categoryCode: string) => {
    setFilters((current) => ({ ...current, categoryCode }));
    setAppliedFilters((current) => ({ ...current, categoryCode }));
    setSelectedCreators(new Map());
    setPage(1);
  };
  const listedCreators = pageData?.content ?? [];
  const selectedOnPage = listedCreators.filter((creator) => selectedCreators.has(creator.id)).length;
  const allListedCreatorsSelected = listedCreators.length > 0
    && selectedOnPage === listedCreators.length;
  const toggleSelected = (creator: CreatorSummary) => setSelectedCreators((current) => {
    const next = new Map(current);
    if (next.has(creator.id)) next.delete(creator.id);
    else next.set(creator.id, creator);
    return next;
  });
  const toggleAll = () => setSelectedCreators((current) => {
    const next = new Map(current);
    const shouldClearPage = listedCreators.every((creator) => next.has(creator.id));
    listedCreators.forEach((creator) => {
      if (shouldClearPage) next.delete(creator.id);
      else next.set(creator.id, creator);
    });
    return next;
  });
  const columns: DenseTableColumn<CreatorSummary>[] = [
    {
      id: "select",
      header: (
        <input
          aria-label="현재 페이지 전체 선택"
          checked={allListedCreatorsSelected}
          disabled={listedCreators.length === 0}
          onChange={toggleAll}
          ref={(input) => {
            if (input) input.indeterminate = selectedOnPage > 0 && !allListedCreatorsSelected;
          }}
          type="checkbox"
        />
      ),
      width: 40,
      align: "center",
      render: (creator) => (
        <input
          aria-label={`${creator.creatorName || creator.accountId} 선택`}
          checked={selectedCreators.has(creator.id)}
          onChange={() => toggleSelected(creator)}
          type="checkbox"
        />
      ),
    },
    ...creatorColumns(categoryOptions, setProfileCreator),
  ];

  return (
    <>
    <section className="fuma-page">
      <PageHeader title="크리에이터 풀" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-creator-pool-search">
          <SearchPanel actions={(
            <SearchActions onReset={resetSearch} onSearch={applySearch} />
          )}>
            <FilterField htmlFor="creator-keyword" label="키워드">
              <TextInput
                id="creator-keyword"
                name="keyword"
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                placeholder="계정명 또는 SNS 계정 검색"
                value={filters.keyword}
              />
            </FilterField>
            <FilterField htmlFor="creator-platform" label="플랫폼">
              <Select id="creator-platform" onChange={(event) => setFilters((current) => ({ ...current, snsCode: event.target.value }))} options={CREATOR_PLATFORM_OPTIONS} value={filters.snsCode} />
            </FilterField>
            <div className="fuma-follower-range">
              <span>팔로워·구독자</span>
              <div className="fuma-follower-range__inputs">
                <TextInput aria-label="최소 팔로워·구독자" id="creator-followers-min" inputMode="numeric" min="0" onChange={(event) => setFilters((current) => ({ ...current, minFollower: event.target.value }))} placeholder="최소" value={filters.minFollower} />
                <i aria-hidden="true" />
                <TextInput aria-label="최대 팔로워·구독자" id="creator-followers-max" inputMode="numeric" min="0" onChange={(event) => setFilters((current) => ({ ...current, maxFollower: event.target.value }))} placeholder="최대" value={filters.maxFollower} />
                <em>명</em>
              </div>
            </div>
          </SearchPanel>
        </div>
        <ChoiceTabs
          ariaLabel="크리에이터 카테고리"
          emptyOption={{ label: "전체", onSelect: () => selectCategory("") }}
          onChange={selectCategory}
          options={categoryOptions.filter((option) => option.value)}
          value={appliedFilters.categoryCode || null}
        />
        <ResultToolbar
          actions={(
            <>
              <span
                className="fuma-creator-pool-build-action"
                onBlur={() => setBuildPoolTooltipFocused(false)}
                onFocus={() => setBuildPoolTooltipFocused(true)}
                onMouseEnter={() => setBuildPoolTooltipHovered(true)}
                onMouseLeave={() => setBuildPoolTooltipHovered(false)}
              >
                <Button
                  aria-describedby={buildPoolTooltipId}
                  aria-label={discoveryRunning ? "크리에이터 풀 구축 중" : "크리에이터 풀 구축"}
                  className="fuma-content-inspection-refresh-button"
                  disabled={discoveryRunning}
                  onClick={() => void buildCreatorPool()}
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={discoveryRunning ? "is-spinning" : undefined}
                    size={15}
                  />
                </Button>
                <Tooltip
                  id={buildPoolTooltipId}
                  placement="top"
                  visible={buildPoolTooltipInitial || buildPoolTooltipHovered || buildPoolTooltipFocused}
                >
                  새로운 크리에이터 풀을 구축할 수 있습니다.
                </Tooltip>
              </span>
              <Button
                aria-haspopup="dialog"
                disabled={selectedCreators.size === 0}
                onClick={() => setProposalPanelOpen(true)}
                variant="primary"
              >
                선택 {selectedCreators.size}명 제안 발송
              </Button>
              <Button aria-haspopup="dialog" onClick={() => setDiscoverySettingsOpen(true)}>
                발굴 설정
              </Button>
            </>
          )}
          className="fuma-simple-result-toolbar fuma-applicant-result-toolbar fuma-creator-pool-result-toolbar"
          description={discoveryStatus ? <span role="status">{discoveryStatus}</span> : null}
          leading={(
            <div className="fuma-applicant-minimum-filter">
              <Switch
                checked={filters.excludeBrands}
                label="브랜드 계정 제외"
                onChange={(event) => changeExcludeBrands(event.target.checked)}
              />
            </div>
          )}
          meta={<span>총 {pageData?.totalElements ?? 0}건</span>}
          title={null}
        />
        <div aria-label="크리에이터 목록" className="fuma-wide-table fuma-settlement-table" role="region">
          {error ? (
            <EmptyState description={error} title="목록을 불러오지 못했습니다" />
          ) : (
            <DenseTable
              columns={columns}
              emptyMessage={pageData ? "검색 결과가 없습니다." : "크리에이터를 불러오는 중입니다."}
              onRowClick={setProfileCreator}
              rowKey={(creator) => creator.id}
              rows={listedCreators}
              selectedRowKeys={[...selectedCreators.keys()]}
            />
          )}
        </div>
        <Pagination
          onPageChange={setPage}
          page={page}
          pageSize={CREATOR_LIST_PAGE_SIZE}
          totalPages={Math.max(1, pageData?.totalPages ?? 1)}
        />
      </div>
    </section>
    {profileCreator ? (
      <CreatorProfilePanel
        categoryOptions={categoryOptions}
        creator={profileCreator}
        onClose={() => setProfileCreator(null)}
        onProposalComplete={() => navigate("/proposals")}
      />
    ) : null}
    {discoverySettingsOpen ? (
      <DiscoverySettingsPanel onClose={() => {
        setDiscoverySettingsOpen(false);
        refreshCategoryOptions().catch(() => undefined);
      }} />
    ) : null}
    {proposalPanelOpen ? (
      <BatchProposalPanel
        creators={[...selectedCreators.values()]}
        onClose={() => setProposalPanelOpen(false)}
        onComplete={(count) => {
          setSelectedCreators(new Map());
          setProposalPanelOpen(false);
          setProposalRequestedCount(count);
        }}
        onFailed={(failed) => {
          setSelectedCreators(new Map(failed.map((creator) => [creator.id, creator])));
        }}
      />
    ) : null}
    <BubbleDialog
      actions={(
        <button autoFocus onClick={() => {
          setProposalRequestedCount(0);
          navigate("/proposals");
        }} type="button">
          확인
        </button>
      )}
      description={`${proposalRequestedCount}명에게 제안 발송 요청을 완료했습니다.`}
      open={proposalRequestedCount > 0}
      title="발송 요청 완료"
    />
    </>
  );
}

function proposalHistoryColumns(
  ordinalById: Map<number, number>,
): DenseTableColumn<ProposalHistoryEntry>[] {
  return [
    {
      header: "순번",
      id: "ordinal",
      render: (proposal) => ordinalById.get(proposal.proposalHistoryId) ?? "-",
      width: 60,
    },
    { key: "creatorName", header: "크리에이터", width: 130 },
    {
      id: "platform",
      header: "플랫폼",
      width: 120,
      render: (proposal) => <PlatformLabel platform={platformFor(proposal.snsCode)} />,
    },
    { key: "accountId", header: "SNS 계정", width: 150 },
    { key: "email", header: "이메일 주소", width: 210 },
    {
      id: "sentAt",
      header: "발송 시각",
      width: 150,
      render: (proposal) => dateTime(proposal.createdAt),
    },
  ];
}

function ProposalDeliveryDetail({ proposal }: { proposal: ProposalHistoryEntry }) {
  return (
    <div className="fuma-detail-panel__content fuma-proposal-delivery-detail">
      <section aria-label="발송 내역" className="fuma-proposal-delivery-detail__section">
        <dl className="fuma-proposal-delivery-detail__list">
          <div>
            <dt>크리에이터</dt>
            <dd>{proposal.creatorName}</dd>
          </div>
          <div>
            <dt>SNS 계정</dt>
            <dd>{proposal.accountId}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{proposal.email}</dd>
          </div>
          <div>
            <dt>발송자</dt>
            <dd>{proposal.adminName}</dd>
          </div>
          <div>
            <dt>발송 시각</dt>
            <dd>{dateTime(proposal.createdAt)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

async function loadAllProposalHistory(signal?: AbortSignal) {
  const items: ProposalHistoryEntry[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const result = await getAdminProposals(page, PROPOSAL_LIST_FETCH_SIZE, signal);
    items.push(...(result.content ?? []));
    totalPages = result.totalPages > 0 ? result.totalPages : 1;
    page += 1;
  }

  return items;
}

const EMPTY_PROPOSAL_PERIOD = { from: "", to: "" };

export function ProposalHistoryPage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ProposalHistoryEntry[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(EMPTY_PROPOSAL_PERIOD);
  const [appliedPeriod, setAppliedPeriod] = useState(EMPTY_PROPOSAL_PERIOD);
  const [platform, setPlatform] = useState<ProposalHistoryEntry["snsCode"] | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<ProposalHistoryEntry | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadAllProposalHistory(controller.signal).then((result) => {
      setItems(result);
      setError("");
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : "제안 이력 조회에 실패했습니다.");
        setItems([]);
      }
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => {
      if (platform && item.snsCode !== platform) return false;
      return matchesSentPeriod(item.createdAt, appliedPeriod.from, appliedPeriod.to);
    }),
    [appliedPeriod.from, appliedPeriod.to, items, platform],
  );
  const pageSlice = paginate(visibleItems, page, PROPOSAL_PAGE_SIZE);
  const ordinalById = useMemo(() => {
    const start = (pageSlice.currentPage - 1) * PROPOSAL_PAGE_SIZE;
    return new Map(
      pageSlice.pagedItems.map((item, index) => [item.proposalHistoryId, start + index + 1]),
    );
  }, [pageSlice.currentPage, pageSlice.pagedItems]);

  const changePlatform = (nextPlatform: ProposalHistoryEntry["snsCode"] | null) => {
    setPlatform(nextPlatform);
    setPage(1);
  };

  const applySearch = () => {
    setAppliedPeriod(period);
    setPage(1);
  };

  const resetSearch = () => {
    setPeriod(EMPTY_PROPOSAL_PERIOD);
    setAppliedPeriod(EMPTY_PROPOSAL_PERIOD);
    setPage(1);
  };

  return (
    <section className="fuma-page">
      <PageHeader title="제안 이력 관리" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-proposal-history-search">
          <SearchPanel actions={<SearchActions onReset={resetSearch} onSearch={applySearch} />}>
            <FilterField htmlFor="proposal-period-start" label="발송 기간">
              <div className="fuma-cohort-date-range">
                <TextInput
                  aria-label="발송 시작일"
                  id="proposal-period-start"
                  max={period.to || undefined}
                  onChange={(event) => setPeriod((current) => ({ ...current, from: event.target.value }))}
                  type="date"
                  value={period.from}
                />
                <span aria-hidden="true">~</span>
                <TextInput
                  aria-label="발송 종료일"
                  id="proposal-period-end"
                  min={period.from || undefined}
                  onChange={(event) => setPeriod((current) => ({ ...current, to: event.target.value }))}
                  type="date"
                  value={period.to}
                />
              </div>
            </FilterField>
          </SearchPanel>
        </div>
        <ChoiceTabs
          ariaLabel="제안 플랫폼"
          emptyOption={{
            label: "전체",
            onSelect: () => changePlatform(null),
          }}
          onChange={changePlatform}
          options={CREATOR_PLATFORM_TABS}
          value={platform}
        />
        <div className="fuma-result-toolbar fuma-simple-result-toolbar">
          <strong>제안 이력 목록</strong>
          <div className="fuma-settlement-result-meta">
            <span>총 {visibleItems.length.toLocaleString("ko-KR")}건</span>
          </div>
        </div>
        <div
          aria-label="제안 이력 목록"
          className="fuma-wide-table fuma-settlement-table fuma-proposal-history-table"
          role="region"
        >
          {error ? (
            <EmptyState description={error} title="목록을 불러오지 못했습니다" />
          ) : (
            <DenseTable
              align="center"
              columns={proposalHistoryColumns(ordinalById)}
              emptyMessage={isLoading ? "제안 이력을 불러오는 중입니다." : "등록된 제안 이력이 없습니다."}
              onRowClick={setSelectedProposal}
              rowKey={(proposal) => proposal.proposalHistoryId}
              rows={pageSlice.pagedItems}
            />
          )}
        </div>
        <Pagination
          onPageChange={setPage}
          page={pageSlice.currentPage}
          pageSize={PROPOSAL_PAGE_SIZE}
          totalPages={pageSlice.totalPages}
        />
      </div>
      {selectedProposal ? (
        <SidePanel onClose={() => setSelectedProposal(null)} title="발송 내역">
          <ProposalDeliveryDetail proposal={selectedProposal} />
        </SidePanel>
      ) : null}
    </section>
  );
}
