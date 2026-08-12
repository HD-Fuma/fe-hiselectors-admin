import { formatNumber } from "../../lib/formatters";
import {
  AnalysisFormatDonut,
  type AnalysisFormatSegment,
} from "./AnalysisFormatDonut";

interface AnalysisFormatBreakdownProps {
  segments: readonly AnalysisFormatSegment[];
  total: number;
}

export function AnalysisFormatBreakdown({
  segments,
  total,
}: AnalysisFormatBreakdownProps) {
  return (
    <div className="fuma-analysis-format-breakdown">
      <AnalysisFormatDonut segments={segments} total={total} />
      <ul className="fuma-analysis-format-breakdown__legend">
        {segments.map((format) => (
          <li key={format.label}>
            <i aria-hidden="true" style={{ backgroundColor: format.color }} />
            <span>{format.label}</span>
            <strong>
              {format.percentage.toFixed(0)}% <small>{formatNumber(format.count)}건</small>
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
