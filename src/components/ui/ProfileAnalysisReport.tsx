import { Images, Play, Siren } from "lucide-react";
import type { AnalysisBarDatum } from "../charts/AnalysisBarRows";
import { AnalysisBarRows } from "../charts/AnalysisBarRows";
import type { AnalysisFormatSegment } from "../charts/AnalysisFormatDonut";
import { AnalysisFormatBreakdown } from "../charts/AnalysisFormatBreakdown";

export interface ProfileAnalysisMetric {
  label: string;
  percentile: number | null;
  value: string;
}

export interface ProfileAnalysisContentMetric {
  label: string;
  value: string;
}

export interface ProfileAnalysisNarrative {
  label: string;
  values: readonly string[];
}

export interface ProfileAnalysisTagGroup {
  label: string;
  values: readonly string[];
}

export interface ProfileAnalysisRepresentativeContent {
  basisBars: readonly AnalysisBarDatum[];
  basisInsight: string | null;
  category: string | null;
  contentTypeLabel: string;
  isVideo: boolean;
  keywords: readonly string[];
  layout: "portrait" | "landscape";
  mediaAlt: string;
  mediaUrl: string | null;
  url: string;
  viewCountLabel: string | null;
}

interface ProfileAnalysisReportProps {
  collectedAt: string;
  collectionDays: number;
  comparisonLabel: string;
  contentMetrics: readonly ProfileAnalysisContentMetric[];
  engagementFunnel?: readonly AnalysisBarDatum[];
  engagementMetrics: readonly ProfileAnalysisMetric[];
  eyebrow: string;
  formatSegments: readonly AnalysisFormatSegment[];
  formatTotal: number | null;
  formatTotalLabel?: string;
  narratives: readonly ProfileAnalysisNarrative[];
  qualitativeStatus?: string | null;
  representativeContent?: ProfileAnalysisRepresentativeContent | null;
  summary: string;
  tagGroups: readonly ProfileAnalysisTagGroup[];
  title: string;
}

function hasRiskFactor(values: readonly string[]) {
  const joined = values.join(" ");
  return !["미확인", "없음", "해당 없음", "발견되지 않"].some((phrase) => joined.includes(phrase));
}

