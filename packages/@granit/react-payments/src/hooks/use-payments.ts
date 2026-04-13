import {
  attachPaymentMethod,
  createCheckoutSession,
  detachPaymentMethod,
  getAvailablePaymentMethods,
  getPaymentTransaction,
  initiatePaymentCharge,
  listPaymentMethods,
  listPaymentTransactions,
  requestPaymentRefund,
} from '@granit/payments';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPaymentsQueryKey, usePaymentsConfig } from '../providers/payments-provider.js';

import type {
  PaymentAttachMethodRequest,
  PaymentAvailableMethodResponse,
  PaymentChargeRequest,
  PaymentCheckoutRequest,
  PaymentCheckoutSessionResponse,
  PaymentMethodResponse,
  PaymentRefundRequest,
  PaymentRefundResponse,
  PaymentTransactionResponse,
} from '@granit/payments';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

const DEFAULT_BASE_PATH = '/api/v1/payments';

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
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

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
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

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
export function useInitiatePaymentCharge(): UseMutationResult<
  PaymentTransactionResponse,
  Error,
  PaymentChargeRequest
> {
  const config = usePaymentsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

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
export function useRequestPaymentRefund(): UseMutationResult<
  PaymentRefundResponse,
  Error,
  PaymentRefundRequest
> {
  const config = usePaymentsConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

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
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

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
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useQuery({
    queryKey: buildPaymentsQueryKey(config, 'methods'),
    queryFn: () => listPaymentMethods(config.client, basePath),
  });
}

/**
 * Get available payment methods for the current provider.
 *
 * @example
 * ```tsx
 * const { data: available } = useAvailablePaymentMethods();
 * ```
 */
export function useAvailablePaymentMethods(): UseQueryResult<
  readonly PaymentAvailableMethodResponse[]
> {
  const config = usePaymentsConfig();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useQuery({
    queryKey: buildPaymentsQueryKey(config, 'methods', 'available'),
    queryFn: () => getAvailablePaymentMethods(config.client, basePath),
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
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

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
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useMutation({
    mutationFn: (id: string) => detachPaymentMethod(config.client, basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildPaymentsQueryKey(config, 'methods'),
      });
    },
  });
}
