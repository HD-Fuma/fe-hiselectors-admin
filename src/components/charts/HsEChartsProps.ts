import type { CSSProperties } from "react";
import type { EChartsOption } from "echarts";

export type { EChartsOption };

export interface HsEChartsProps {
  className?: string;
  height?: number;
  option: EChartsOption;
  style?: CSSProperties;
  width?: number;
}
