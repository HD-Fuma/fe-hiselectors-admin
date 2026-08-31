import * as echarts from "echarts/core";
import {
  BarChart,
  BoxplotChart,
  LineChart,
  PieChart,
  ScatterChart,
} from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { ECHARTS_FONT_FAMILY } from "./chartColors";

echarts.use([
  BarChart,
  BoxplotChart,
  LineChart,
  PieChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
]);

echarts.registerTheme("hsas", {
  textStyle: {
    fontFamily: ECHARTS_FONT_FAMILY,
  },
});

export { echarts };
