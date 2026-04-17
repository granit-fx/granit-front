// Provider
export {
  PaymentsProvider,
  buildPaymentsQueryKey,
  usePaymentsConfig,
} from './providers/payments-provider.js';
export type { PaymentsConfig, PaymentsProviderProps } from './providers/payments-provider.js';

// Hooks
export {
  useActivatePaymentMethod,
  useAttachPaymentMethod,
  useAvailablePaymentMethods,
  useCreateCheckoutSession,
  useDeactivatePaymentMethod,
  useDetachPaymentMethod,
  useInitiatePaymentCharge,
  usePaymentMethodConfigurations,
  usePaymentMethods,
  usePaymentTransaction,
  usePaymentTransactions,
  useRequestPaymentRefund,
} from './hooks/use-payments.js';

// Icons
export { PaymentMethodIcon, ProviderIcon, resolveMethodIconStyle } from './icons/index.js';
export type {
  MethodIconStyle,
  PaymentMethodIconProps,
  ProviderIconProps,
} from './icons/index.js';
