import { StatusPill } from "../../components/ui/StatusPill";
import { PlatformIcon } from "../creators/PlatformIcon";
import {
  applicantAnalysisFor,
  applicantFeaturedContentFor,
  applicantProfileUrl,
  type ApplicantFixture,
} from "./fixtures";

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function FeaturedContents({ applicant }: { applicant: ApplicantFixture }) {
  const contents = applicantFeaturedContentFor(applicant);

  return (
    <section aria-labelledby="applicant-featured-content-title" className="fuma-content-section fuma-applicant-featured" id="featured-content">
      <header className="fuma-content-section__header">
        <div>
          <h2 id="applicant-featured-content-title">대표 콘텐츠</h2>
          <span>최근 90일 반응 상위 콘텐츠 · 클릭 시 원문으로 이동</span>
        </div>
      </header>
      <div className="fuma-applicant-featured-content">
        {contents.map((content, index) => (
          <a
            className="fuma-applicant-featured-content__item"
            href={content.url}
            key={content.id}
            rel="noreferrer"
            target="_blank"
          >
            <img alt={`${applicant.name} 대표 콘텐츠: ${content.title}`} src={content.thumbnailUrl} />
            <span className="fuma-applicant-featured-content__rank">TOP {index + 1}</span>
            <span className="fuma-applicant-featured-content__type">{content.mediaType}</span>
            <div className="fuma-applicant-featured-content__body">
              <strong>{content.title}</strong>
              <dl aria-label={`${content.title} 반응 지표`}>
                <div><dt>조회</dt><dd>{formatNumber(content.views)}</dd></div>
                <div><dt>좋아요</dt><dd>{formatNumber(content.likes)}</dd></div>
                <div><dt>댓글</dt><dd>{formatNumber(content.comments)}</dd></div>
              </dl>
              <span className="fuma-applicant-featured-content__link">원문 보기 <span aria-hidden="true">↗</span></span>
            </div>
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
  const audiencePasses = applicant.followerCount >= 500;
  const contentPasses = analysis.recent90ContentCount >= 3;
  const passes = audiencePasses && contentPasses;

  return (
    <section aria-labelledby="automatic-review-title" className={`fuma-applicant-auto-review fuma-applicant-auto-review--${passes ? "pass" : "fail"}`} id="screening">
      <div className="fuma-applicant-auto-review__verdict">
        <span className="fuma-applicant-auto-review__label">AUTOMATIC SCREENING</span>
        <div>
          <StatusPill tone={passes ? "approved" : "rejected"}>{passes ? "최소 요건 통과" : "자동 반려 대상"}</StatusPill>
          <h2 id="automatic-review-title">{applicant.platform} 자동 심사</h2>
        </div>
        <p>{audienceLabel} 500명 이상 및 최근 90일 {contentLabel} 3개 이상</p>
      </div>
      <dl className="fuma-applicant-auto-review__checks">
        <div>
          <dt>{audienceLabel}</dt>
          <dd>{formatNumber(applicant.followerCount)}명</dd>
          <span className={audiencePasses ? "is-pass" : "is-fail"}>{audiencePasses ? "기준 충족" : "기준 미달"}</span>
        </div>
        <div>
          <dt>최근 90일 {contentLabel}</dt>
          <dd>{analysis.recent90ContentCount}개</dd>
          <span className={contentPasses ? "is-pass" : "is-fail"}>{contentPasses ? "기준 충족" : "기준 미달"}</span>
        </div>
      </dl>
    </section>
  );
}

function Metric({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="fuma-applicant-analysis__metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
      <span>{meta}</span>
    </div>
  );
}

function Insight({ children, className = "", label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <div className={`fuma-applicant-insight ${className}`.trim()}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function ApplicantAnalysisReport({ applicant }: { applicant: ApplicantFixture }) {
  const analysis = applicantAnalysisFor(applicant);
  const featuredContents = applicantFeaturedContentFor(applicant);
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
          <div className="fuma-applicant-analysis__section-title">
            <span>01</span>
            <div><h3 id="applicant-quantitative-title">정량적 지표</h3><p>활동성과 콘텐츠 반응을 한눈에 비교합니다.</p></div>
          </div>
          <dl className="fuma-applicant-analysis__metric-grid">
            <Metric label={audienceLabel} value={formatNumber(applicant.followerCount)} meta={`${applicant.platform} 공개 계정`} />
            <Metric label="최근 90일 콘텐츠" value={`${analysis.recent90ContentCount}건`} meta={`전체 공개 ${formatNumber(applicant.contentCount)}건`} />
            <Metric label="업로드 주기" value={`주 ${analysis.uploadFrequency.toFixed(1)}회`} meta={`최대 공백 ${analysis.maxGapDays}일`} />
            <Metric label="ER (Engagement Rate)" value={`${analysis.engagementRate.toFixed(1)}%`} meta={`반응 ÷ ${audienceLabel}`} />
          </dl>
          <dl className="fuma-applicant-analysis__detail-grid">
            <div><dt>SNS 계정</dt><dd><a href={applicantProfileUrl(applicant)} rel="noreferrer" target="_blank"><PlatformIcon decorative platform={applicant.platform} /> {applicant.channelName} <span aria-hidden="true">↗</span></a></dd></div>
            <div><dt>마지막 게시일</dt><dd>{analysis.lastPostDate}</dd></div>
            <div><dt>평균 반응</dt><dd>조회 {formatNumber(applicant.averageViews)} · 좋아요 {formatNumber(analysis.averageLikes)} · 댓글 {formatNumber(analysis.averageComments)}</dd></div>
            <div><dt>콘텐츠 형식 통계</dt><dd>{analysis.contentFormats.map((item) => `${item.label} ${item.count}건`).join(" · ")}</dd></div>
          </dl>
          <p className="fuma-applicant-analysis__formula">ER = (좋아요 + 댓글 + 공유) ÷ {audienceLabel} × 100</p>
        </section>

        <section aria-labelledby="applicant-qualitative-title" className="fuma-applicant-analysis__section">
          <div className="fuma-applicant-analysis__section-title">
            <span>02</span>
            <div><h3 id="applicant-qualitative-title">정성적 지표 · AI 분석</h3><p>콘텐츠 이미지·음성·문맥을 함께 분석한 결과입니다.</p></div>
          </div>
          <dl className="fuma-applicant-insight-grid">
            <Insight className="fuma-applicant-insight--summary" label="한 줄 요약">{analysis.summary}</Insight>
            <Insight label="카테고리"><div className="fuma-applicant-analysis__chips">{analysis.categories.map((category) => <span key={category}>{category}</span>)}</div></Insight>
            <Insight label="핵심 키워드"><div className="fuma-applicant-analysis__keywords">{analysis.keywords.map((keyword) => <span key={keyword.label}><strong>#{keyword.label}</strong><small>{keyword.percentage}%</small></span>)}</div></Insight>
            <Insight label="콘텐츠 스타일">{analysis.contentStyle}</Insight>
            <Insight label="톤앤매너">{analysis.toneAndManner}</Insight>
            <Insight label="협업 브랜드">{analysis.collaborationBrands.length > 0 ? `${analysis.collaborationBrands.join(" · ")} (최근 90일 ${analysis.collaborationBrands.length}개 브랜드)` : "최근 90일 확인된 협업 브랜드 없음"}</Insight>
            <Insight className="fuma-applicant-insight--risk" label="위험 요소">{analysis.riskFactors}</Insight>
            <Insight className="fuma-applicant-insight--wide" label="강점/유의점">{analysis.strengthsAndNotes}</Insight>
          </dl>
          <div className="fuma-applicant-analysis__evidence-note">
            <strong>AI 판단 근거</strong>
            <p>AI 판단은 아래 원문과 최근 90일 수집 콘텐츠를 근거로 합니다.</p>
            <div>{featuredContents.map((content, index) => <a href={content.url} key={content.id} rel="noreferrer" target="_blank">근거 {index + 1}. {content.title} <span aria-hidden="true">↗</span></a>)}</div>
          </div>
        </section>
      </section>
    </>
  );
}
