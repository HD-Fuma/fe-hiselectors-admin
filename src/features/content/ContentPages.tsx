import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Heart,
  Images,
  MessageCircle,
  Play,
  Send,
  ShieldCheck,
} from "lucide-react";
import "../../styles/content-review.css";
import { PageHeader } from "../../components/shell/PageHeader";
import { Button, Select, TextInput } from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import {
  CONTENT_REVIEWS,
  REVIEW_TYPE_LABELS,
  findContentReviewFixture,
  type ContentReviewFixture,
  type ContentReviewSignal,
  type ContentSnapshot,
  type ReviewStatus,
} from "./fixtures";

const REVIEW_TYPE_OPTIONS = ["전체", "신규 콘텐츠", "위반 수정본", "일반 수정본"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);
const PLATFORM_OPTIONS = ["전체", "Instagram", "YouTube"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const REVIEW_STATUS_OPTIONS = ["전체", "검수 대기", "수정 요청", "승인", "위반 확정"].map(
  (label) => ({ label, value: label === "전체" ? "" : label }),
);

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

function reviewStatusTone(status: ReviewStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "승인") return "approved";
  if (status === "검수 대기") return "pending";
  return "rejected";
}

function QueueFilters() {
  return (
    <SearchPanel actions={<SearchActions />}>
      <FilterField htmlFor="content-review-keyword" label="콘텐츠/작성자">
        <TextInput
          aria-label="콘텐츠/작성자"
          id="content-review-keyword"
          placeholder="콘텐츠 ID 또는 작성자"
        />
      </FilterField>
      <FilterField htmlFor="content-review-type" label="검수 유형">
        <Select id="content-review-type" options={REVIEW_TYPE_OPTIONS} />
      </FilterField>
      <FilterField htmlFor="content-review-platform" label="플랫폼">
        <Select id="content-review-platform" options={PLATFORM_OPTIONS} />
      </FilterField>
      <FilterField htmlFor="content-review-status" label="검수 상태">
        <Select id="content-review-status" options={REVIEW_STATUS_OPTIONS} />
      </FilterField>
    </SearchPanel>
  );
}

function queueColumns(): DenseTableColumn<ContentReviewFixture>[] {
  return [
    { key: "id", header: "콘텐츠 ID", width: 96 },
    {
      key: "reviewType",
      header: "검수 유형",
      width: 120,
      render: (content) => REVIEW_TYPE_LABELS[content.reviewType],
    },
    { key: "author", header: "작성자", width: 100 },
    { key: "sourcePlatform", header: "플랫폼", width: 100, align: "center" },
    { key: "submittedAt", header: "수집 시각", width: 160, align: "center" },
    {
      key: "aiStatus",
      header: "리포트 상태",
      width: 120,
      align: "center",
      render: (content) => (
        <StatusPill tone={content.aiStatus === "ready" ? "approved" : "pending"}>
          {content.aiStatus === "ready" ? "생성 완료" : "생성 대기"}
        </StatusPill>
      ),
    },
    {
      key: "reviewStatus",
      header: "검수 상태",
      width: 110,
      align: "center",
      render: (content) => (
        <StatusPill tone={reviewStatusTone(content.reviewStatus)}>
          {content.reviewStatus}
        </StatusPill>
      ),
    },
  ];
}

export function ContentReviewListPage() {
  const [selectedContent, setSelectedContent] = useState<ContentReviewFixture | null>(null);

  return (
    <section className="fuma-page" data-visual-contract="content-review">
      <PageHeader screenCode="CT101" title="콘텐츠 검수" />
      <div className="fuma-page__body">
        <QueueFilters />
        <div className="fuma-result-toolbar">
          <strong>콘텐츠 검수 대기열</strong>
          <span>총 {CONTENT_REVIEWS.length}건</span>
        </div>
        <div
          aria-label="콘텐츠 검수 대기열"
          className="fuma-wide-table fuma-content-review-table"
          role="region"
        >
          <DenseTable
            columns={queueColumns()}
            onRowClick={setSelectedContent}
            rowKey={(content) => content.id}
            rows={[...CONTENT_REVIEWS]}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
      {selectedContent ? (
        <SidePanel onClose={() => setSelectedContent(null)} title="콘텐츠 검수 상세">
          <ContentReviewDetailContent content={selectedContent} />
        </SidePanel>
      ) : null}
    </section>
  );
}

