import { render, screen } from "@testing-library/react";
import { AiSummaryPanel, type AiSummaryReport } from "./AiSummaryPanel";

const report: AiSummaryReport = {
  status: "ready",
  summary: "요약",
  fitnessScore: 90,
  evidence: ["근거"],
};

test("gives each reusable AI summary region a unique heading relationship", () => {
  render(
    <>
      <AiSummaryPanel report={report} />
      <AiSummaryPanel report={report} />
    </>,
  );

  const regions = screen.getAllByRole("region", { name: "AI 요약 리포트" });
  const headingIds = regions.map((region) => region.getAttribute("aria-labelledby"));

  expect(regions).toHaveLength(2);
  expect(new Set(headingIds).size).toBe(2);
  for (const id of headingIds) {
    expect(id).not.toBeNull();
    expect(document.getElementById(id!)).toHaveTextContent("AI 요약 리포트");
  }
});
