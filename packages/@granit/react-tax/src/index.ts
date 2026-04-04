// Provider
export { TaxProvider, buildTaxQueryKey, useTaxConfig } from './providers/tax-provider.js';
export type { TaxConfig, TaxProviderProps } from './providers/tax-provider.js';

// Hooks
export { useTaxRateByCountry, useTaxRates, useValidateTaxId } from './hooks/use-tax.js';
