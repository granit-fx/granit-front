/**
 * Inputs for {@link buildEChartsTheme} — derived from the host app's Tailwind
 * design tokens. Only the values ECharts actually reads are required; the
 * builder fills in sensible fallbacks for the rest.
 */
export interface ChartThemeTokens {
  readonly background: string;
  readonly foreground: string;
  readonly muted: string;
  readonly border: string;
  /** Categorical palette — used to color individual series in order. */
  readonly palette: readonly string[];
  /** Font family used for axis labels, legends, tooltips. */
  readonly fontFamily?: string;
}

/**
 * Builds an ECharts theme object from a small set of Tailwind-aligned design
 * tokens. The returned object can be registered via `echarts.registerTheme(...)`
 * and then referenced by name in `<Chart theme="granit-light" />`.
 *
 * Kept framework-agnostic on purpose: this module never imports `echarts`. It
 * returns a plain JSON object whose shape matches what ECharts consumes.
 */
export function buildEChartsTheme(tokens: ChartThemeTokens): Readonly<Record<string, unknown>> {
  const fontFamily = tokens.fontFamily ?? 'inherit';
  const textStyle = { color: tokens.foreground, fontFamily };

  return Object.freeze({
    color: [...tokens.palette],
    backgroundColor: tokens.background,
    textStyle,
    title: {
      textStyle: { color: tokens.foreground, fontFamily, fontWeight: 600 },
      subtextStyle: { color: tokens.muted, fontFamily },
    },
    legend: {
      textStyle,
      inactiveColor: tokens.muted,
    },
    tooltip: {
      backgroundColor: tokens.background,
      borderColor: tokens.border,
      textStyle,
    },
    categoryAxis: axisStyle(tokens),
    valueAxis: axisStyle(tokens),
    timeAxis: axisStyle(tokens),
    logAxis: axisStyle(tokens),
    grid: { borderColor: tokens.border },
    line: { lineStyle: { width: 2 }, symbolSize: 6, smooth: false },
    bar: { itemStyle: { borderRadius: 2 } },
    pie: { itemStyle: { borderColor: tokens.background, borderWidth: 1 } },
  });
}

function axisStyle(tokens: ChartThemeTokens) {
  return {
    axisLine: { show: true, lineStyle: { color: tokens.border } },
    axisTick: { show: false },
    axisLabel: { color: tokens.muted, fontFamily: tokens.fontFamily ?? 'inherit' },
    splitLine: { lineStyle: { color: tokens.border, type: 'dashed' } },
  };
}