export function ProfileAnalysisReport({
  collectedAt,
  collectionDays,
  comparisonLabel,
  contentMetrics,
  engagementFunnel,
  engagementMetrics,
  eyebrow,
  formatSegments,
  formatTotal,
  formatTotalLabel,
  narratives,
  qualitativeStatus,
  representativeContent,
  summary,
  tagGroups,
  title,
}: ProfileAnalysisReportProps) {
  return (
    <section aria-label={title} className="fuma-creator-analysis-report" id="analysis">
      <header className="fuma-content-section__header">
        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </header>

      <div className="fuma-creator-analysis-report__content">
        <section aria-label="리포트 요약" className="fuma-creator-analysis-overview">
          <div>
            <span>분석 요약</span>
            <p>{summary}</p>
          </div>
        </section>

        {representativeContent ? (
          <section aria-label="대표 콘텐츠" className="fuma-creator-analysis-block fuma-representative-card-wrap">
            <div className="fuma-creator-analysis-block__heading">
              <h3>대표 콘텐츠</h3>
              <span>AI가 선정한 대표 콘텐츠와 선정 근거</span>
            </div>
            <div className="fuma-representative-card" data-layout={representativeContent.layout}>
              <div className="fuma-representative-card__media">
                {representativeContent.mediaUrl ? (
                  <img alt={representativeContent.mediaAlt} src={representativeContent.mediaUrl} />
                ) : (
                  <span className="fuma-representative-card__media-empty">
                    <Images aria-hidden="true" size={26} />
                  </span>
                )}
                {representativeContent.isVideo ? (
                  <span className="fuma-representative-card__play">
                    <Play aria-hidden="true" fill="currentColor" size={16} />
                  </span>
                ) : null}
                <span className="fuma-representative-card__format-badge">
                  {representativeContent.contentTypeLabel}
                </span>
              </div>
              <div className="fuma-representative-card__info">
                <div className="fuma-representative-card__badges">
                  {representativeContent.category ? (
                    <span className="fuma-analysis-tags__tag fuma-analysis-tags__tag--keyword">
                      {representativeContent.category}
                    </span>
                  ) : null}
                  {representativeContent.basisBars.length === 0 && representativeContent.viewCountLabel ? (
                    <strong className="fuma-representative-card__views">
                      {representativeContent.viewCountLabel}
                    </strong>
                  ) : null}
                </div>
                {representativeContent.basisBars.length > 0 ? (
                  <div className="fuma-representative-basis">
                    <span className="fuma-representative-basis__label">선정 근거 · 조회수 비교</span>
                    <AnalysisBarRows ariaLabel="대표 콘텐츠 조회수 비교" bars={representativeContent.basisBars} />
                    {representativeContent.basisInsight ? (
                      <p className="fuma-representative-basis__insight">{representativeContent.basisInsight}</p>
                    ) : null}
                  </div>
                ) : null}
                {representativeContent.keywords.length > 0 ? (
                  <ul className="fuma-analysis-tags__list fuma-representative-card__keywords">
                    {representativeContent.keywords.map((keyword) => (
                      <li className="fuma-analysis-tags__tag fuma-analysis-tags__tag--keyword" key={keyword}>
                        {keyword}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <a
                  className="fuma-representative-card__cta"
                  href={representativeContent.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  원본에서 확인하기 ↗
                </a>
              </div>
            </div>
          </section>
        ) : null}

        <section aria-label="정량 분석" className="fuma-creator-analysis-block">
          <div className="fuma-creator-analysis-block__heading">
            <h3>정량 분석</h3>
            <span>수집 시각 {collectedAt}</span>
          </div>
          <div className="fuma-creator-analysis-metrics">
            <section className="fuma-creator-metric-group fuma-creator-metric-group--performance fuma-analysis-engagement">
              <header className="fuma-analysis-engagement__header">
                <div><strong>인게이지먼트</strong><span>최근 {collectionDays}일 수집 콘텐츠 기준</span></div>
              </header>
              <div className="fuma-analysis-engagement__grid">
                {engagementMetrics.map((metric) => (
                  <article className="fuma-analysis-engagement__card" key={metric.label}>
                    <span>{metric.label}</span>
                    <strong className={metric.label === "ER" ? "fuma-analysis-engagement__er" : undefined}>{metric.value}</strong>
                    {metric.percentile !== null ? (
                      <small className={`fuma-analysis-engagement__percentile${comparisonLabel === "지원자 중" ? " fuma-analysis-engagement__percentile--applicant" : ""}`}>
                        {comparisonLabel} 상위 {metric.percentile}%
                      </small>
                    ) : null}
                  </article>
                ))}
                {engagementFunnel && engagementFunnel.length > 0 ? (
                  <article className="fuma-analysis-engagement__card fuma-analysis-engagement__card--funnel">
                    <span>콘텐츠당 평균 반응 (수집 완료된 지원자 중 순위)</span>
                    <AnalysisBarRows ariaLabel="콘텐츠당 평균 조회·좋아요·댓글, 지원자 중 순위" bars={engagementFunnel} max={100} />
                  </article>
                ) : null}
              </div>
            </section>

            <section className="fuma-creator-metric-group fuma-analysis-content">
              <header className="fuma-analysis-content__header">
                <div><strong>콘텐츠</strong><span>최근 {collectionDays}일 수집 콘텐츠 기준</span></div>
              </header>
              <div className="fuma-analysis-content__grid">
                {contentMetrics.map((metric) => (
                  <article className="fuma-analysis-content__card" key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </article>
                ))}
                <article className="fuma-analysis-content__card fuma-analysis-content__card--formats">
                  <span>콘텐츠 형식</span>
                  <AnalysisFormatBreakdown
                    segments={formatSegments}
                    total={formatTotal}
                    totalLabel={formatTotalLabel}
                  />
                </article>
              </div>
            </section>
          </div>
        </section>

        <section aria-label="AI 정성 분석" className="fuma-creator-analysis-block fuma-analysis-qualitative">
          <h3>AI 정성 분석</h3>
          {qualitativeStatus ? (
            <div className="fuma-analysis-qualitative__status" role="status">
              <span className="fuma-analysis-qualitative__status-dot" aria-hidden="true" />
              <span>{qualitativeStatus}</span>
            </div>
          ) : (
          <>
          <dl className="fuma-creator-analysis-claims fuma-analysis-qualitative__narrative-list">
            {narratives.map((claim) => (
              <div
                className={`fuma-creator-analysis-claim${claim.label === "강점" || claim.label === "유의점" ? " fuma-creator-analysis-claim--plain" : ""}${claim.label === "위험 요소" && hasRiskFactor(claim.values) ? " fuma-creator-analysis-claim--risk" : ""}`}
                key={claim.label}
              >
                <dt>
                  {claim.label === "위험 요소" ? (
                    <span className="fuma-analysis-risk-label" data-risk={hasRiskFactor(claim.values) ? "true" : "false"}>
                      <Siren aria-hidden="true" size={16} strokeWidth={2} />
                      <span>{claim.label}</span>
                    </span>
                  ) : <span>{claim.label}</span>}
                </dt>
                <dd>
                  {claim.values.length > 1 ? (
                    <ul className="fuma-creator-analysis-claim__list">
                      {claim.values.map((value) => <li key={value}>{value}</li>)}
                    </ul>
                  ) : claim.values[0]}
                </dd>
              </div>
            ))}
          </dl>
          <div className="fuma-analysis-tags">
            {tagGroups.map((group) => (
              <section aria-label={`${group.label} 태그`} className="fuma-analysis-tags__group" key={group.label}>
                <header><strong>{group.label}</strong></header>
                <ul className="fuma-analysis-tags__list">
                  {group.values.length > 0
                    ? group.values.map((value) => (
                      <li className={`fuma-analysis-tags__tag${group.label === "키워드" || group.label === "카테고리" ? " fuma-analysis-tags__tag--keyword" : ""}`} key={value}>
                        {value}
                      </li>
                    ))
                    : <li className="fuma-analysis-tags__empty">수집된 태그 없음</li>}
                </ul>
              </section>
            ))}
          </div>
          </>
          )}
        </section>
      </div>
    </section>
  );
}
