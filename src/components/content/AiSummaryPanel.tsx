import { StatusPill } from "../ui/StatusPill";

export interface AiSummaryReport {
  status: "ready" | "pending";
  summary: string;
  fitnessScore: number | null;
  evidence: string[];
}

interface AiSummaryPanelProps {
  report: AiSummaryReport;
}

export function AiSummaryPanel({ report }: AiSummaryPanelProps) {
  const isReady = report.status === "ready";

  return (
    <section aria-labelledby="creator-ai-summary-title" className="fuma-content-section">
      <header className="fuma-content-section__header">
        <h2 id="creator-ai-summary-title">AI 요약 리포트</h2>
        <StatusPill tone={isReady ? "approved" : "pending"}>
          {isReady ? "생성 완료" : "생성 대기"}
        </StatusPill>
      </header>
      {isReady ? (
        <div className="fuma-ai-summary">
          <div className="fuma-ai-summary__score">
            <span>AI 적합도</span>
            <strong>{report.fitnessScore}점</strong>
          </div>
          <div className="fuma-ai-summary__analysis">
            <p>{report.summary}</p>
            <h3>근거 지표</h3>
            <ul>
              {report.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="fuma-ai-summary__pending">
          <strong>AI 리포트 생성 전</strong>
          <p>분석 데이터가 준비되면 요약 리포트가 표시됩니다.</p>
        </div>
      )}
    </section>
  );
}
