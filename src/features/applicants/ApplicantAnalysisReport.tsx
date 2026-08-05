import { StatusPill } from "../../components/ui/StatusPill";
import {
  applicantAnalysisFor,
  applicantFeaturedContentFor,
  applicantProfileUrl,
  type ApplicantFixture,
} from "./fixtures";

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="fuma-key-value-grid__item">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function FeaturedContents({ applicant }: { applicant: ApplicantFixture }) {
  const contents = applicantFeaturedContentFor(applicant);

  return (
    <section aria-labelledby="applicant-featured-content-title" className="fuma-content-section" id="featured-content">
      <header className="fuma-content-section__header">
        <h2 id="applicant-featured-content-title">대표 콘텐츠</h2>
        <span>최근 90일 반응 기준</span>
      </header>
      <div className="fuma-applicant-featured-content">
        {contents.map((content) => (
          <a
            className="fuma-applicant-featured-content__item"
            href={content.url}
            key={content.id}
            rel="noreferrer"
            target="_blank"
          >
            <img alt={`${applicant.name} 대표 콘텐츠: ${content.title}`} src={content.thumbnailUrl} />
            <span className="fuma-applicant-featured-content__type">{content.mediaType}</span>
            <strong>{content.title}</strong>
            <span className="fuma-applicant-featured-content__link">원문 보기 ↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function AutomaticReview({ applicant }: { applicant: ApplicantFixture }) {
  const analysis = applicantAnalysisFor(applicant);
  const audienceLabel = applicant.platform === "Instagram" ? "팔로워" : "구독자";
  const contentLabel = applicant.platform === "Instagram" ? "공개 게시물" : "공개 영상";
  const passes = applicant.followerCount >= 500 && analysis.recent90ContentCount >= 3;

  return (
    <section aria-labelledby="automatic-review-title" className="fuma-applicant-auto-review" id="screening">
      <div>
        <span>자동 반려 기준</span>
        <h2 id="automatic-review-title">{applicant.platform} 최소 요건</h2>
        <p>{audienceLabel} 500명 이상 · 최근 90일 {contentLabel} 3개 이상</p>
      </div>
      <dl>
        <div>
          <dt>{audienceLabel}</dt>
          <dd>{formatNumber(applicant.followerCount)}명</dd>
        </div>
        <div>
          <dt>최근 90일 {contentLabel}</dt>
          <dd>{analysis.recent90ContentCount}개</dd>
        </div>
        <div>
          <dt>자동 판정</dt>
          <dd><StatusPill tone={passes ? "approved" : "rejected"}>{passes ? "통과" : "자동 반려"}</StatusPill></dd>
        </div>
      </dl>
    </section>
  );
}

export function ApplicantAnalysisReport({ applicant }: { applicant: ApplicantFixture }) {
  const analysis = applicantAnalysisFor(applicant);
  const audienceLabel = applicant.platform === "Instagram" ? "팔로워" : "구독자";

  return (
    <>
      <AutomaticReview applicant={applicant} />
      <FeaturedContents applicant={applicant} />
      <section aria-labelledby="applicant-analysis-title" className="fuma-content-section fuma-applicant-analysis" id="analysis">
        <header className="fuma-content-section__header">
          <div>
            <h2 id="applicant-analysis-title">지원자 분석 리포트</h2>
            <span>최종 업데이트 {analysis.updatedAt} · 최근 90일 수집 데이터</span>
          </div>
          <StatusPill tone="approved">AI 분석 완료</StatusPill>
        </header>

        <section aria-labelledby="applicant-quantitative-title" className="fuma-applicant-analysis__section">
          <h3 id="applicant-quantitative-title">정량적 지표</h3>
          <dl className="fuma-key-value-grid">
            <Field label="SNS 계정 기본정보">
              <a href={applicantProfileUrl(applicant)} rel="noreferrer" target="_blank">
                {applicant.platform} · {applicant.channelName} ↗
              </a>
            </Field>
            <Field label={audienceLabel}>{formatNumber(applicant.followerCount)}</Field>
            <Field label="업로드 주기">주 {analysis.uploadFrequency.toFixed(1)}회 · 공백 최대 {analysis.maxGapDays}일</Field>
            <Field label="콘텐츠 수">공개 {formatNumber(applicant.contentCount)}건 · 최근 90일 {analysis.recent90ContentCount}건</Field>
            <Field label="마지막 게시일">{analysis.lastPostDate}</Field>
            <Field label="평균 조회·좋아요·댓글">조회 {formatNumber(applicant.averageViews)} · 좋아요 {formatNumber(analysis.averageLikes)} · 댓글 {formatNumber(analysis.averageComments)}</Field>
            <Field label="콘텐츠 형식 통계">{analysis.contentFormats.map((item) => `${item.label} ${item.count}건`).join(" · ")}</Field>
            <Field label="ER (Engagement Rate)">{analysis.engagementRate.toFixed(1)}% · (좋아요 + 댓글 + 공유) ÷ {audienceLabel} × 100</Field>
          </dl>
        </section>

        <section aria-labelledby="applicant-qualitative-title" className="fuma-applicant-analysis__section">
          <h3 id="applicant-qualitative-title">정성적 지표 · AI 분석</h3>
          <dl className="fuma-key-value-grid">
            <Field label="요약">{analysis.summary}</Field>
            <Field label="카테고리">{analysis.categories.join(" · ")}</Field>
            <Field label="키워드">{analysis.keywords.map((keyword) => `#${keyword.label} ${keyword.percentage}%`).join(" · ")}</Field>
            <Field label="협업 브랜드">{analysis.collaborationBrands.length > 0 ? analysis.collaborationBrands.join(" · ") : "최근 90일 확인된 협업 브랜드 없음"}</Field>
            <Field label="콘텐츠 스타일">{analysis.contentStyle}</Field>
            <Field label="톤앤매너">{analysis.toneAndManner}</Field>
            <Field label="위험 요소">{analysis.riskFactors}</Field>
            <Field label="강점/유의점">{analysis.strengthsAndNotes}</Field>
          </dl>
          <p className="fuma-applicant-analysis__evidence-note">AI 판단 근거는 위 대표 콘텐츠의 원문 링크와 최근 90일 수집 콘텐츠에서 확인할 수 있습니다.</p>
        </section>
      </section>
    </>
  );
}
