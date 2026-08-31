import { formatNumber } from "../../lib/formatters";
import {
  AnalysisFormatDonut,
  type AnalysisFormatSegment,
} from "./AnalysisFormatDonut";

interface AnalysisFormatBreakdownProps {
  animated?: boolean;
  segments: readonly AnalysisFormatSegment[];
  showSegmentLabels?: boolean;
  showTotal?: boolean;
  total: number | null;
  totalLabel?: string;
}

export function AnalysisFormatBreakdown({
  animated = false,
  segments,
  showSegmentLabels = false,
  showTotal = true,
  total,
  totalLabel,
}: AnalysisFormatBreakdownProps) {
  return (
    <div className="fuma-analysis-format-breakdown">
      <AnalysisFormatDonut
        animated={animated}
        segments={segments}
        showSegmentLabels={showSegmentLabels}
        showTotal={showTotal}
        total={total}
        totalLabel={totalLabel}
      />
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
