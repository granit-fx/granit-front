// Provider
export {
  PaymentsProvider,
  buildPaymentsQueryKey,
  usePaymentsConfig,
} from './providers/payments-provider';
export type { PaymentsConfig, PaymentsProviderProps } from './providers/payments-provider';

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
  useProviderCatalog,
  useRequestPaymentRefund,
  useResyncPaymentMethod,
} from './hooks/use-payments';

// Icons
export { PaymentMethodIcon, ProviderIcon, resolveMethodIconStyle } from './icons/index';
export type { MethodIconStyle, PaymentMethodIconProps, ProviderIconProps } from './icons/index';
