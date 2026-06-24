// @granit/react-ui-tax — admin UI for the Tax module.
// Composes the headless @granit/react-tax (provider + hooks) and the
// @granit/react-query-engine query layer with the foundation UI packages
// (@granit/react-ui, @granit/react-ui-kit, @granit/react-localization).
// The Axios client resolves from a GranitClientProvider in the host tree (via the
// host-supplied TaxProvider / QueryProvider) — this package does NOT wrap a data
// provider. Form validation is spec-driven via @granit/react-validation + the
// generated @granit/tax constraints.

export { TaxRatesPage } from './tax-rates-page';
export { TaxValidatePage } from './tax-validate-page';

export { createTaxRateColumns } from './components/tax-rate-columns';
export { TaxRateDetailCard } from './components/tax-rate-detail-card';
export { ValidateTaxForm } from './components/validate-tax-form';
export type { TaxValidateFormValues } from './components/validate-tax-form';
export { ValidationResultCard } from './components/validation-result-card';

// i18next resource bundles (flat keys, "translation" ns)
export { taxTranslationsEn, taxTranslationsFr } from './locales/index';
export type { TaxTranslations } from './locales/index';
