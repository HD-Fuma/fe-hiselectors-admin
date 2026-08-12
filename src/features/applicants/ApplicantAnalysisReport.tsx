import { Siren } from "lucide-react";
import { StatusPill } from "../../components/ui/StatusPill";
import { formatNumber } from "../../lib/formatters";
import { AnalysisFormatDonut } from "../creators/AnalysisFormatDonut";
import {
  APPLICANTS,
  applicantAnalysisFor,
  applicantFeaturedContentFor,
  type ApplicantFixture,
} from "./fixtures";

function topPercentile(value: number, pool: readonly number[]) {
  if (pool.length === 0) return null;
  const rank = pool.filter((candidate) => candidate > value).length + 1;
  return Math.max(1, Math.ceil((rank / pool.length) * 100));
}

export function ApplicantFeaturedContents({ applicant }: { applicant: ApplicantFixture }) {
  const contents = applicantFeaturedContentFor(applicant);

  return (
    <section aria-labelledby="applicant-featured-content-title" className="fuma-content-section fuma-detail-featured" id="featured-content">
      <header className="fuma-content-section__header">
        <div>
          <h2 id="applicant-featured-content-title">대표 콘텐츠</h2>
          <span>최근 90일 반응 상위 콘텐츠 · 클릭 시 원문으로 이동</span>
        </div>
      </header>
      <div className="fuma-detail-featured__grid">
        {contents.map((content, index) => (
          <a
            className="fuma-detail-featured__post"
            href={content.url}
            key={content.id}
            rel="noreferrer"
            target="_blank"
          >
            <div className="fuma-detail-featured__image">
              <img alt={`${applicant.name} 대표 콘텐츠: ${content.title}`} src={content.thumbnailUrl} />
              <span>{index + 1}</span>
              {content.mediaType === "동영상" ? <b aria-label="동영상">▶</b> : null}
            </div>
            <div className="fuma-detail-featured__copy">
              <div><strong>{content.title}</strong><span>{content.mediaType}</span></div>
              <dl aria-label={`${content.title} 반응 지표`} className="fuma-detail-featured__metrics">
                <div><dt>조회</dt><dd>{formatNumber(content.views)}</dd></div>
                <div><dt>좋아요</dt><dd>{formatNumber(content.likes)}</dd></div>
                <div><dt>댓글</dt><dd>{formatNumber(content.comments)}</dd></div>
                <div><dt>반응률</dt><dd>{(((content.likes + content.comments) / applicant.followerCount) * 100).toFixed(1)}%</dd></div>
              </dl>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function ApplicantAutomaticReview({ applicant }: { applicant: ApplicantFixture }) {
  const analysis = applicantAnalysisFor(applicant);
  const audienceLabel = applicant.platform === "Instagram" ? "팔로워" : "구독자";
  const contentLabel = applicant.platform === "Instagram" ? "공개 게시물" : "공개 동영상";
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

function Insight({
  children,
  className = "",
  label,
  risk = false,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
  risk?: boolean;
}) {
  return (
    <div className={`fuma-applicant-insight ${className}`.trim()}>
      <dt className={label === "위험 요소" ? "fuma-analysis-risk-label" : undefined} data-risk={label === "위험 요소" ? String(risk) : undefined}>
        {label === "위험 요소" ? <Siren aria-hidden="true" size={16} strokeWidth={2} /> : null}
        <span>{label}</span>
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function hasRiskFactor(value: string) {
  return !["미확인", "없음", "해당 없음", "발견되지 않"].some((phrase) => value.includes(phrase));
}

export function ApplicantAnalysisReport({ applicant }: { applicant: ApplicantFixture }) {
  const analysis = applicantAnalysisFor(applicant);
  const poolAnalyses = APPLICANTS.map((candidate) => applicantAnalysisFor(candidate));
  const poolPercentiles = {
    audience: topPercentile(applicant.followerCount, APPLICANTS.map((candidate) => candidate.followerCount)),
    views: topPercentile(applicant.averageViews, APPLICANTS.map((candidate) => candidate.averageViews)),
    likes: topPercentile(analysis.averageLikes, poolAnalyses.map((candidate) => candidate.averageLikes)),
    comments: topPercentile(analysis.averageComments, poolAnalyses.map((candidate) => candidate.averageComments)),
    engagement: topPercentile(analysis.engagementRate, poolAnalyses.map((candidate) => candidate.engagementRate)),
  };
  const audienceLabel = applicant.platform === "Instagram" ? "팔로워" : "구독자";
  const formatTotal = analysis.contentFormats.reduce((total, format) => total + format.count, 0);
  const formatColors = ["#de76ce", "#efaa62", "#7b91e3", "#62b7a6", "#9a83d3"];
  const formatBreakdown = analysis.contentFormats.reduce<Array<{
    color: string;
    count: number;
    end: number;
    label: string;
    percentage: number;
    start: number;
  }>>((formats, format, index) => {
    const start = formats.length > 0 ? formats[formats.length - 1].end : 0;
    const percentage = formatTotal > 0 ? (format.count / formatTotal) * 100 : 0;

    formats.push({
      color: formatColors[index % formatColors.length],
      count: format.count,
      end: start + percentage,
      label: format.label,
      percentage,
      start,
    });

    return formats;
  }, []);

  return (
    <section aria-labelledby="applicant-analysis-title" className="fuma-content-section fuma-applicant-analysis" id="analysis">
        <header className="fuma-content-section__header">
          <div>
            <h2 id="applicant-analysis-title">지원자 분석 리포트</h2>
          </div>
          <StatusPill tone="approved">AI 분석 완료</StatusPill>
        </header>
        <p className="fuma-analysis-summary">{analysis.summary}</p>

        <section aria-labelledby="applicant-quantitative-title" className="fuma-applicant-analysis__section">
          <div className="fuma-applicant-analysis__section-title">
            <span>01</span>
            <div><h3 id="applicant-quantitative-title">정량적 지표</h3><p>활동성과 콘텐츠 반응을 한눈에 비교합니다.</p></div>
          </div>
          <section aria-label="콘텐츠" className="fuma-analysis-content">
            <header className="fuma-analysis-content__header">
              <div>
                <strong>콘텐츠</strong>
                <span>최근 90일 수집 콘텐츠 기준</span>
              </div>
            </header>
            <div className="fuma-analysis-content__grid">
              <article className="fuma-analysis-content__card">
                <span>콘텐츠 수</span>
                <strong>{formatNumber(applicant.contentCount)}건</strong>
              </article>
              <article className="fuma-analysis-content__card">
                <span>최근 90일 콘텐츠</span>
                <strong>{analysis.recent90ContentCount}건</strong>
              </article>
              <article className="fuma-analysis-content__card">
                <span>업로드 주기</span>
                <strong>주 {analysis.uploadFrequency.toFixed(1)}회</strong>
              </article>
              <article className="fuma-analysis-content__card">
                <span>마지막 게시일</span>
                <strong>{analysis.lastPostDate}</strong>
              </article>
              <article className="fuma-analysis-content__card fuma-analysis-content__card--formats">
                <span>콘텐츠 형식</span>
                <div className="fuma-analysis-format-breakdown">
                  <AnalysisFormatDonut segments={formatBreakdown} total={formatTotal} />
                  <ul className="fuma-analysis-format-breakdown__legend">
                    {formatBreakdown.map((format) => (
                      <li key={format.label}>
                        <i aria-hidden="true" style={{ backgroundColor: format.color }} />
                        <span>{format.label}</span>
                        <strong>{format.count}건 <small>{format.percentage.toFixed(1)}%</small></strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </div>
          </section>
          <section aria-label="인게이지먼트" className="fuma-analysis-engagement">
            <header className="fuma-analysis-engagement__header">
              <div>
                <strong>인게이지먼트</strong>
                <span>최근 90일 수집 콘텐츠 기준</span>
              </div>
            </header>
            <div className="fuma-analysis-engagement__grid">
              <article className="fuma-analysis-engagement__card">
                <span>팔로워/구독자</span>
                <strong>{formatNumber(applicant.followerCount)}명</strong>
                <small className="fuma-analysis-engagement__percentile fuma-analysis-engagement__percentile--applicant">지원자 중 상위 {poolPercentiles.audience}%</small>
              </article>
              <article className="fuma-analysis-engagement__card">
                <span>평균 조회</span>
                <strong>{formatNumber(applicant.averageViews)}</strong>
                <small className="fuma-analysis-engagement__percentile fuma-analysis-engagement__percentile--applicant">지원자 중 상위 {poolPercentiles.views}%</small>
              </article>
              <article className="fuma-analysis-engagement__card">
                <span>평균 좋아요</span>
                <strong>{formatNumber(analysis.averageLikes)}</strong>
                <small className="fuma-analysis-engagement__percentile fuma-analysis-engagement__percentile--applicant">지원자 중 상위 {poolPercentiles.likes}%</small>
              </article>
              <article className="fuma-analysis-engagement__card">
                <span>평균 댓글</span>
                <strong>{formatNumber(analysis.averageComments)}</strong>
                <small className="fuma-analysis-engagement__percentile fuma-analysis-engagement__percentile--applicant">지원자 중 상위 {poolPercentiles.comments}%</small>
              </article>
              <article className="fuma-analysis-engagement__card">
                <span>ER</span>
                <strong className="fuma-analysis-engagement__er">{analysis.engagementRate.toFixed(1)}%</strong>
                <small className="fuma-analysis-engagement__percentile fuma-analysis-engagement__percentile--applicant">지원자 중 상위 {poolPercentiles.engagement}%</small>
              </article>
            </div>
          </section>
          <p className="fuma-applicant-analysis__formula">ER = (좋아요 + 댓글 + 공유) ÷ {audienceLabel} × 100</p>
        </section>

        <section aria-labelledby="applicant-qualitative-title" className="fuma-applicant-analysis__section fuma-analysis-qualitative">
          <div className="fuma-applicant-analysis__section-title">
            <span>02</span>
            <div><h3 id="applicant-qualitative-title">정성적 지표 · AI 분석</h3><p>콘텐츠 이미지·음성·문맥을 함께 분석한 결과입니다.</p></div>
          </div>
          <dl className="fuma-applicant-insight-grid">
            <Insight
              className={`fuma-applicant-insight--wide${hasRiskFactor(analysis.riskFactors) ? " fuma-applicant-insight--risk" : ""}`}
              label="위험 요소"
              risk={hasRiskFactor(analysis.riskFactors)}
            >
              {analysis.riskFactors}
            </Insight>
            <Insight className="fuma-applicant-insight--plain" label="강점">{analysis.strengths}</Insight>
            <Insight className="fuma-applicant-insight--plain" label="유의점">{analysis.cautions}</Insight>
          </dl>
          <dl aria-label="분석 태그" className="fuma-analysis-tags">
            <div className="fuma-analysis-tags__group">
              <dt>카테고리</dt>
              <dd className="fuma-analysis-tags__list"><span className="fuma-analysis-tags__tag fuma-analysis-tags__tag--keyword">{analysis.category}</span></dd>
            </div>
            <div className="fuma-analysis-tags__group">
              <dt>핵심 키워드</dt>
              <dd className="fuma-analysis-tags__list">
                {analysis.keywords.map((keyword) => <span className="fuma-analysis-tags__tag fuma-analysis-tags__tag--keyword" key={keyword.label}><strong>#{keyword.label}</strong><small>{keyword.percentage}%</small></span>)}
              </dd>
            </div>
            <div className="fuma-analysis-tags__group">
              <dt>협업 이력</dt>
              <dd className="fuma-analysis-tags__list">
                {analysis.collaborationBrands.length > 0
                  ? analysis.collaborationBrands.map((brand) => <span className="fuma-analysis-tags__tag" key={brand}>{brand}</span>)
                  : <span className="fuma-analysis-tags__empty">확인된 협업 브랜드 없음</span>}
              </dd>
            </div>
            <div className="fuma-analysis-tags__group">
              <dt>콘텐츠 유형</dt>
              <dd className="fuma-analysis-tags__list">{analysis.contentStyle.split(" · ").map((style) => <span className="fuma-analysis-tags__tag" key={style}>{style}</span>)}</dd>
            </div>
            <div className="fuma-analysis-tags__group">
              <dt>톤앤매너</dt>
              <dd className="fuma-analysis-tags__list">{analysis.toneAndManner.split(" · ").map((tone) => <span className="fuma-analysis-tags__tag" key={tone}>{tone}</span>)}</dd>
            </div>
          </dl>
        </section>
    </section>
  );
}
