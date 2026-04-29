// Use the package's ESM entry — the CJS `lib/core` path leaks the
// `{ default: ... }` shim into Vite's import graph (the `default`
// property holds the class, not the import binding itself), which
// surfaces at runtime as
//   "Element type is invalid... got: object. Check the render method of `Chart`."
// when the bundler can't unwrap the CJS interop. The ESM path ships a
// real `export default EChartsReactCore` that Vite consumes verbatim.
import EChartsReactCore from 'echarts-for-react/esm/core';

import { echarts } from '../echarts-instance.js';

import type { EChartsOption } from 'echarts';

/**
 * Escape hatch for advanced charts not yet wrapped by a typed primitive.
 *
 * Accepts raw ECharts options. Prefer the typed primitives (`<LineChart>`,
 * `<BarChart>`, `<PieChart>`, `<SparklineChart>`) for everything they cover —
 * they keep the framework decoupled from the underlying chart library.
 *
 * Reach for `<Chart>` only when the typed primitives are insufficient
 * (custom series compositions, advanced axis configs, etc.). Each call site is
 * a maintenance debt that has to migrate if ECharts is ever swapped.
 */
export interface ChartProps {
  readonly options: EChartsOption;
  /** Pixel height or any CSS dimension. Defaults to `320`. */
  readonly height?: number | string;
  readonly className?: string;
  /**
   * Theme name (must have been registered via `echarts.registerTheme()`) or
   * a theme object. Hosts typically register a single theme and pass its name.
   */
  readonly theme?: string | object;
  /**
   * Notification that the underlying ECharts instance was created. Use this
   * to access imperative APIs (`getDataURL`, `dispatchAction`, etc.) that
   * the typed primitives intentionally hide.
   */
  readonly onChartReady?: (instance: unknown) => void;
}

export function Chart({ options, height = 320, className, theme, onChartReady }: ChartProps) {
  return (
    <EChartsReactCore
      echarts={echarts}
      option={options}
      style={{ height, width: '100%' }}
      className={className}
      theme={theme}
      onChartReady={onChartReady}
      notMerge={false}
      lazyUpdate
    />
  );
}
