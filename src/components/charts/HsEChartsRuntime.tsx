import ReactEChartsCoreImport from "echarts-for-react/esm/core";
import { echarts } from "./echartsSetup";
import type { HsEChartsProps } from "./HsEChartsProps";

const ReactEChartsCore = (
  typeof ReactEChartsCoreImport === "function"
    ? ReactEChartsCoreImport
    : (ReactEChartsCoreImport as { default: typeof ReactEChartsCoreImport }).default
);

export function HsEChartsRuntime({
  className,
  height,
  option,
  style,
  width,
}: HsEChartsProps) {
  return (
    <ReactEChartsCore
      className={className}
      echarts={echarts}
      lazyUpdate
      notMerge
      option={option}
      opts={{
        height: height ?? "auto",
        renderer: "canvas",
        width: width ?? "auto",
      }}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
