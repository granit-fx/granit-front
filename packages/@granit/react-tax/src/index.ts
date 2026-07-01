// Provider
export { TaxProvider, buildTaxQueryKey, useTaxConfig } from './providers/tax-provider';
export type { ResolvedTaxConfig, TaxConfig, TaxProviderProps } from './providers/tax-provider';

// Hooks
export {
  useTaxRateByCountry,
  useTaxRates,
  useTaxRatesMeta,
  useValidateTaxId,
} from './hooks/use-tax';
