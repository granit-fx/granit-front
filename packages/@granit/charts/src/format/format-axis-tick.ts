/**
 * Locale-aware axis tick formatter factory.
 *
 * ECharts axis labels accept either a string template or a function. Our
 * primitives plug a function in by default so we get proper Intl-driven
 * grouping and currency rendering — the platform's default `toString()`
 * doesn't respect locale and produces "1234" where users expect "1,234".
 */
export interface FormatAxisTickOptions {
  /** BCP 47 tag. Defaults to runtime default (`undefined`). */
  readonly locale?: string;
  /** Formatting kind. Drives which `Intl` formatter is used. */
  readonly kind?: 'number' | 'currency' | 'percent' | 'time' | 'date';
  /** Required when `kind === 'currency'`. ISO 4217. */
  readonly currency?: string;
  /** Maximum fraction digits. Defaults to 2 for number/currency/percent, 0 for count-like. */
  readonly maximumFractionDigits?: number;
}

/**
 * Returns a function suitable for `axisLabel.formatter`.
 *
 * @example
 *   formatAxisTick({ kind: 'currency', currency: 'EUR', locale: 'fr-FR' })(12450.5)
 *   // → "12 450,50 €"
 */
export function formatAxisTick(
  options: FormatAxisTickOptions = {}
): (value: number | string) => string {
  const { locale, kind = 'number', currency, maximumFractionDigits } = options;

  switch (kind) {
    case 'currency': {
      if (!currency) {
        throw new Error('formatAxisTick: currency is required when kind="currency"');
      }
      const fmt = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: maximumFractionDigits ?? 2,
      });
      return (v) => fmt.format(toNumber(v));
    }
    case 'percent': {
      const fmt = new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: maximumFractionDigits ?? 2,
      });
      return (v) => fmt.format(toNumber(v));
    }
    case 'time': {
      const fmt = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
      return (v) => fmt.format(new Date(toNumber(v)));
    }
    case 'date': {
      const fmt = new Intl.DateTimeFormat(locale);
      return (v) => fmt.format(new Date(toNumber(v)));
    }
    case 'number':
    default: {
      const fmt = new Intl.NumberFormat(locale, {
        maximumFractionDigits: maximumFractionDigits ?? 0,
      });
      return (v) => fmt.format(toNumber(v));
    }
  }
}

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}
