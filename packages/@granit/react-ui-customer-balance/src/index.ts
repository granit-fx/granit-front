// @granit/react-ui-customer-balance — admin UI for the Granit.CustomerBalance module.
// Composes the headless @granit/react-customer-balance (provider + hooks) with the
// foundation UI packages. The Axios client resolves from a GranitClientProvider
// in the host tree (via the CustomerBalanceProvider).

export { CustomerBalancePage } from './customer-balance-page';
export { BalanceSummaryCard } from './components/balance-summary-card';
export { AddCreditDialog } from './components/add-credit-dialog';
export { ApplyDebitDialog } from './components/apply-debit-dialog';
export { createTransactionColumns } from './components/transaction-columns';
export { formatCurrency } from './format-currency';

// i18next resource bundles (flat keys, "translation" ns)
export { customerBalanceTranslationsEn, customerBalanceTranslationsFr } from './locales/index';
export type { CustomerBalanceTranslations } from './locales/index';
