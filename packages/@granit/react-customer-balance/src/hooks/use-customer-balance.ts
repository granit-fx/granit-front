import {
  addAdminCredit,
  getCustomerBalance,
  listBalanceTransactions,
} from '@granit/customer-balance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildCustomerBalanceQueryKey,
  useCustomerBalanceConfig,
} from '../providers/customer-balance-provider.js';

import type {
  AdminCreditRequest,
  BalanceTransactionResponse,
  CustomerBalanceResponse,
} from '@granit/customer-balance';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch the current customer balance.
 *
 * @example
 * ```tsx
 * const { data: balance } = useCustomerBalance();
 * ```
 */
export function useCustomerBalance(): UseQueryResult<CustomerBalanceResponse> {
  const config = useCustomerBalanceConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildCustomerBalanceQueryKey(config, 'balance'),
    queryFn: () => getCustomerBalance(config.client, basePath),
  });
}

/**
 * List all balance transactions.
 *
 * @example
 * ```tsx
 * const { data: transactions } = useBalanceTransactions();
 * ```
 */
export function useBalanceTransactions(): UseQueryResult<readonly BalanceTransactionResponse[]> {
  const config = useCustomerBalanceConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildCustomerBalanceQueryKey(config, 'transactions'),
    queryFn: () => listBalanceTransactions(config.client, basePath),
  });
}

/**
 * Add an administrative credit to the customer balance.
 * Invalidates balance and transaction queries on success.
 *
 * @example
 * ```tsx
 * const credit = useAddAdminCredit();
 * await credit.mutateAsync({ amount: 50, currency: 'EUR', source: 'Promotional', reason: 'Welcome', expiresAt: null });
 * ```
 */
export function useAddAdminCredit(): UseMutationResult<void, Error, AdminCreditRequest> {
  const config = useCustomerBalanceConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: AdminCreditRequest) => addAdminCredit(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildCustomerBalanceQueryKey(config, 'balance'),
      });
      queryClient.invalidateQueries({
        queryKey: buildCustomerBalanceQueryKey(config, 'transactions'),
      });
    },
  });
}
