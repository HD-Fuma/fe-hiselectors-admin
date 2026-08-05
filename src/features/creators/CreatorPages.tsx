import { useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FormRow } from "../../components/ui/FormRow";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SectionTabs } from "../../components/ui/SectionTabs";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { CreatorCardGrid } from "./CreatorCardGrid";
import { engagementResultForCreator } from "./CreatorAnalysisReport";
import { CreatorAnalysisReport } from "./CreatorAnalysisReport";
import {
  CreatorResultToolbar,
  type CreatorPoolView,
} from "./CreatorResultToolbar";
import { PlatformIcon } from "./PlatformIcon";
import {
  CREATORS,
  META_MANUAL_SEND_NOTE,
  PENDING_AI_REPORT,
  PROPOSALS,
  type CreatorFixture,
  type CreatorProfileFixture,
  type EmailCreatorFixture,
  type ProposalFixture,
  type ProposalStatus,
} from "./fixtures";

const PLATFORM_OPTIONS = ["전체", "Instagram", "YouTube"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const PROPOSAL_CHANNEL_OPTIONS = ["전체", "Instagram DM", "이메일"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const PROPOSAL_STATUS_OPTIONS = [
  "전체",
  "발송 대기",
  "발송 완료",
  "발송 실패",
  "셀렉터스 전환",
].map((label) => ({ label, value: label === "전체" ? "" : label }));

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function PlatformLabel({ platform }: { platform: CreatorProfileFixture["platform"] }) {
  return (
    <span className="fuma-platform-label">
      <PlatformIcon platform={platform} />
      <span aria-hidden="true">{platform}</span>
    </span>
  );
}

function proposalTone(
  status: ProposalStatus | "미제안",
): NonNullable<StatusPillProps["tone"]> {
  if (status === "발송 완료" || status === "셀렉터스 전환") {
    return "approved";
  }
  if (status === "발송 대기") {
    return "pending";
  }
  if (status === "발송 실패") {
    return "rejected";
  }
  return "neutral";
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

function ResultToolbar({ count, title }: { count: number; title: string }) {
  return (
    <div className="fuma-result-toolbar">
      <strong>{title}</strong>
      <span>총 {count}건</span>
    </div>
  );
}

const CREATOR_COLUMNS: DenseTableColumn<CreatorFixture>[] = [
  { key: "id", header: "ID", width: 76 },
  { key: "name", header: "이름", width: 70 },
  {
    id: "platform",
    header: "플랫폼",
    width: 115,
    render: (creator) => <PlatformLabel platform={creator.profile.platform} />,
  },
  {
    id: "account",
    header: "계정",
    width: 130,
    render: (creator) => creator.profile.handle,
  },
  {
    id: "categories",
    header: "카테고리",
    width: 110,
    render: (creator) => creator.categories.join(" / "),
  },
  {
    id: "keywords",
    header: "키워드",
    width: 165,
    render: (creator) => creator.keywords.join(" "),
  },
  {
    id: "followers",
    header: "팔로워·구독자",
    width: 105,
    align: "right",
    render: (creator) => formatNumber(creator.profile.followers),
  },
  {
    id: "engagementRate",
    header: "ER",
    width: 72,
    align: "right",
    render: (creator) => {
      const engagement = engagementResultForCreator(creator);
      return engagement.value === null ? "집계 불가" : `${engagement.value.toFixed(1)}%`;
    },
  },
  { key: "recentActivity", header: "최근 활동일", width: 96, align: "center" },
  {
    id: "detail",
    header: "상세",
    width: 60,
    align: "center",
    render: (creator) => (
      <Button aria-label={`${creator.name} 상세 보기`} className="fuma-table-action">
        보기
      </Button>
    ),
  },
];

export function CreatorListPage() {
  const [searchParams] = useSearchParams();
  const creators = [...(searchParams.get("fixture") === "empty" ? [] : CREATORS)].sort(
    (left, right) => {
      const leftRate = engagementResultForCreator(left).value;
      const rightRate = engagementResultForCreator(right).value;
      return (rightRate ?? Number.NEGATIVE_INFINITY) - (leftRate ?? Number.NEGATIVE_INFINITY);
    },
  );
  const [view, setView] = useState<CreatorPoolView>("cards");

  return (
    <section className="fuma-page">
      <PageHeader screenCode="CR101" title="크리에이터 풀" />
      <div className="fuma-page__body">
        <SearchPanel actions={<SearchActions />}>
          <FilterField htmlFor="creator-keyword" label="키워드">
            <TextInput
              id="creator-keyword"
              name="keyword"
              placeholder="이름 또는 채널명 검색"
            />
          </FilterField>
          <FilterField htmlFor="creator-followers-min" label="최소 팔로워·구독자">
            <TextInput
              id="creator-followers-min"
              name="followersMin"
              placeholder="예: 10,000"
            />
          </FilterField>
          <FilterField htmlFor="creator-followers-max" label="최대 팔로워·구독자">
            <TextInput
              id="creator-followers-max"
              name="followersMax"
              placeholder="예: 100,000"
            />
          </FilterField>
          <FilterField htmlFor="creator-platform" label="플랫폼">
            <Select id="creator-platform" name="platform" options={PLATFORM_OPTIONS} />
          </FilterField>
        </SearchPanel>
        <CreatorResultToolbar count={creators.length} onViewChange={setView} view={view} />
        {creators.length === 0 ? (
          <EmptyState title="검색 결과가 없습니다." />
        ) : view === "cards" ? (
          <CreatorCardGrid creators={creators} />
        ) : (
          <div aria-label="크리에이터 목록" className="fuma-wide-table" role="region">
            <DenseTable
              columns={CREATOR_COLUMNS}
              emptyMessage="검색 결과가 없습니다."
              rowKey={(creator) => creator.id}
              rows={creators}
            />
          </div>
        )}
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
  );
}

const CHANNEL_COLUMNS: DenseTableColumn<CreatorProfileFixture>[] = [
  {
    id: "platform",
    header: "플랫폼",
    width: 120,
    render: (channel) => <PlatformLabel platform={channel.platform} />,
  },
  { key: "handle", header: "채널" },
  {
    key: "followers",
    header: "팔로워·구독자",
    width: 140,
    align: "right",
    render: (profile) => formatNumber(profile.followers),
  },
  {
    key: "averageViews",
    header: "평균 조회 수",
    width: 140,
    align: "right",
    render: (profile) => formatNumber(profile.averageViews),
  },
  {
    key: "averageReactions",
    header: "평균 반응 수",
    width: 140,
    align: "right",
    render: (profile) => formatNumber(profile.averageReactions),
  },
];

function BasicInformation({ creator }: { creator: CreatorFixture }) {
  const fields = [
    ["ID", creator.id],
    ["이름", creator.name],
    ["카테고리", creator.categories.join(" / ")],
    ["티어", creator.tier],
    ["팔로워·구독자", formatNumber(creator.profile.followers)],
    ["콘텐츠 수", formatNumber(creator.contentCount)],
    ["최근 활동일", creator.recentActivity],
  ];

  return (
    <section aria-labelledby="creator-basic-title" className="fuma-content-section">
      <header className="fuma-content-section__header">
        <h2 id="creator-basic-title">기본 정보</h2>
      </header>
      <dl className="fuma-key-value-grid">
        {fields.map(([label, value]) => (
          <div className="fuma-key-value-grid__item" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div className="fuma-key-value-grid__item">
          <dt>제안 상태</dt>
          <dd>
            <StatusPill tone={proposalTone(creator.proposalStatus)}>
              {creator.proposalStatus}
            </StatusPill>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function ProposalMethod({
  buttonLabel,
  children,
  title,
}: {
  buttonLabel: string;
  children: ReactNode;
  title: string;
}) {
  return (
    <article className="fuma-proposal-method">
      <h3>{title}</h3>
      <div className="fuma-proposal-method__details">{children}</div>
      <Button variant="primary">{buttonLabel}</Button>
    </article>
  );
}

function hasEmailProposalChannel(creator: CreatorFixture): creator is EmailCreatorFixture {
  return creator.availableProposalChannels.at(-1) === "이메일";
}

function ProposalMethods({ creator }: { creator: CreatorFixture }) {
  const hasInstagramProposalChannel =
    creator.availableProposalChannels[0] === "Instagram DM";
  const hasEmailProposal = hasEmailProposalChannel(creator);

  return (
    <section
      aria-labelledby="creator-proposal-title"
      className="fuma-content-section"
      id="proposal"
    >
      <header className="fuma-content-section__header">
        <h2 id="creator-proposal-title">영입 제안</h2>
      </header>
      <div className="fuma-proposal-methods">
        {hasInstagramProposalChannel ? (
          <ProposalMethod buttonLabel="Instagram DM 제안 발송" title="Instagram DM">
            <dl>
              <div>
                <dt>발송 방식</dt>
                <dd>수동</dd>
              </div>
              <div>
                <dt>발송 상태</dt>
                <dd>
                  <StatusPill tone="approved">발송 가능</StatusPill>
                </dd>
              </div>
            </dl>
            <p className="fuma-proposal-method__note">{META_MANUAL_SEND_NOTE}</p>
          </ProposalMethod>
        ) : null}
        {hasEmailProposal ? (
          <ProposalMethod buttonLabel="이메일 제안 발송" title="이메일">
            <dl>
              <div>
                <dt>이메일</dt>
                <dd>{creator.email}</dd>
              </div>
              <div>
                <dt>발송 방식</dt>
                <dd>자동</dd>
              </div>
              <div>
                <dt>자동 발송 상태</dt>
                <dd>
                  <StatusPill tone="approved">발송 가능</StatusPill>
                </dd>
              </div>
            </dl>
          </ProposalMethod>
        ) : null}
      </div>
    </section>
  );
}

export function CreatorDetailPage() {
  const { creatorId } = useParams();
  const [searchParams] = useSearchParams();
  const fixture = CREATORS.find((creator) => creator.id === creatorId);
  const creator =
    fixture && searchParams.get("fixture") === "ai-pending"
      ? { ...fixture, aiReport: PENDING_AI_REPORT }
      : fixture;

  return (
    <section className="fuma-page">
      <PageHeader screenCode="CR102" title="크리에이터 상세" />
      <div className="fuma-page__body">
        {creator ? (
          <>
            <SectionTabs
              activeId="basic"
              items={[
                { id: "basic", label: "기본 정보" },
                { id: "ai", label: "크리에이터 분석" },
                { id: "proposal", label: "영입 제안" },
              ]}
            />
            <BasicInformation creator={creator} />
            <section aria-labelledby="creator-channel-title" className="fuma-content-section">
              <header className="fuma-content-section__header">
                <h2 id="creator-channel-title">플랫폼별 채널</h2>
              </header>
              <DenseTable
                columns={CHANNEL_COLUMNS}
                rowKey={(profile) => `${profile.platform}-${profile.handle}`}
                rows={[creator.profile]}
              />
            </section>
            <CreatorAnalysisReport creator={creator} />
            <ProposalMethods creator={creator} />
          </>
        ) : (
          <EmptyState
            description="요청한 크리에이터 정보를 확인할 수 없습니다."
            title="대상을 찾을 수 없습니다"
          />
        )}
      </div>
    </section>
  );
}

function ProposalCreatorSummary({ creator }: { creator: CreatorFixture }) {
  const platform = creator.profile.platform;
  const audienceLabel = platform === "Instagram" ? "팔로워" : "구독자";

  return (
    <aside aria-label="제안 대상" className="fuma-proposal-compose__creator">
      <p className="fuma-proposal-compose__eyebrow">제안 대상</p>
      <div className="fuma-proposal-compose__creator-profile">
        <img alt={`${creator.name} 프로필 이미지`} src={creator.profile.profileImageUrl} />
        <div>
          <strong>{creator.name}</strong>
          <span>
            <PlatformLabel platform={platform} />
            {creator.profile.handle}
          </span>
        </div>
      </div>
      <dl className="fuma-proposal-compose__creator-metrics">
        <div>
          <dt>{audienceLabel}</dt>
          <dd>{formatNumber(creator.profile.followers)}</dd>
        </div>
        <div>
          <dt>카테고리</dt>
          <dd>{creator.categories.join(" · ")}</dd>
        </div>
      </dl>
      <p className="fuma-proposal-compose__creator-note">
        대표 콘텐츠와 분석 리포트를 확인한 뒤 제안 내용을 작성해 주세요.
      </p>
    </aside>
  );
}

export function ProposalComposePage() {
  const [searchParams] = useSearchParams();
  const creator = CREATORS.find((item) => item.id === searchParams.get("creator"));

  if (!creator) {
    return (
      <section className="fuma-page">
        <PageHeader screenCode="CR202" title="크리에이터 제안 작성" />
        <div className="fuma-page__body">
          <EmptyState
            description="크리에이터 풀에서 제안할 대상을 선택해 주세요."
            title="제안 대상이 없습니다"
          />
        </div>
      </section>
    );
  }

  const channelOptions = creator.availableProposalChannels.map((channel) => ({
    label: channel,
    value: channel,
  }));
  const initialChannel = channelOptions[0].value;
  const isInstagram = initialChannel === "Instagram DM";

  return (
    <section className="fuma-page fuma-proposal-compose">
      <PageHeader screenCode="CR202" title="크리에이터 제안 작성" />
      <div className="fuma-page__body">
        <div className="fuma-proposal-compose__intro">
          <div>
            <p>CREATOR OUTREACH</p>
            <h2>{creator.name}님에게 보낼 제안을 작성합니다.</h2>
          </div>
          <span>발송 전 내용을 다시 확인해 주세요.</span>
        </div>
        <div className="fuma-proposal-compose__layout">
          <ProposalCreatorSummary creator={creator} />
          <form aria-label="제안 작성" className="fuma-proposal-compose__form">
            <div className="fuma-proposal-compose__form-heading">
              <h2>제안 내용</h2>
              <span>필수 항목을 입력해 주세요.</span>
            </div>
            <FormRow label="제안 채널" required>
              <Select aria-label="제안 채널" defaultValue={initialChannel} options={channelOptions} />
            </FormRow>
            <FormRow label="발송 방식">
              <div className="fuma-proposal-compose__delivery">
                <strong>{isInstagram ? "관리자 수동 발송" : "이메일 자동 발송"}</strong>
                <span>{isInstagram ? META_MANUAL_SEND_NOTE : creator.email}</span>
              </div>
            </FormRow>
            <FormRow label="제목" required>
              <TextInput
                aria-label="제목"
                defaultValue={`더현대Hi 셀렉터스 활동 제안드립니다, ${creator.name}님`}
              />
            </FormRow>
            <FormRow label="제안 메시지" required>
              <textarea
                aria-label="제안 메시지"
                className="hsas-control fuma-proposal-compose__textarea"
                defaultValue={`${creator.name}님의 콘텐츠를 인상 깊게 보았습니다. 더현대Hi 셀렉터스와 함께할 기회를 제안드립니다.`}
              />
            </FormRow>
            <footer className="fuma-proposal-compose__footer">
              <span>발송 후 제안 이력에서 상태를 확인할 수 있습니다.</span>
              <div>
                <Button>취소</Button>
                <Button variant="primary">제안 발송</Button>
              </div>
            </footer>
          </form>
        </div>
      </div>
    </section>
  );
}

const PROPOSAL_COLUMNS: DenseTableColumn<ProposalFixture>[] = [
  {
    id: "target",
    header: "대상",
    width: 145,
    render: (proposal) => `${proposal.targetName} (${proposal.targetId})`,
  },
  { key: "channel", header: "채널", width: 110 },
  { key: "sendMethod", header: "발송 방식", width: 82, align: "center" },
  { key: "sentAt", header: "발송 시각", width: 130, align: "center" },
  {
    key: "status",
    header: "상태",
    width: 104,
    align: "center",
    render: (proposal) => (
      <StatusPill tone={proposalTone(proposal.status)}>{proposal.status}</StatusPill>
    ),
  },
  {
    key: "constraintNote",
    header: "발송 안내",
    width: 400,
    render: (proposal) => proposal.constraintNote ?? "-",
  },
];

export function ProposalHistoryPage() {
  const [searchParams] = useSearchParams();
  const creatorId = searchParams.get("creator");
  const proposals =
    searchParams.get("fixture") === "empty"
      ? []
      : creatorId
        ? PROPOSALS.filter((proposal) => proposal.targetId === creatorId)
        : PROPOSALS;

  return (
    <section className="fuma-page">
      <PageHeader screenCode="CR201" title="제안 이력 관리" />
      <div className="fuma-page__body">
        <SearchPanel actions={<SearchActions />}>
          <FilterField htmlFor="proposal-channel" label="채널">
            <Select
              id="proposal-channel"
              name="channel"
              options={PROPOSAL_CHANNEL_OPTIONS}
            />
          </FilterField>
          <FilterField htmlFor="proposal-status" label="상태">
            <Select id="proposal-status" name="status" options={PROPOSAL_STATUS_OPTIONS} />
          </FilterField>
        </SearchPanel>
        <ResultToolbar count={proposals.length} title="제안 이력 목록" />
        <div aria-label="제안 이력 목록" className="fuma-wide-table" role="region">
          <DenseTable
            columns={PROPOSAL_COLUMNS}
            emptyMessage="등록된 제안 이력이 없습니다."
            rowKey={(proposal) => proposal.id}
            rows={proposals}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
  );
}
