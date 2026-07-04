// ---------------------------------------------------------------------------
// @granit/react-charts — public API
// ---------------------------------------------------------------------------

// Escape hatch
export { Chart } from './components/chart';
export type { ChartProps } from './components/chart';

// Typed primitives
export { LineChart } from './components/line-chart';
export type { LineChartProps } from './components/line-chart';
export { BarChart } from './components/bar-chart';
export type { BarChartProps } from './components/bar-chart';
export { PieChart } from './components/pie-chart';
export type { PieChartProps, PieDatum } from './components/pie-chart';
export { SparklineChart } from './components/sparkline-chart';
export type { SparklineChartProps } from './components/sparkline-chart';
export { RadarChart } from './components/radar-chart';
export type { RadarChartProps, RadarDatum } from './components/radar-chart';
export { FunnelChart } from './components/funnel-chart';
export type { FunnelChartProps, FunnelDatum } from './components/funnel-chart';
export { TreemapChart } from './components/treemap-chart';
export type { TreemapChartProps, TreemapDatum } from './components/treemap-chart';
export { HeatmapChart } from './components/heatmap-chart';
export type { HeatmapChartProps, HeatmapDatum } from './components/heatmap-chart';

// Theming
export { useEChartsTheme } from './hooks/use-echarts-theme';
export type { UseEChartsThemeOptions } from './hooks/use-echarts-theme';

// Snapshot rendering (B5-B — registry-driven Chart kind for <RenderedDashboard>)
export { ChartSnapshotWidget } from './snapshot/chart-snapshot-widget';
export { defaultChartSnapshotWidgetRegistry } from './snapshot/default-chart-snapshot-widget-registry';
