/**
 * Format a minor-unit amount (e.g. cents) as a locale-aware currency string.
 *
 * The currency code is data-driven (comes from the API); only the locale must
 * track the active UI language so separators/grouping match (e.g. `1 234,56 €`
 * in French vs `€1,234.56` in English). Pass the active i18n language as
 * `locale` — `undefined` falls back to the runtime default.
 *
 * @param amount Amount in minor units (divided by 100 before formatting).
 * @param currency ISO 4217 currency code (e.g. `EUR`).
 * @param locale BCP 47 locale tag, typically `i18n.language`.
 */
export function formatCurrency(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount / 100);
}
