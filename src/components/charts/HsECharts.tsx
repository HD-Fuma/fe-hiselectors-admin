import { lazy, Suspense } from "react";
import type { HsEChartsProps } from "./HsEChartsProps";

export type { EChartsOption, HsEChartsProps } from "./HsEChartsProps";

const HsEChartsRuntime = lazy(async () => {
  const module = await import("./HsEChartsRuntime");
  return { default: module.HsEChartsRuntime };
});

export function HsECharts({
  className,
  height,
  option,
  style,
  width,
}: HsEChartsProps) {
  if (import.meta.env.MODE === "test" || import.meta.env.VITEST) {
    return (
      <div
        className={className}
        data-echarts-stub=""
        style={{ width: "100%", height: "100%", ...style }}
      />
    );
  }

  return (
    <Suspense
      fallback={(
        <div
          className={className}
          style={{ width: "100%", height: "100%", ...style }}
        />
      )}
    >
      <HsEChartsRuntime
        className={className}
        height={height}
        option={option}
        style={style}
        width={width}
      />
    </Suspense>
  );
}
