// Data-table cell rendering shared across query-metadata consumers.
//
// A column picks its renderer from three signals, in descending priority:
//   1. `column.valueKind` — semantic cell kind emitted by the backend query
//      metadata (Granit.QueryEngine.Meta.ColumnDefinition.ValueKind).
//   2. manifest `component` — the form-widget hint joined by column name
//      (only richer consumers pass it; a plain grid leaves it undefined).
//   3. CLR `column.type` — ISO-date detection, then a boolean / text fallback.
//
// Every signal is optional and purely additive: a column with no `valueKind`
// and no matching component degrades to the legacy CLR/text behaviour. Lives
// in `@granit/react-query-engine` so both the styled workspace grid
// (`@granit/react-ui-entities`) and the minimal `<EntityList>`
// (`@granit/react-entities`) render cells from a single source of truth.

import type { ColumnDefinition } from '@granit/query-engine';
import type { ReactNode } from 'react';

export type DateFormatter = (date: string | Date) => string;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function formatDateValue(
  value: string,
  formatDate: DateFormatter,
  formatDateTime: DateFormatter,
  withTime: boolean
): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // Timezone-aware (user PreferredTimezone) via useDateFormatter, not raw Intl.
  return withTime ? formatDateTime(value) : formatDate(value);
}

function tryFormatDateCell(
  value: unknown,
  component: string | undefined,
  columnType: string,
  formatDate: DateFormatter,
  formatDateTime: DateFormatter
): string | null {
  if (typeof value !== 'string') return null;
  if (component === 'date' || component === 'datetime') {
    return formatDateValue(value, formatDate, formatDateTime, component === 'datetime');
  }
  if (columnType === 'DateTime' || columnType === 'DateTimeOffset') {
    return formatDateValue(value, formatDate, formatDateTime, false);
  }
  if (ISO_DATE_RE.test(value)) {
    return formatDateValue(value, formatDate, formatDateTime, false);
  }
  return null;
}

// Formats a monetary amount. Query-engine `valueKind: 'Currency'` columns
// carry the actual decimal amount (major units), so no scaling by default;
// the legacy entity `money` form-component stores Int64 minor units (cents),
// so that path opts into `minorUnits`. When no ISO code resolves, falls back
// to a plain locale number (no symbol).
function formatMoney(
  value: number,
  currency: string | undefined,
  locale: string,
  minorUnits = false
): string {
  const options: Intl.NumberFormatOptions = currency ? { style: 'currency', currency } : {};
  return new Intl.NumberFormat(locale, options).format(minorUnits ? value / 100 : value);
}

