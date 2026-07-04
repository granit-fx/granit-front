/**
 * Single ECharts instance configured with only the chart types and components
 * the framework's primitives use. Tree-shakes everything else out of consumer
 * bundles — pulling `echarts/core` instead of `echarts` cuts ~70% of the bundle
 * weight on apps that only render line / bar / pie / gauge widgets.
 *
 * Add a chart type or component here when you ship a new primitive. The cost
 * is paid once, in a single shared module — primitive components import from
 * here, never directly from `echarts/charts` or `echarts/components`.
 */
import {
  BarChart,
  FunnelChart,
  GaugeChart,
  LineChart,
  PieChart,
  RadarChart,
  TreemapChart,
} from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  // Charts
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  RadarChart,
  FunnelChart,
  TreemapChart,
  // Components
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  RadarComponent,
  // Renderer
  CanvasRenderer,
]);

export * as echarts from 'echarts/core';
