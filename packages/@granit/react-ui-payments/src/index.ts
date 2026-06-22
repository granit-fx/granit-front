// @granit/react-ui-payments — admin UI for the Payments module.
// Composes the headless @granit/react-payments (PaymentsProvider + hooks) with
// the foundation UI packages. The host app supplies PaymentsProvider (which
// resolves an Axios client via GranitClientProvider); these pages only call the
// hooks. The charge/refund forms derive validation from the OpenAPI-backed
// @granit/payments paymentsConstraints via createConstraintsResolver from
// @granit/react-validation.

// Pages
export { TransactionListPage } from './transaction-list-page';
export { TransactionDetailPage } from './transaction-detail-page';
export { PaymentMethodsPage } from './payment-methods-page';
export { TenantPaymentMethodsPage } from './tenant-payment-methods-page';

// Components
export { ChargeDialog } from './components/charge-dialog';
export { RefundDialog } from './components/refund-dialog';
export { AttachMethodDialog } from './components/attach-method-dialog';
export { DetachMethodDialog } from './components/detach-method-dialog';
export { PaymentConfigurationSection } from './components/payment-configuration-section';
export { PaymentMethodCard } from './components/payment-method-card';
export { TransactionStatusBadge } from './components/transaction-status-badge';
export { CapabilityBadges, PendingSnapshotBadge } from './components/capability-badges';
export { createTransactionColumns } from './components/transaction-columns';
export { createRefundColumns } from './components/refund-columns';
export { createDisputeColumns } from './components/dispute-columns';
export { createPaymentHistoryColumns } from './components/payment-history-columns';

// Category helpers
export {
  categoryIndex,
  methodTypeCategory,
  methodTypeCategoryIndex,
} from './payment-method-category';

// i18next resource bundles (flat keys, "translation" ns).
export { paymentsTranslationsEn, paymentsTranslationsFr } from './locales/index';
export type { PaymentsTranslations } from './locales/index';
