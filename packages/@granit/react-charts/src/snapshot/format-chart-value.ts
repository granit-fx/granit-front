// Locale-aware value formatting for chart axes + tooltips. Kept as a pure
// factory (no React) so the number/currency behaviour is unit-testable and the
// `Intl.NumberFormat` instance can be memoised by the widget across renders.

/**
 * Builds a value formatter for chart numeric values. When `currency` is set
 * (a `ColumnBuilder.Currency(...)` field), values render with the ISO 4217
 * symbol; otherwise they use the culture's grouping + decimals. `locale`
 * defaults to the host default when `undefined`.
 */
export function createChartValueFormatter(
  locale: string | undefined,
  currency: string | null | undefined
): (value: number) => string {
  const nf = new Intl.NumberFormat(locale, currency ? { style: 'currency', currency } : {});
  return (value: number) => nf.format(value);
}
