import {
  addAdminCredit,
  applyAdminDebit,
  getCustomerBalance,
  listBalanceTransactions,
} from '@granit/customer-balance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildCustomerBalanceQueryKey,
  useCustomerBalanceConfig,
} from '../providers/customer-balance-provider';

import type {
  AdminCreditRequest,
  AdminDebitRequest,
  BalanceTransactionResponse,
  CustomerBalanceResponse,
  ListBalanceTransactionsParams,
} from '@granit/customer-balance';
import type { PagedResult } from '@granit/query-engine';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch the current customer balance for a given currency.
 *
 * @example
 * ```tsx
 * const { data: balance } = useCustomerBalance('EUR');
 * ```
 */
export function useCustomerBalance(currency: string): UseQueryResult<CustomerBalanceResponse> {
  const config = useCustomerBalanceConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildCustomerBalanceQueryKey(config, 'balance', currency),
    queryFn: () => getCustomerBalance(config.client, basePath, currency),
  });
}

/**
 * List paginated balance transactions for a given currency.
 *
 * @example
 * ```tsx
 * const { data: transactions } = useBalanceTransactions({ currency: 'EUR', page: 1, pageSize: 25 });
 * ```
 */
export function useBalanceTransactions(
  params: ListBalanceTransactionsParams
): UseQueryResult<PagedResult<BalanceTransactionResponse>> {
  const config = useCustomerBalanceConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildCustomerBalanceQueryKey(
      config,
      'transactions',
      params.currency,
      params.page,
      params.pageSize
    ),
    queryFn: () => listBalanceTransactions(config.client, basePath, params),
  });
}

/**
 * Add an administrative credit to a party's balance.
 * Updates the balance cache from the response and invalidates transaction queries on success.
 *
 * @example
 * ```tsx
 * const credit = useAddAdminCredit();
 * await credit.mutateAsync({ partyId: '...', amount: 50, currency: 'EUR', source: 'Promotional', reason: 'Welcome', expiresAt: null });
 * ```
 */
export function useAddAdminCredit(): UseMutationResult<
  CustomerBalanceResponse,
  Error,
  AdminCreditRequest
> {
  const config = useCustomerBalanceConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: AdminCreditRequest) => addAdminCredit(config.client, basePath, request),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        buildCustomerBalanceQueryKey(config, 'balance', variables.currency),
        data
      );
      queryClient.invalidateQueries({
        queryKey: buildCustomerBalanceQueryKey(config, 'transactions'),
      });
    },
  });
}

/**
 * Apply a manual debit to a party's balance (admin tooling).
 * Updates the balance cache from the response and invalidates transaction queries on success.
 *
 * @example
 * ```tsx
 * const debit = useApplyAdminDebit();
 * await debit.mutateAsync({ partyId: '...', amount: 25, currency: 'EUR', reason: 'Correction' });
 * ```
 */
export function useApplyAdminDebit(): UseMutationResult<
  CustomerBalanceResponse,
  Error,
  AdminDebitRequest
> {
  const config = useCustomerBalanceConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: AdminDebitRequest) => applyAdminDebit(config.client, basePath, request),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        buildCustomerBalanceQueryKey(config, 'balance', variables.currency),
        data
      );
      queryClient.invalidateQueries({
        queryKey: buildCustomerBalanceQueryKey(config, 'transactions'),
      });
    },
  });
}
