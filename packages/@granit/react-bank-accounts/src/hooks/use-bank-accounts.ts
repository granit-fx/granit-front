import {
  archiveBankAccount,
  createBankAccount,
  getBankAccount,
  listBankAccountsByParty,
  verifyBankAccount,
} from '@granit/bank-accounts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildBankAccountsQueryKey,
  useBankAccountsConfig,
} from '../providers/bank-accounts-provider';

import type { BankAccountResponse, CreateBankAccountRequest } from '@granit/bank-accounts';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get a single bank account by ID (account identifier masked).
 *
 * The query is automatically disabled when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: account } = useBankAccount(selectedId);
 * ```
 */
export function useBankAccount(id: string): UseQueryResult<BankAccountResponse> {
  const config = useBankAccountsConfig();

  return useQuery({
    queryKey: buildBankAccountsQueryKey(config, 'detail', id),
    queryFn: () => getBankAccount(config.client, config.basePath, id),
    enabled: id.length > 0,
  });
}

/**
 * List the non-archived bank accounts of a party (per-party view).
 *
 * The query is automatically disabled when `partyId` is empty.
 *
 * @example
 * ```tsx
 * const { data: accounts } = useBankAccountsByParty(partyId);
 * ```
 */
export function useBankAccountsByParty(
  partyId: string
): UseQueryResult<readonly BankAccountResponse[]> {
  const config = useBankAccountsConfig();

  return useQuery({
    queryKey: buildBankAccountsQueryKey(config, 'by-party', partyId),
    queryFn: () => listBankAccountsByParty(config.client, config.basePath, partyId),
    enabled: partyId.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Register a bank account for a party.
 * Invalidates bank account queries on success.
 *
 * @example
 * ```tsx
 * const create = useCreateBankAccount();
 * await create.mutateAsync({ partyId, scheme: 'Iban', accountIdentifier, holderName, countryCode });
 * ```
 */
export function useCreateBankAccount(): UseMutationResult<
  BankAccountResponse,
  Error,
  CreateBankAccountRequest
> {
  const config = useBankAccountsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateBankAccountRequest) =>
      createBankAccount(config.client, config.basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildBankAccountsQueryKey(config) });
    },
  });
}

/**
 * Mark a bank account as verified (proof of ownership). Idempotent.
 * Invalidates bank account queries on success.
 *
 * @example
 * ```tsx
 * const verify = useVerifyBankAccount();
 * await verify.mutateAsync('acc-1');
 * ```
 */
export function useVerifyBankAccount(): UseMutationResult<BankAccountResponse, Error, string> {
  const config = useBankAccountsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => verifyBankAccount(config.client, config.basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildBankAccountsQueryKey(config) });
    },
  });
}

/**
 * Archive (soft-delete) a bank account. Idempotent.
 * Invalidates bank account queries on success.
 *
 * @example
 * ```tsx
 * const archive = useArchiveBankAccount();
 * await archive.mutateAsync('acc-1');
 * ```
 */
export function useArchiveBankAccount(): UseMutationResult<void, Error, string> {
  const config = useBankAccountsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveBankAccount(config.client, config.basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildBankAccountsQueryKey(config) });
    },
  });
}
