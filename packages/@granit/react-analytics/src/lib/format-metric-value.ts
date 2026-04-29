import type { ValueKind } from '@granit/analytics';

/**
 * Locale-aware formatter for a metric's primary value. Pure function — no
 * React, no i18n. The locale is passed explicitly so callers can drive it
 * from `useTranslation().i18n.language` (or any other source).
 */
export interface FormatMetricValueArgs {
  readonly value: number | null;
  readonly valueKind: ValueKind;
  /** ISO 4217 currency code. Required when `valueKind === 'Currency'`. */
  readonly currency?: string | null;
  /** BCP 47 tag. Defaults to runtime default (`undefined` → host default). */
  readonly locale?: string;
  /** Rendered when value is null. Defaults to em dash. */
  readonly fallback?: string;
}

const NO_VALUE = '—';

export function formatMetricValue({
  value,
  valueKind,
  currency,
  locale,
  fallback = NO_VALUE,
}: FormatMetricValueArgs): string {
  if (value === null || Number.isNaN(value)) return fallback;

  switch (valueKind) {
    case 'Count':
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);

    case 'Currency': {
      if (!currency) return new Intl.NumberFormat(locale).format(value);
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
    }

    case 'Percentage':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

    case 'Duration':
      return formatDuration(value, locale);

    case 'Date':
      return new Intl.DateTimeFormat(locale).format(new Date(value));

    case 'Number':
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

    default:
      return new Intl.NumberFormat(locale).format(value);
  }
}

/**
 * Formats a delta ratio as a signed percentage (e.g. `-14.28%`, `+3.50%`).
 * Returns the fallback when the ratio is null (delta undefined).
 */
export function formatDeltaRatio(
  ratio: number | null,
  locale?: string,
  fallback: string = NO_VALUE
): string {
  if (ratio === null || Number.isNaN(ratio)) return fallback;
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    signDisplay: 'always',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(ratio);
}

function formatDuration(seconds: number, locale?: string): string {
  if (seconds < 60) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(seconds) + 's';
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  return remaining === 0
    ? `${fmt.format(minutes)}m`
    : `${fmt.format(minutes)}m ${fmt.format(remaining)}s`;
}
