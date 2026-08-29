import { useEffect, useRef } from "react";
import type { EChartsType } from "echarts/core";
import { ECHARTS_FONT_FAMILY } from "./chartColors";
import { echarts } from "./echartsSetup";
import type { HsEChartsProps } from "./HsEChartsProps";

const TEXT_STYLE_KEYS = new Set([
  "axisLabel",
  "label",
  "nameTextStyle",
  "subtextStyle",
  "textStyle",
]);

function injectPretendard(value: unknown, parentKey?: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => injectPretendard(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const source = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(source)) {
    next[key] = injectPretendard(child, key);
  }

  const shouldSetFamily =
    (parentKey !== undefined && TEXT_STYLE_KEYS.has(parentKey))
    || "fontSize" in source
    || "fontWeight" in source;

  if (shouldSetFamily && typeof next.fontFamily !== "string") {
    next.fontFamily = ECHARTS_FONT_FAMILY;
  }

  return next;
}

function withChartFont(option: HsEChartsProps["option"]): HsEChartsProps["option"] {
  const injected = injectPretendard(option) as HsEChartsProps["option"];
  const existingTextStyle =
    injected.textStyle && typeof injected.textStyle === "object"
      ? injected.textStyle
      : {};

  return {
    ...injected,
    textStyle: {
      fontFamily: ECHARTS_FONT_FAMILY,
      ...existingTextStyle,
    },
  };
}

export function HsEChartsRuntime({
  className,
  height,
  option,
  style,
  width,
}: HsEChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const chart = echarts.init(container, "hsas", {
      height: height ?? "auto",
      renderer: "canvas",
      width: width ?? "auto",
    });
    chartRef.current = chart;
    chart.setOption(withChartFont(option), { lazyUpdate: true, notMerge: true });

    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          chart.resize();
        });
    observer?.observe(container);

    return () => {
      observer?.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // Initialize once; option/size updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(withChartFont(option), { lazyUpdate: true, notMerge: true });
  }, [option]);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }
    chartRef.current.resize({
      height: height ?? undefined,
      width: width ?? undefined,
    });
  }, [height, width]);

  return (
    <div
      className={className}
      ref={containerRef}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