// Currency ISO code precedence for a `Currency` column:
//   1. column.currencyCode  — fixed design-time constant
//   2. row[currencyCodeField] — sibling column, per row (multi-currency)
//   3. undefined            — locale/number fallback
function resolveColumnCurrency(
  column: ColumnDefinition,
  row: Readonly<Record<string, unknown>>
): string | undefined {
  if (column.currencyCode) return column.currencyCode;
  if (column.currencyCodeField) {
    const code = row[column.currencyCodeField];
    if (typeof code === 'string' && code.length > 0) return code;
  }
  return undefined;
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

function formatBytes(value: number, locale: string): string {
  let size = value;
  let unit = 0;
  while (Math.abs(size) >= 1024 && unit < BYTE_UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(size);
  return `${formatted} ${BYTE_UNITS[unit]}`;
}

// Humanizes a duration given in seconds to `1h 05m` / `12m 03s` / `45s`.
function formatDuration(totalSeconds: number): string {
  const seconds = Math.floor(Math.abs(totalSeconds));
  const sign = totalSeconds < 0 ? '-' : '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${sign}${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${sign}${minutes}m ${String(secs).padStart(2, '0')}s`;
  return `${sign}${secs}s`;
}

type LinkKind = 'url' | 'email' | 'phone';

function formatLinkCell(value: unknown, kind: LinkKind): ReactNode {
  if (typeof value !== 'string' || value.length === 0) return null;
  const href = kind === 'email' ? `mailto:${value}` : kind === 'phone' ? `tel:${value}` : value;
  const external = kind === 'url';
  return (
    <a
      href={href}
      className="text-primary underline underline-offset-2"
      onClick={(e) => e.stopPropagation()}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {value}
    </a>
  );
}

function renderBoolean(value: boolean): ReactNode {
  return <span data-granit-cell-boolean={String(value)}>{value ? '✓' : '✗'}</span>;
}

/**
 * Cell-level rendering context threaded to every valueKind formatter. A `null`
 * return from a formatter means "cannot render this value" — {@link formatCell}
 * then falls through to the manifest-component / CLR path.
 */
export interface CellFormatterContext {
  readonly row: Readonly<Record<string, unknown>>;
  readonly column: ColumnDefinition;
  /**
   * Manifest form-widget id joined by column name. Only richer grids supply
   * it; when absent, the CLR/text path takes over. Currently used to keep the
   * legacy `money` widget working when no `valueKind` is present.
   */
  readonly component?: string | undefined;
  /**
   * Legacy currency resolver for the `money` manifest component. Consulted
   * only on that path (never for `valueKind: 'Currency'`, which resolves its
   * code from the column). Optional — a plain grid without money widgets omits
   * it.
   */
  readonly currencyResolver?: ((row: Readonly<Record<string, unknown>>) => string) | undefined;
  readonly locale: string;
  readonly formatDate: DateFormatter;
  readonly formatDateTime: DateFormatter;
}

type CellFormatter = (value: unknown, ctx: CellFormatterContext) => ReactNode;

function formatDateKind(value: unknown, ctx: CellFormatterContext, withTime: boolean): ReactNode {
  if (typeof value !== 'string') return null;
  return formatDateValue(value, ctx.formatDate, ctx.formatDateTime, withTime);
}

function formatNumberKind(value: unknown, locale: string): ReactNode {
  if (typeof value !== 'number') return null;
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * `valueKind` → cell formatter. Tier 1+2 kinds render here; unmapped kinds
 * (`Enum`, `Color`, `Image`, `Json`, `Markdown`, `Tags`, `Rating`)
 * intentionally have no entry and fall through to the manifest-component / CLR
 * text path. Wire keys are the .NET `ValueKind` enum member names verbatim.
 */
export const VALUE_KIND_FORMATTERS: Readonly<Record<string, CellFormatter>> = Object.freeze({
  Currency: (value, ctx) =>
    typeof value === 'number'
      ? formatMoney(value, resolveColumnCurrency(ctx.column, ctx.row), ctx.locale)
      : null,
  Percentage: (value, ctx) =>
    typeof value === 'number'
      ? `${new Intl.NumberFormat(ctx.locale, { maximumFractionDigits: 2 }).format(value)}%`
      : null,
  Number: (value, ctx) => formatNumberKind(value, ctx.locale),
  Count: (value, ctx) => formatNumberKind(value, ctx.locale),
  Bytes: (value, ctx) => (typeof value === 'number' ? formatBytes(value, ctx.locale) : null),
  Duration: (value) => (typeof value === 'number' ? formatDuration(value) : null),
  Url: (value) => formatLinkCell(value, 'url'),
  Email: (value) => formatLinkCell(value, 'email'),
  Phone: (value) => formatLinkCell(value, 'phone'),
  Date: (value, ctx) => formatDateKind(value, ctx, false),
  DateTime: (value, ctx) => formatDateKind(value, ctx, true),
  Time: (value, ctx) => formatDateKind(value, ctx, true),
  RelativeTime: (value, ctx) => formatDateKind(value, ctx, true),
  Boolean: (value) => (typeof value === 'boolean' ? renderBoolean(value) : null),
  Identifier: (value) => (
    <code className="font-mono text-xs">{typeof value === 'object' ? '—' : String(value)}</code>
  ),
});

/**
 * Renders one data-table cell with graceful degradation across the three
 * signals described at the top of this module.
 */
export function formatCell(ctx: CellFormatterContext): ReactNode {
  const { row, column, component, currencyResolver, locale, formatDate, formatDateTime } = ctx;
  const value = row[column.name];
  if (value === null || value === undefined) return '—';

  if (column.valueKind) {
    const formatter = VALUE_KIND_FORMATTERS[column.valueKind];
    if (formatter) {
      const rendered = formatter(value, ctx);
      if (rendered !== null) return rendered;
    }
  }

  if (component === 'money' && currencyResolver && typeof value === 'number') {
    // Legacy entity `money` widget: Int64 minor units (cents) on the wire.
    return formatMoney(value, currencyResolver(row), locale, true);
  }

  // A column declaring a currency code (fixed or per-row) formats as money even
  // when no `valueKind` is present — preserves the currency-code-only contract
  // (major units, like `valueKind: 'Currency'`).
  if ((column.currencyCode || column.currencyCodeField) && typeof value === 'number') {
    return formatMoney(value, resolveColumnCurrency(column, row), locale);
  }

  const formattedDate = tryFormatDateCell(
    value,
    component,
    column.type,
    formatDate,
    formatDateTime
  );
  if (formattedDate !== null) return formattedDate;

  if (typeof value === 'boolean') return renderBoolean(value);
  if (typeof value === 'number') return new Intl.NumberFormat(locale).format(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value); // NOSONAR: remaining types (symbol, function) stringify safely
}

/**
 * Locale-aware `Intl` date formatters, a sensible default for consumers that
 * lack a timezone-aware formatter of their own (e.g. the minimal
 * `<EntityList>`). Richer grids should keep passing the host's
 * `useDateFormatter` (user-preferred timezone) instead.
 */
export function createDefaultCellDateFormatters(locale: string): {
  readonly formatDate: DateFormatter;
  readonly formatDateTime: DateFormatter;
} {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  return {
    formatDate: (value) => date.format(new Date(value)),
    formatDateTime: (value) => dateTime.format(new Date(value)),
  };
}
