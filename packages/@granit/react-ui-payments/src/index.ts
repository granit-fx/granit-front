// @granit/react-ui-payments — admin UI for the Payments module.
// Composes the headless @granit/react-payments (PaymentsProvider + hooks) with
// the foundation UI packages. The host app supplies PaymentsProvider (which
// resolves an Axios client via GranitClientProvider); these pages only call the
// hooks. The charge/refund forms derive validation from the OpenAPI-backed
// @granit/payments paymentsConstraints via createConstraintsResolver from
// @granit/react-validation.

// Pages
export { TransactionListPage } from './components/transaction-list-page';
export { TransactionDetailPage } from './components/transaction-detail-page';
export { PaymentMethodsPage } from './components/payment-methods-page';
export { TenantPaymentMethodsPage } from './components/tenant-payment-methods-page';

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

// Icons — brand-adjacent (trademark-safe) payment method / provider badges.
export { PaymentMethodIcon, ProviderIcon, resolveMethodIconStyle } from './icons/index';
export type { MethodIconStyle, PaymentMethodIconProps, ProviderIconProps } from './icons/index';

// Category helpers
export {
  categoryIndex,
  methodTypeCategory,
  methodTypeCategoryIndex,
} from './payment-method-category';

// i18next resource bundles (flat keys, "translation" ns).
export { paymentsTranslationsEn, paymentsTranslationsFr } from './locales/index';
export type { PaymentsTranslations } from './locales/index';
