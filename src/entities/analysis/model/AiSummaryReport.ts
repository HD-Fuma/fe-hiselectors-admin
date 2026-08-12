export interface AiSummaryReport {
  status: "ready" | "pending";
  summary: string;
  fitnessScore: number | null;
  evidence: string[];
}
