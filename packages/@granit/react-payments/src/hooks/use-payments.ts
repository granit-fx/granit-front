import {
  activatePaymentMethod,
  attachPaymentMethod,
  createCheckoutSession,
  deactivatePaymentMethod,
  detachPaymentMethod,
  getAvailablePaymentMethods,
  getPaymentProviderCatalog,
  getPaymentTransaction,
  initiatePaymentCharge,
  listPaymentMethodConfigurations,
  listPaymentMethods,
  listPaymentTransactions,
  requestPaymentRefund,
  resyncPaymentMethodConfiguration,
} from '@granit/payments';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPaymentsQueryKey, usePaymentsConfig } from '../providers/payments-provider';

import type {
  PaymentAttachMethodRequest,
  PaymentAvailabilityContext,
  PaymentAvailableMethodResponse,
  PaymentChargeRequest,
  PaymentCheckoutRequest,
  PaymentCheckoutSessionResponse,
  PaymentMethodConfigurationItemResponse,
  PaymentMethodResponse,
  PaymentProviderCatalogResponse,
  PaymentProviderConfigurationResponse,
  PaymentRefundRequest,
  PaymentTransactionResponse,
} from '@granit/payments';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * List all payment transactions.
 *
 * @example
 * ```tsx
 * const { data: transactions } = usePaymentTransactions();
 * ```
 */
export function usePaymentTransactions(): UseQueryResult<readonly PaymentTransactionResponse[]> {
  const config = usePaymentsConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildPaymentsQueryKey(config, 'transactions'),
    queryFn: () => listPaymentTransactions(config.client, basePath),
  });
}

/**
 * Get a single payment transaction by ID.
 *
 * The query is automatically disabled when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: transaction } = usePaymentTransaction(selectedId);
 * ```
 */
export function usePaymentTransaction(id: string): UseQueryResult<PaymentTransactionResponse> {
  const config = usePaymentsConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildPaymentsQueryKey(config, 'transactions', id),
    queryFn: () => getPaymentTransaction(config.client, basePath, id),
    enabled: id.length > 0,
  });
}

/**
 * Initiate a payment charge.
 * Invalidates transaction queries on success.
 *
 * @example
 * ```tsx
 * const charge = useInitiatePaymentCharge();
 * await charge.mutateAsync({ invoiceId: 'inv-1', amount: 5000, ... });
 * ```
 */
export function useInitiatePaymentCharge(): UseMutationResult<void, Error, PaymentChargeRequest> {
  const config = usePaymentsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: PaymentChargeRequest) =>
      initiatePaymentCharge(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'transactions'),
      });
    },
  });
}

/**
 * Request a payment refund.
 * Invalidates transaction queries on success.
 *
 * @example
 * ```tsx
 * const refund = useRequestPaymentRefund();
 * await refund.mutateAsync({ transactionId: 'txn-1', amount: 2000, ... });
 * ```
 */
export function useRequestPaymentRefund(): UseMutationResult<void, Error, PaymentRefundRequest> {
  const config = usePaymentsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: PaymentRefundRequest) =>
      requestPaymentRefund(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'transactions'),
      });
    },
  });
}

/**
 * Create a checkout session. Returns a session with a URL for redirect.
 *
 * @example
 * ```tsx
 * const checkout = useCreateCheckoutSession();
 * const session = await checkout.mutateAsync({ ... });
 * window.location.href = session.url;
 * ```
 */
export function useCreateCheckoutSession(): UseMutationResult<
  PaymentCheckoutSessionResponse,
  Error,
  PaymentCheckoutRequest
> {
  const config = usePaymentsConfig();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: PaymentCheckoutRequest) =>
      createCheckoutSession(config.client, basePath, request),
  });
}

/**
 * List attached payment methods.
 *
 * @example
 * ```tsx
 * const { data: methods } = usePaymentMethods();
 * ```
 */
export function usePaymentMethods(): UseQueryResult<readonly PaymentMethodResponse[]> {
  const config = usePaymentsConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildPaymentsQueryKey(config, 'methods'),
    queryFn: () => listPaymentMethods(config.client, basePath),
  });
}

/**
 * Get available payment methods, optionally filtered by a runtime `context`
 * (country / currency / amount / sequence type).
 *
 * The query key includes the serialized `context` so that distinct filter
 * combinations maintain independent caches and do not cross-contaminate.
 * Omit `context` to fetch all available methods (unfiltered).
 *
 * @example
 * ```tsx
 * // Unfiltered
 * const { data: all } = useAvailablePaymentMethods();
 *
 * // Filtered by checkout context
 * const { data: eligible } = useAvailablePaymentMethods({
 *   country: 'BE',
 *   currency: 'EUR',
 *   amount: 4999,
 * });
 * ```
 */
export function useAvailablePaymentMethods(
  context?: PaymentAvailabilityContext
): UseQueryResult<readonly PaymentAvailableMethodResponse[]> {
  const config = usePaymentsConfig();
  const basePath = config.basePath!;
  const baseKey = buildPaymentsQueryKey(config, 'methods', 'available');
  const queryKey = context ? [...baseKey, context] : baseKey;

  return useQuery({
    queryKey,
    queryFn: () => getAvailablePaymentMethods(config.client, basePath, context),
  });
}

