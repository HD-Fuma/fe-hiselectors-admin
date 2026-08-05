import { useId } from "react";
import {
  formatCount,
  type PerformanceTrendPoint,
} from "./fixtures";

const EMPTY_STATE = "표시할 성과 데이터가 없습니다";
const MAX_ITEMS = 5;

function finiteNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function plottedNumber(value: number) {
  return Math.max(0, finiteNumber(value));
}

export interface PerformanceKpiItem {
  label: string;
  value: string;
  description?: string;
}

interface PerformanceKpiGridProps {
  ariaLabel: string;
  items: readonly PerformanceKpiItem[];
}

export function PerformanceKpiGrid({
  ariaLabel,
  items,
}: PerformanceKpiGridProps) {
  return (
    <dl
      aria-label={ariaLabel}
      className="fuma-performance-kpi-grid"
      role="group"
    >
      {items.map((item) => (
        <div className="fuma-performance-kpi-grid__item" key={item.label}>
          <dt>{item.label}</dt>
          <dd>
            {item.value}
            {item.description ? <small>{item.description}</small> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface FigureTitleProps {
  title: string;
  description?: string;
}

interface PerformanceTrendChartProps extends FigureTitleProps {
  points: readonly PerformanceTrendPoint[];
}

function scalePoint(
  value: number,
  maximum: number,
  plotTop: number,
  plotBottom: number,
) {
  const safeMaximum = plottedNumber(maximum);

  if (safeMaximum <= 0) {
    return plotBottom;
  }

  const safeValue = plottedNumber(value);
  return plotBottom - (safeValue / safeMaximum) * (plotBottom - plotTop);
}

function xPosition(index: number, length: number, plotLeft: number, plotRight: number) {
  if (length <= 1) {
    return (plotLeft + plotRight) / 2;
  }

  return plotLeft + (index / (length - 1)) * (plotRight - plotLeft);
}

export function PerformanceTrendChart({
  description,
  points,
  title,
}: PerformanceTrendChartProps) {
  const captionId = useId();
  const safePoints = points.map((point) => ({
    ...point,
    clicks: finiteNumber(point.clicks),
    conversions: finiteNumber(point.conversions),
  }));
  const maxClicks = Math.max(
    0,
    ...safePoints.map((point) => plottedNumber(point.clicks)),
  );
  const maxConversions = Math.max(
    0,
    ...safePoints.map((point) => plottedNumber(point.conversions)),
  );
  const hasData =
    safePoints.length > 0 && (maxClicks > 0 || maxConversions > 0);

  const chartWidth = 720;
  const chartHeight = 280;
  const plotLeft = 72;
  const plotRight = 648;
  const plotTop = 38;
  const plotBottom = 216;
  const clickPoints = safePoints
    .map(
      (point, index) =>
        `${xPosition(index, safePoints.length, plotLeft, plotRight)},${scalePoint(
          point.clicks,
          maxClicks,
          plotTop,
          plotBottom,
        )}`,
    )
    .join(" ");
  const conversionPoints = safePoints
    .map(
      (point, index) =>
        `${xPosition(index, safePoints.length, plotLeft, plotRight)},${scalePoint(
          point.conversions,
          maxConversions,
          plotTop,
          plotBottom,
        )}`,
    )
    .join(" ");

  return (
    <figure
      aria-labelledby={captionId}
      className="fuma-performance-chart fuma-performance-trend-chart"
    >
      <figcaption id={captionId}>
        {title}
        {description ? <span>{description}</span> : null}
      </figcaption>
      {hasData ? (
        <>
          <div aria-label="범례" className="fuma-performance-chart__legend">
            <span className="fuma-performance-chart__legend-clicks">클릭</span>
            <span className="fuma-performance-chart__legend-conversions">
              구매 전환
            </span>
          </div>
          <svg
            aria-hidden="true"
            data-click-axis-min="0"
            data-conversion-axis-min="0"
            focusable="false"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            <line
              className="fuma-performance-trend-chart__axis"
              x1={plotLeft}
              x2={plotRight}
              y1={plotBottom}
              y2={plotBottom}
            />
            <text x={plotLeft - 12} y={plotTop} textAnchor="end">
              {formatCount(maxClicks)}
            </text>
            <text x={plotLeft - 12} y={plotBottom} textAnchor="end">
              0
            </text>
            <text x={plotRight + 12} y={plotTop} textAnchor="start">
              {formatCount(maxConversions)}
            </text>
            <text x={plotRight + 12} y={plotBottom} textAnchor="start">
              0
            </text>
            <polyline
              className="fuma-performance-trend-chart__line fuma-performance-trend-chart__line--clicks"
              data-series="clicks"
              fill="none"
              points={clickPoints}
            />
            <polyline
              className="fuma-performance-trend-chart__line fuma-performance-trend-chart__line--conversions"
              data-series="conversions"
              fill="none"
              points={conversionPoints}
              strokeDasharray="8 6"
            />
            {safePoints.map((point, index) => {
              const x = xPosition(
                index,
                safePoints.length,
                plotLeft,
                plotRight,
              );
              const clickY = scalePoint(
                point.clicks,
                maxClicks,
                plotTop,
                plotBottom,
              );
              const conversionY = scalePoint(
                point.conversions,
                maxConversions,
                plotTop,
                plotBottom,
              );

              return (
                <g data-date={point.date} key={point.date}>
                  <circle
                    className="fuma-performance-trend-chart__point fuma-performance-trend-chart__point--clicks"
                    cx={x}
                    cy={clickY}
                    r="4"
                  />
                  <text
                    className="fuma-performance-trend-chart__value fuma-performance-trend-chart__value--clicks"
                    x={x}
                    y={clickY - 10}
                    textAnchor="middle"
                  >
                    {formatCount(point.clicks)}
                  </text>
                  <circle
                    className="fuma-performance-trend-chart__point fuma-performance-trend-chart__point--conversions"
                    cx={x}
                    cy={conversionY}
                    r="4"
                  />
                  <text
                    className="fuma-performance-trend-chart__value fuma-performance-trend-chart__value--conversions"
                    x={x}
                    y={conversionY + 18}
                    textAnchor="middle"
                  >
                    {formatCount(point.conversions)}
                  </text>
                  <text
                    className="fuma-performance-trend-chart__date"
                    x={x}
                    y={plotBottom + 34}
                    textAnchor="middle"
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <ul className="hsas-visually-hidden">
            {safePoints.map((point) => (
              <li key={point.date}>
                {point.label}: 클릭 {formatCount(point.clicks)}, 구매 전환{" "}
                {formatCount(point.conversions)}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="fuma-performance-chart__empty">{EMPTY_STATE}</p>
      )}
    </figure>
  );
}

interface PerformanceBarChartItemBase {
  id: string;
  label: string;
  sortValue: number;
  primaryValue: number;
  primaryText: string;
}

export interface PerformanceSingleBarChartItem
  extends PerformanceBarChartItemBase {
  secondaryValue?: never;
  secondaryText?: never;
}

export interface PerformanceBarDotChartItem
  extends PerformanceBarChartItemBase {
  secondaryValue: number;
  secondaryText: string;
}

export type PerformanceBarChartItem =
  | PerformanceSingleBarChartItem
  | PerformanceBarDotChartItem;

interface PerformanceBarChartCommonProps extends FigureTitleProps {
  primaryLabel: string;
}

interface PerformanceSingleBarChartProps
  extends PerformanceBarChartCommonProps {
  items: readonly PerformanceSingleBarChartItem[];
  mode: "single";
  secondaryLabel?: never;
}

interface PerformanceBarDotChartProps extends PerformanceBarChartCommonProps {
  items: readonly PerformanceBarDotChartItem[];
  mode: "bar-dot";
  secondaryLabel: string;
}

export type PerformanceBarChartProps =
  | PerformanceSingleBarChartProps
  | PerformanceBarDotChartProps;

function sortByValueThenId<T extends { id: string; sortValue: number }>(
  items: readonly T[],
) {
  return [...items].sort((left, right) => {
    const leftSortValue = finiteNumber(left.sortValue);
    const rightSortValue = finiteNumber(right.sortValue);

    if (leftSortValue !== rightSortValue) {
      return rightSortValue - leftSortValue;
    }
    if (left.id === right.id) {
      return 0;
    }
    return left.id < right.id ? -1 : 1;
  });
}

function normalizedPercentage(value: number, maximum: number) {
  const safeMaximum = plottedNumber(maximum);

  if (safeMaximum <= 0) {
    return 0;
  }
  return (plottedNumber(value) / safeMaximum) * 100;
}

export function PerformanceBarChart(props: PerformanceBarChartProps) {
  const { description, items, mode, primaryLabel, secondaryLabel, title } =
    props;
  const captionId = useId();
  const visibleItems = sortByValueThenId<PerformanceBarChartItem>(items).slice(
    0,
    MAX_ITEMS,
  );
  const maxPrimary = Math.max(
    0,
    ...visibleItems.map((item) => plottedNumber(item.primaryValue)),
  );
  const maxSecondary = Math.max(
    0,
    ...visibleItems.map((item) => plottedNumber(item.secondaryValue ?? 0)),
  );
  const hasData = items.some((item) => plottedNumber(item.primaryValue) > 0);

  return (
    <figure
      aria-labelledby={captionId}
      className={`fuma-performance-chart fuma-performance-bar-chart fuma-performance-bar-chart--${mode}`}
    >
      <figcaption id={captionId}>
        {title}
        {description ? <span>{description}</span> : null}
      </figcaption>
      {hasData ? (
        <>
          <div aria-label="범례" className="fuma-performance-chart__legend">
            <span className="fuma-performance-chart__legend-primary">
              {primaryLabel}
            </span>
            {mode === "bar-dot" && secondaryLabel ? (
              <span className="fuma-performance-chart__legend-secondary">
                {secondaryLabel}
              </span>
            ) : null}
          </div>
          <ol
            aria-hidden="true"
            className="fuma-performance-bar-chart__rows"
          >
            {visibleItems.map((item) => (
              <li
                className="fuma-performance-bar-chart__row"
                data-item-id={item.id}
                key={item.id}
              >
                <span
                  className="fuma-performance-bar-chart__label"
                  title={item.label}
                >
                  {item.label}
                </span>
                <span className="fuma-performance-bar-chart__track">
                  <span
                    className="fuma-performance-bar-chart__bar"
                    style={{
                      width: `${normalizedPercentage(item.primaryValue, maxPrimary)}%`,
                    }}
                  />
                  {mode === "bar-dot" ? (
                    <span
                      className="fuma-performance-bar-chart__dot"
                      style={{
                        left: `${normalizedPercentage(
                          item.secondaryValue ?? 0,
                          maxSecondary,
                        )}%`,
                      }}
                    />
                  ) : null}
                </span>
                <span className="fuma-performance-bar-chart__values">
                  <span>{item.primaryText}</span>
                  {item.secondaryText ? <span>{item.secondaryText}</span> : null}
                </span>
              </li>
            ))}
          </ol>
          <ul className="hsas-visually-hidden">
            {visibleItems.map((item) => (
              <li key={item.id}>
                {item.label}: {item.primaryText}
                {item.secondaryText ? `, ${item.secondaryText}` : ""}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="fuma-performance-chart__empty">{EMPTY_STATE}</p>
      )}
    </figure>
  );
}

export interface PerformanceRankingItem {
  id: string;
  label: string;
  conversions: number;
  conversionText?: string;
  detail?: string;
}

interface PerformanceRankingProps extends FigureTitleProps {
  items: readonly PerformanceRankingItem[];
}

export function PerformanceRanking({
  description,
  items,
  title,
}: PerformanceRankingProps) {
  const captionId = useId();
  const visibleItems = sortByValueThenId(
    items.map((item) => ({
      ...item,
      sortValue: finiteNumber(item.conversions),
    })),
  ).slice(0, MAX_ITEMS);
  const hasData = items.some(
    (item) => plottedNumber(item.conversions) > 0,
  );

  return (
    <figure
      aria-labelledby={captionId}
      className="fuma-performance-chart fuma-performance-ranking"
    >
      <figcaption id={captionId}>
        {title}
        {description ? <span>{description}</span> : null}
      </figcaption>
      {hasData ? (
        <ol className="fuma-performance-ranking__list">
          {visibleItems.map((item, index) => (
            <li
              className="fuma-performance-ranking__item"
              data-item-id={item.id}
              key={item.id}
            >
              <span className="fuma-performance-ranking__rank">
                {index + 1}위
              </span>
              <span
                className="fuma-performance-ranking__label"
                title={item.label}
              >
                {item.label}
              </span>
              {item.detail ? (
                <span className="fuma-performance-ranking__detail">
                  {item.detail}
                </span>
              ) : null}
              <strong className="fuma-performance-ranking__value">
                {item.conversionText ?? formatCount(finiteNumber(item.conversions))}
              </strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="fuma-performance-chart__empty">{EMPTY_STATE}</p>
      )}
    </figure>
  );
}
