import { Siren } from "lucide-react";
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
  value: string;
}

export interface ProfileAnalysisTagGroup {
  label: string;
  values: readonly string[];
}

interface ProfileAnalysisReportProps {
  collectedAt: string;
  collectionDays: number;
  comparisonLabel: string;
  contentMetrics: readonly ProfileAnalysisContentMetric[];
  engagementMetrics: readonly ProfileAnalysisMetric[];
  eyebrow: string;
  formatSegments: readonly AnalysisFormatSegment[];
  formatTotal: number;
  narratives: readonly ProfileAnalysisNarrative[];
  summary: string;
  tagGroups: readonly ProfileAnalysisTagGroup[];
  title: string;
}

function hasRiskFactor(value: string) {
  return !["미확인", "없음", "해당 없음", "발견되지 않"].some((phrase) => value.includes(phrase));
}

export function ProfileAnalysisReport({
  collectedAt,
  collectionDays,
  comparisonLabel,
  contentMetrics,
  engagementMetrics,
  eyebrow,
  formatSegments,
  formatTotal,
  narratives,
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
                  <AnalysisFormatBreakdown segments={formatSegments} total={formatTotal} />
                </article>
              </div>
            </section>
          </div>
        </section>

        <section aria-label="AI 정성 분석" className="fuma-creator-analysis-block fuma-analysis-qualitative">
          <h3>AI 정성 분석</h3>
          <dl className="fuma-creator-analysis-claims fuma-analysis-qualitative__narrative-list">
            {narratives.map((claim) => (
              <div
                className={`fuma-creator-analysis-claim${claim.label === "강점" || claim.label === "유의점" ? " fuma-creator-analysis-claim--plain" : ""}${claim.label === "위험 요소" && hasRiskFactor(claim.value) ? " fuma-creator-analysis-claim--risk" : ""}`}
                key={claim.label}
              >
                <dt>
                  {claim.label === "위험 요소" ? (
                    <span className="fuma-analysis-risk-label" data-risk={hasRiskFactor(claim.value) ? "true" : "false"}>
                      <Siren aria-hidden="true" size={16} strokeWidth={2} />
                      <span>{claim.label}</span>
                    </span>
                  ) : <span>{claim.label}</span>}
                </dt>
                <dd>{claim.value}</dd>
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
        </section>
      </div>
    </section>
  );
}
