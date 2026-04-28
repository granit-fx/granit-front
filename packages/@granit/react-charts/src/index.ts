// ---------------------------------------------------------------------------
// @granit/react-charts — public API
// ---------------------------------------------------------------------------

// Escape hatch
export { Chart } from './components/chart.js';
export type { ChartProps } from './components/chart.js';

// Typed primitives
export { LineChart } from './components/line-chart.js';
export type { LineChartProps } from './components/line-chart.js';
export { BarChart } from './components/bar-chart.js';
export type { BarChartProps } from './components/bar-chart.js';
export { PieChart } from './components/pie-chart.js';
export type { PieChartProps, PieDatum } from './components/pie-chart.js';
export { SparklineChart } from './components/sparkline-chart.js';
export type { SparklineChartProps } from './components/sparkline-chart.js';

// Theming
export { useEChartsTheme } from './hooks/use-echarts-theme.js';
export type { UseEChartsThemeOptions } from './hooks/use-echarts-theme.js';