/**
 * Attach a payment method.
 * Invalidates method queries on success.
 *
 * @example
 * ```tsx
 * const attach = useAttachPaymentMethod();
 * await attach.mutateAsync({ providerName: 'Stripe', type: 'card', token: 'tok_...' });
 * ```
 */
export function useAttachPaymentMethod(): UseMutationResult<
  PaymentMethodResponse,
  Error,
  PaymentAttachMethodRequest
> {
  const config = usePaymentsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: PaymentAttachMethodRequest) =>
      attachPaymentMethod(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'methods'),
      });
    },
  });
}

/**
 * Detach a payment method by ID.
 * Invalidates method queries on success.
 *
 * @example
 * ```tsx
 * const detach = useDetachPaymentMethod();
 * await detach.mutateAsync('pm-1');
 * ```
 */
export function useDetachPaymentMethod(): UseMutationResult<void, Error, string> {
  const config = usePaymentsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (id: string) => detachPaymentMethod(config.client, basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'methods'),
      });
    },
  });
}

interface PaymentMethodToggleArgs {
  readonly providerName: string;
  readonly methodType: string;
}

/**
 * List platform-level payment method configurations (host admin).
 * Returns the fused view of all payment methods declared by installed providers,
 * grouped by provider, with their activation state.
 *
 * @example
 * ```tsx
 * const { data: providers } = usePaymentMethodConfigurations();
 * ```
 */
export function usePaymentMethodConfigurations(): UseQueryResult<
  readonly PaymentProviderConfigurationResponse[]
> {
  const config = usePaymentsConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildPaymentsQueryKey(config, 'configuration'),
    queryFn: () => listPaymentMethodConfigurations(config.client, basePath),
  });
}

/**
 * Activate a payment method for the platform (idempotent).
 * Invalidates configuration and available-methods queries on success.
 *
 * @example
 * ```tsx
 * const activate = useActivatePaymentMethod();
 * await activate.mutateAsync({ providerName: 'stripe', methodType: 'card' });
 * ```
 */
export function useActivatePaymentMethod(): UseMutationResult<
  PaymentMethodConfigurationItemResponse,
  Error,
  PaymentMethodToggleArgs
> {
  const config = usePaymentsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ providerName, methodType }: PaymentMethodToggleArgs) =>
      activatePaymentMethod(config.client, basePath, providerName, methodType),
    onSuccess: (_data, { providerName }) => {
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'configuration'),
      });
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'methods', 'available'),
      });
      // Activation flips activated + hasSnapshot on the catalog row for this provider.
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'catalog', providerName),
      });
    },
  });
}

/**
 * Deactivate a payment method for the platform (idempotent).
 * Invalidates configuration and available-methods queries on success.
 *
 * @example
 * ```tsx
 * const deactivate = useDeactivatePaymentMethod();
 * await deactivate.mutateAsync({ providerName: 'stripe', methodType: 'card' });
 * ```
 */
export function useDeactivatePaymentMethod(): UseMutationResult<
  PaymentMethodConfigurationItemResponse,
  Error,
  PaymentMethodToggleArgs
> {
  const config = usePaymentsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ providerName, methodType }: PaymentMethodToggleArgs) =>
      deactivatePaymentMethod(config.client, basePath, providerName, methodType),
    onSuccess: (_data, { providerName }) => {
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'configuration'),
      });
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'methods', 'available'),
      });
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'catalog', providerName),
      });
    },
  });
}

/**
 * Fetch the live catalog of payment methods advertised by a provider.
 *
 * The query is automatically disabled when `providerName` is empty.
 *
 * @example
 * ```tsx
 * const { data: catalog } = useProviderCatalog(selectedProvider);
 * ```
 */
export function useProviderCatalog(
  providerName: string
): UseQueryResult<PaymentProviderCatalogResponse> {
  const config = usePaymentsConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildPaymentsQueryKey(config, 'catalog', providerName),
    queryFn: () => getPaymentProviderCatalog(config.client, basePath, providerName),
    enabled: providerName.length > 0,
  });
}

/**
 * Re-fetch the provider catalog and overwrite the stored capability snapshot
 * for an already-activated method. Invalidates the configuration list and the
 * provider catalog on success so UI badges and status columns refresh.
 *
 * @example
 * ```tsx
 * const resync = useResyncPaymentMethod();
 * await resync.mutateAsync({ providerName: 'mollie', methodType: 'bancontact' });
 * ```
 */
export function useResyncPaymentMethod(): UseMutationResult<
  PaymentMethodConfigurationItemResponse,
  Error,
  PaymentMethodToggleArgs
> {
  const config = usePaymentsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ providerName, methodType }: PaymentMethodToggleArgs) =>
      resyncPaymentMethodConfiguration(config.client, basePath, providerName, methodType),
    onSuccess: (_data, { providerName }) => {
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'configuration'),
      });
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'catalog', providerName),
      });
    },
  });
}
