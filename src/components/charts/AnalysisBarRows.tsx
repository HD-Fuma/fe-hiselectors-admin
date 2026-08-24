export interface AnalysisBarDatum {
  label: string;
  tone?: "accent" | "muted";
  value: number;
  valueLabel: string;
}

interface AnalysisBarRowsProps {
  ariaLabel: string;
  bars: readonly AnalysisBarDatum[];
  max?: number;
}

export function AnalysisBarRows({ ariaLabel, bars, max: fixedMax }: AnalysisBarRowsProps) {
  const max = fixedMax ?? Math.max(1, ...bars.map((bar) => bar.value));

  return (
    <div aria-label={ariaLabel} className="fuma-bar-rows" role="img">
      {bars.map((bar) => (
        <div className="fuma-bar-rows__row" key={bar.label} title={`${bar.label} · ${bar.valueLabel}`}>
          <span className="fuma-bar-rows__label">{bar.label}</span>
          <div className="fuma-bar-rows__track">
            <div
              className="fuma-bar-rows__fill"
              data-tone={bar.tone ?? "accent"}
              style={{ width: `${Math.max(4, Math.min(100, (bar.value / max) * 100))}%` }}
            />
          </div>
          <strong className="fuma-bar-rows__value">{bar.valueLabel}</strong>
        </div>
      ))}
    </div>
  );
}
