/**
 * ISO 4217 currency codes.
 *
 * Union type provides auto-completion for common currencies used in Granit
 * SaaS modules (billing, payments, invoicing, subscriptions).
 *
 * The list covers EU/EEA currencies, major global currencies, and common
 * trading partners. Extend as needed.
 */
export type CurrencyCode =
  // EU / Eurozone
  | 'EUR'
  // Western Europe (non-euro)
  | 'GBP'
  | 'CHF'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'ISK'
  // Central & Eastern Europe (non-euro)
  | 'PLN'
  | 'CZK'
  | 'HUF'
  | 'RON'
  | 'BGN'
  | 'HRK'
  | 'RSD'
  | 'UAH'
  | 'GEL'
  | 'TRY'
  // Americas
  | 'USD'
  | 'CAD'
  | 'BRL'
  | 'MXN'
  // Asia-Pacific
  | 'JPY'
  | 'CNY'
  | 'KRW'
  | 'INR'
  | 'AUD'
  | 'NZD'
  | 'SGD'
  | 'HKD'
  | 'TWD'
  | 'THB'
  // Middle East & Africa
  | 'AED'
  | 'SAR'
  | 'ILS'
  | 'ZAR'
  | 'MAD';
