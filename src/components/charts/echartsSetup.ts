import * as echarts from "echarts/core";
import {
  BarChart,
  BoxplotChart,
  EffectScatterChart,
  LineChart,
  LinesChart,
  PieChart,
  ScatterChart,
} from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  BoxplotChart,
  EffectScatterChart,
  LineChart,
  LinesChart,
  PieChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export { echarts };
