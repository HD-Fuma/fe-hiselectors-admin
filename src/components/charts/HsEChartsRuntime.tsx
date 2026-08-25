import { useEffect, useRef } from "react";
import type { EChartsType } from "echarts/core";
import { echarts } from "./echartsSetup";
import type { HsEChartsProps } from "./HsEChartsProps";

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

    const chart = echarts.init(container, undefined, {
      height: height ?? "auto",
      renderer: "canvas",
      width: width ?? "auto",
    });
    chartRef.current = chart;
    chart.setOption(option, { lazyUpdate: true, notMerge: true });

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
    chartRef.current?.setOption(option, { lazyUpdate: true, notMerge: true });
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