function ReviewCaseHeader({ content }: { content: ContentReviewFixture }) {
  const facts = [
    ["콘텐츠 ID", content.id],
    ["작성자", content.author],
    ["플랫폼", content.sourcePlatform],
    ["수집 시각", content.submittedAt],
    ["콘텐츠 버전", content.currentSnapshot.label],
    ["리포트", content.aiStatus === "ready" ? "생성 완료" : "생성 대기"],
  ];

  return (
    <section aria-label="기본 정보" className="fuma-text-review-summary">
      <div className="fuma-text-review-summary__title">
        <span>{REVIEW_TYPE_LABELS[content.reviewType]}</span>
        <h3>{content.author}의 콘텐츠</h3>
        <p>{content.currentSnapshot.capturedAt} 기준 수집본</p>
      </div>
      <div className="fuma-text-review-summary__status">
        <StatusPill tone={reviewStatusTone(content.reviewStatus)}>{content.reviewStatus}</StatusPill>
      </div>
      <dl className="fuma-text-review-summary__facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function renderHighlightedText(text: string, quotes: string[]) {
  const matches = [...new Set(quotes)]
    .filter((quote) => quote.length > 0 && text.includes(quote))
    .sort((left, right) => right.length - left.length);
  if (matches.length === 0) return text;

  const escaped = matches.map((quote) => quote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const matcher = new RegExp(`(${escaped.join("|")})`, "g");
  return text.split(matcher).map((part, index) =>
    matches.includes(part) ? <mark key={`${part}-${index}`}>{part}</mark> : part,
  );
}

interface SocialSnapshotProps {
  author: string;
  highlightQuotes: string[];
  platform: string;
  snapshot: ContentSnapshot;
  version: "before" | "after";
}

function SocialSnapshot({ author, highlightQuotes, platform, snapshot, version }: SocialSnapshotProps) {
  const mainMedia = snapshot.mediaUrls[0];
  const hasVideo = snapshot.mediaKinds.some((kind) => kind === "동영상");

  return (
    <article
      aria-label={version === "before" ? "이전 콘텐츠" : "현재 콘텐츠"}
      className="fuma-social-snapshot"
      data-version={version}
    >
      <div className="fuma-social-snapshot__version">
        <div>
          <span>{version === "before" ? "BEFORE" : "AFTER"}</span>
          <strong>{snapshot.label}</strong>
        </div>
        <time>{snapshot.capturedAt}</time>
      </div>
      <div className="fuma-social-snapshot__post">
        <header className="fuma-social-snapshot__profile">
          <span aria-hidden="true" className="fuma-social-snapshot__avatar">{author.slice(0, 1)}</span>
          <div><strong>{author}</strong><span>{platform}</span></div>
          <span>•••</span>
        </header>
        <div className="fuma-social-snapshot__media">
          {mainMedia ? (
            <img alt={`${author} ${snapshot.label} 원본 미디어`} src={mainMedia} />
          ) : (
            <div className="fuma-social-snapshot__placeholder"><Images aria-hidden="true" size={28} /></div>
          )}
          {hasVideo ? <span aria-label="동영상" className="fuma-social-snapshot__play"><Play aria-hidden="true" size={18} /></span> : null}
          {snapshot.mediaCount > 1 ? <span className="fuma-social-snapshot__count">1 / {snapshot.mediaCount}</span> : null}
        </div>
        {snapshot.mediaUrls.length > 1 ? (
          <div className="fuma-social-snapshot__thumbs">
            {snapshot.mediaUrls.slice(1).map((url, index) => (
              <img alt={`${snapshot.label} 추가 미디어 ${index + 2}`} key={url} src={url} />
            ))}
            {snapshot.mediaCount > snapshot.mediaUrls.length ? (
              <span>+{snapshot.mediaCount - snapshot.mediaUrls.length}</span>
            ) : null}
          </div>
        ) : null}
        <div aria-hidden="true" className="fuma-social-snapshot__engagement">
          <Heart size={18} /><MessageCircle size={18} /><Send size={18} />
        </div>
        <div className="fuma-social-snapshot__caption">
          <span>원문 전체</span>
          <p><strong>{author}</strong> {renderHighlightedText(snapshot.text, highlightQuotes)}</p>
        </div>
        <div className="fuma-social-snapshot__links">
          {snapshot.urls.map((url) => (
            <a href={url} key={url} rel="noreferrer" target="_blank">
              {url}<ExternalLink aria-hidden="true" size={12} />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

function OriginalContent({ content }: { content: ContentReviewFixture }) {
  const candidateQuotes = content.report.signals
    .filter((signal) => signal.tone !== "pass")
    .map((signal) => signal.evidence);
  const previousQuotes = content.previousSnapshot?.annotations
    ?.filter((annotation) => annotation.target.kind === "text")
    .map((annotation) => annotation.target.kind === "text" ? annotation.target.quote : "") ?? [];

  return (
    <section aria-label="원본 콘텐츠" className="fuma-text-review-section fuma-text-review-original">
      <header className="fuma-text-review-section__header">
        <div>
          <span>CONTENT VERSION</span>
          <h3>{content.previousSnapshot ? "수정 전·후 비교" : "SNS 원본 콘텐츠"}</h3>
        </div>
        <div className="fuma-text-review-media-note">
          <Images aria-hidden="true" size={15} />
          <span>미디어는 원본 확인용</span>
        </div>
      </header>
      {content.previousSnapshot ? (
        <div aria-label="변경 요약" className="fuma-text-review-changes">
          <strong>변경 요약</strong>
          <ul>{content.changeItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : null}
      <div className={`fuma-social-compare${content.previousSnapshot ? "" : " fuma-social-compare--single"}`}>
        {content.previousSnapshot ? (
          <SocialSnapshot
            author={content.author}
            highlightQuotes={previousQuotes}
            platform={content.sourcePlatform}
            snapshot={content.previousSnapshot}
            version="before"
          />
        ) : null}
        <SocialSnapshot
          author={content.author}
          highlightQuotes={candidateQuotes}
          platform={content.sourcePlatform}
          snapshot={content.currentSnapshot}
          version="after"
        />
      </div>
    </section>
  );
}

function signalTone(signal: ContentReviewSignal): NonNullable<StatusPillProps["tone"]> {
  if (signal.tone === "pass") return "approved";
  if (signal.tone === "warning") return "pending";
  return "rejected";
}

type NumberedCandidate = ContentReviewSignal & { ordinal: number };

function renderMarkedEvidence(text: string, candidates: NumberedCandidate[]) {
  const matched = candidates.filter((candidate) => text.includes(candidate.evidence));
  if (matched.length === 0) return text;

  const escaped = matched.map((candidate) => candidate.evidence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const matcher = new RegExp(`(${escaped.join("|")})`, "g");
  return text.split(matcher).map((part, index) => {
    const candidate = matched.find((item) => item.evidence === part);
    return candidate ? (
      <mark key={`${part}-${index}`}>
        <sup>{candidate.ordinal}</sup>{part}
      </mark>
    ) : part;
  });
}

interface EvidenceTextProps {
  candidates: NumberedCandidate[];
  label: string;
  location: string;
  text: string;
  tone: "original" | "ocr" | "stt";
}

function EvidenceText({ candidates, label, location, text, tone }: EvidenceTextProps) {
  return (
    <article className="fuma-text-evidence" data-source={tone}>
      <header>
        <span>{label}</span>
        <small>{location}</small>
      </header>
      <p>{renderMarkedEvidence(text, candidates)}</p>
      {candidates.length > 0 ? (
        <div className="fuma-text-evidence__issues">
          {candidates.map((candidate) => (
            <div key={`${label}-${candidate.title}`}>
              <span>{candidate.ordinal}</span>
              <div>
                <strong>{candidate.title}</strong>
                <p>{candidate.detail}</p>
                <small>{candidate.guidance ?? "해당 표현을 확인하고 최종 위반 여부를 판정해 주세요."}</small>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="fuma-text-evidence__clear"><CheckCircle2 aria-hidden="true" size={14} />감지된 위반 후보 없음</div>
      )}
    </article>
  );
}

function TextEvidenceReview({ content }: { content: ContentReviewFixture }) {
  const candidates: NumberedCandidate[] = content.report.signals
    .filter((signal) => signal.tone !== "pass")
    .map((signal, index) => ({ ...signal, ordinal: index + 1 }));
  const originalCandidates = candidates.filter((candidate) => candidate.source.includes("본문"));
  const ocrCandidates = candidates.filter((candidate) => candidate.source.startsWith("OCR"));
  const sttCandidates = candidates.filter((candidate) => candidate.source.startsWith("STT"));
  const ocrExtract = content.report.extracts.find((extract) => extract.type === "OCR");
  const sttExtract = content.report.extracts.find((extract) => extract.type === "STT");

  return (
    <section aria-label="위반 근거 텍스트" className="fuma-text-review-section">
      <header className="fuma-text-review-section__header">
        <div><span>TEXT EVIDENCE</span><h3>위반 근거 텍스트</h3></div>
        <StatusPill tone={candidates.length > 0 ? "rejected" : "approved"}>{candidates.length}건</StatusPill>
      </header>
      <div className="fuma-text-evidence-grid">
        <EvidenceText
          candidates={originalCandidates}
          label="원문"
          location="현재 버전 게시물 본문"
          text={content.currentSnapshot.text}
          tone="original"
        />
        <EvidenceText
          candidates={ocrCandidates}
          label="OCR"
          location={ocrExtract?.location ?? "추출 결과 없음"}
          text={ocrExtract?.text ?? "OCR로 추출된 텍스트가 없습니다."}
          tone="ocr"
        />
        <EvidenceText
          candidates={sttCandidates}
          label="STT"
          location={sttExtract?.location ?? "추출 결과 없음"}
          text={sttExtract?.text ?? "STT로 추출된 텍스트가 없습니다."}
          tone="stt"
        />
      </div>
    </section>
  );
}

function TextAnalysisReport({ content }: { content: ContentReviewFixture }) {
  return (
    <section aria-label="AI 텍스트 분석 리포트" className="fuma-text-review-section">
      <header className="fuma-text-review-section__header">
        <div>
          <span>CONTENT REPORT</span>
          <h3>AI 텍스트 분석 리포트</h3>
        </div>
        <time>{content.report.generatedAt}</time>
      </header>
      <div className="fuma-text-review-scope">
        <FileText aria-hidden="true" size={18} />
        <div>
          <strong>분석 범위: 원문 · OCR · STT · URL</strong>
          <span>이미지·영상은 직접 판정하지 않고 OCR·STT로 변환된 텍스트만 근거로 사용합니다.</span>
        </div>
      </div>
      <p className="fuma-text-review-ai-summary">{content.aiSummary}</p>
      <ul className="fuma-text-review-signals">
        {content.report.signals.map((signal) => (
          <li data-tone={signal.tone} key={signal.title}>
            <div className="fuma-text-review-signals__icon">
              {signal.tone === "pass" ? (
                <CheckCircle2 aria-hidden="true" size={17} />
              ) : (
                <AlertTriangle aria-hidden="true" size={17} />
              )}
            </div>
            <div>
              <div className="fuma-text-review-signals__title">
                <strong>{signal.title}</strong>
                <StatusPill tone={signalTone(signal)}>
                  {signal.tone === "pass" ? "이상 없음" : "위반 후보"}
                </StatusPill>
              </div>
              <p>{signal.detail}</p>
              <dl>
                <div><dt>텍스트 근거</dt><dd>{signal.evidence}</dd></div>
                <div><dt>출처</dt><dd>{signal.source}</dd></div>
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewHistory({ content }: { content: ContentReviewFixture }) {
  return (
    <section aria-label="검수 이력" className="fuma-text-review-section">
      <header className="fuma-text-review-section__header">
        <div><span>HISTORY</span><h3>검수 이력</h3></div>
      </header>
      <ol className="fuma-text-review-history">
        {content.report.history.map((item) => (
          <li key={`${item.at}-${item.label}`}>
            <Clock3 aria-hidden="true" size={15} />
            <div><strong>{item.label}</strong><span>{item.actor}</span></div>
            <time>{item.at}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FinalReviewPanel({ content }: { content: ContentReviewFixture }) {
  const candidates = content.report.signals
    .filter((signal) => signal.tone !== "pass")
    .map((signal, index) => ({ ...signal, ordinal: index + 1 }));
  const [violationDecisions, setViolationDecisions] = useState<Record<string, "승인" | "반려">>({});
  const [contentDecision, setContentDecision] = useState<"승인" | "수정 요청" | null>(null);
  const [penaltyDecision, setPenaltyDecision] = useState<"적용" | "미적용" | null>(null);
  const decidedCount = candidates.filter((candidate) => violationDecisions[candidate.title]).length;
  const canSave = decidedCount === candidates.length && contentDecision !== null && penaltyDecision !== null;

  function decideViolation(title: string, decision: "승인" | "반려") {
    setViolationDecisions((current) => ({ ...current, [title]: decision }));
    setContentDecision(null);
    setPenaltyDecision(null);
  }

  return (
    <section aria-label="검수 처리" className="fuma-text-review-final">
      <header>
        <div><span>FINAL REVIEW</span><h3>최종 검수</h3></div>
        <ShieldCheck aria-hidden="true" size={20} />
      </header>
      <div className="fuma-text-review-final__progress">
        <span>위반 후보 판정</span>
        <strong>{decidedCount} / {candidates.length}</strong>
      </div>
      <div className="fuma-text-review-final__candidates">
        {candidates.length > 0 ? candidates.map((candidate) => (
          <article key={candidate.title}>
            <div><span>{candidate.ordinal}</span><strong>{candidate.title}</strong></div>
            <blockquote>“{candidate.evidence}”</blockquote>
            <p>{candidate.detail}</p>
            <div>
              <Button
                aria-pressed={violationDecisions[candidate.title] === "승인"}
                className={violationDecisions[candidate.title] === "승인" ? "is-selected" : undefined}
                onClick={() => decideViolation(candidate.title, "승인")}
              >
                승인
              </Button>
              <Button
                aria-pressed={violationDecisions[candidate.title] === "반려"}
                className={violationDecisions[candidate.title] === "반려" ? "is-selected" : undefined}
                onClick={() => decideViolation(candidate.title, "반려")}
              >
                반려
              </Button>
            </div>
          </article>
        )) : (
          <div className="fuma-text-review-final__clear">
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>판정할 텍스트 위반 후보가 없습니다.</span>
          </div>
        )}
      </div>
      <fieldset className="fuma-text-review-final__required" disabled={decidedCount !== candidates.length}>
        <legend>콘텐츠 검수 결과 <span>필수</span></legend>
        <div>
          <Button
            aria-pressed={contentDecision === "승인"}
            className={contentDecision === "승인" ? "is-selected is-approved" : undefined}
            onClick={() => { setContentDecision("승인"); setPenaltyDecision(null); }}
          >
            승인
          </Button>
          <Button
            aria-pressed={contentDecision === "수정 요청"}
            className={contentDecision === "수정 요청" ? "is-selected is-revision" : undefined}
            onClick={() => { setContentDecision("수정 요청"); setPenaltyDecision(null); }}
          >
            수정 요청
          </Button>
        </div>
      </fieldset>
      <fieldset className="fuma-text-review-final__required" disabled={!contentDecision}>
        <legend>페널티 여부 <span>필수</span></legend>
        <div>
          <Button
            aria-pressed={penaltyDecision === "미적용"}
            className={penaltyDecision === "미적용" ? "is-selected" : undefined}
            onClick={() => setPenaltyDecision("미적용")}
          >
            미적용
          </Button>
          <Button
            aria-pressed={penaltyDecision === "적용"}
            className={penaltyDecision === "적용" ? "is-selected is-penalty" : undefined}
            onClick={() => setPenaltyDecision("적용")}
          >
            적용
          </Button>
        </div>
      </fieldset>
      <label className="fuma-text-review-final__note">
        <span>검수 의견</span>
        <textarea placeholder="수정 요청 또는 판정 근거를 입력하세요." rows={4} />
      </label>
      <div className="fuma-text-review-final__actions">
        <Button disabled={!canSave} variant="primary">검수 결과 저장</Button>
      </div>
    </section>
  );
}

function ContentReviewDetailContent({ content }: { content: ContentReviewFixture }) {
  return (
    <div className="fuma-detail-panel__content fuma-text-review-detail">
      <aside className="fuma-text-review-rail">
        <ReviewCaseHeader content={content} />
        <FinalReviewPanel content={content} key={content.id} />
      </aside>
      <main className="fuma-text-review-workspace">
        <OriginalContent content={content} />
        <TextEvidenceReview content={content} />
        <TextAnalysisReport content={content} />
        <ReviewHistory content={content} />
      </main>
    </div>
  );
}

export function ContentReviewDetailPage() {
  const { contentId } = useParams();
  const content = findContentReviewFixture(contentId);

  return (
    <section className="fuma-page fuma-content-review-detail" data-visual-contract="content-review">
      <PageHeader screenCode="CT102" title="콘텐츠 검수 상세" />
      <div className="fuma-page__body">
        {content ? (
          <>
            <div className="fuma-detail-toolbar">
              <Link className="hsas-button fuma-detail-toolbar__link" to="/content/reviews">
                <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.8} />
                대기열
              </Link>
            </div>
            <ContentReviewDetailContent content={content} />
          </>
        ) : (
          <EmptyState
            description="요청한 콘텐츠 검수 정보를 확인해 주세요."
            title="대상을 찾을 수 없습니다."
          />
        )}
      </div>
    </section>
  );
}
