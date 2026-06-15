import {
  cancelMandate,
  confirmMandate,
  createMandate,
  getMandate,
  getSepaConfiguration,
  upsertSepaConfiguration,
} from '@granit/payments-sepa-direct-debit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildSepaDirectDebitQueryKey,
  useSepaDirectDebitConfig,
} from '../providers/sepa-direct-debit-provider';

import type {
  ConfirmMandateRequest,
  CreateMandateRequest,
  MandateResponse,
  MandateSetupResponse,
  SepaConfigurationRequest,
  SepaConfigurationResponse,
} from '@granit/payments-sepa-direct-debit';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get a single mandate by ID. The query is disabled when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: mandate } = useMandate(selectedId);
 * ```
 */
export function useMandate(id: string): UseQueryResult<MandateResponse> {
  const config = useSepaDirectDebitConfig();

  return useQuery({
    queryKey: buildSepaDirectDebitQueryKey(config, 'mandates', id),
    queryFn: () => getMandate(config.client, config.basePath, id),
    enabled: id.length > 0,
  });
}

/**
 * Get the current tenant's SEPA Direct Debit configuration.
 *
 * @example
 * ```tsx
 * const { data: config } = useSepaConfiguration();
 * ```
 */
export function useSepaConfiguration(): UseQueryResult<SepaConfigurationResponse> {
  const config = useSepaDirectDebitConfig();

  return useQuery({
    queryKey: buildSepaDirectDebitQueryKey(config, 'configuration'),
    queryFn: () => getSepaConfiguration(config.client, config.basePath),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Set up a SEPA Direct Debit mandate. Invalidates the package's mandate keys on
 * success.
 *
 * Note: the cross-tenant mandate admin grid is fetched by
 * `@granit/react-query-engine` under its own `QueryProvider` — a different query
 * key namespace this provider cannot reach. To refresh that grid after a
 * mutation, invalidate the query-engine endpoint prefix **without** the params
 * object so every cached page flushes, e.g.
 * `queryClient.invalidateQueries({ queryKey: [...queryKeyPrefix, 'list'] })`
 * (and `'grouped'`).
 *
 * @example
 * ```tsx
 * const create = useCreateMandate();
 * const setup = await create.mutateAsync({ debtorPartyId, debtorName, debtorIban });
 * if (setup.redirectUrl) window.location.href = setup.redirectUrl;
 * ```
 */
export function useCreateMandate(): UseMutationResult<
  MandateSetupResponse,
  Error,
  CreateMandateRequest
> {
  const config = useSepaDirectDebitConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateMandateRequest) =>
      createMandate(config.client, config.basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSepaDirectDebitQueryKey(config, 'mandates'),
      });
    },
  });
}

/** Arguments for a mandate mutation that targets a specific mandate. */
export interface ConfirmMandateArgs {
  readonly id: string;
  readonly request: ConfirmMandateRequest;
}

/**
 * Confirm (activate) a pending mandate after the debtor's signature. Invalidates
 * the package's mandate keys on success (see {@link useCreateMandate} for the
 * cross-provider QE grid invalidation note).
 *
 * @example
 * ```tsx
 * const confirm = useConfirmMandate();
 * await confirm.mutateAsync({ id, request: { signedAt: new Date().toISOString() } });
 * ```
 */
export function useConfirmMandate(): UseMutationResult<MandateResponse, Error, ConfirmMandateArgs> {
  const config = useSepaDirectDebitConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: ConfirmMandateArgs) =>
      confirmMandate(config.client, config.basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSepaDirectDebitQueryKey(config, 'mandates'),
      });
    },
  });
}

/**
 * Cancel (revoke) a mandate by ID. Invalidates the package's mandate keys on
 * success (see {@link useCreateMandate} for the cross-provider QE grid note).
 *
 * @example
 * ```tsx
 * const cancel = useCancelMandate();
 * await cancel.mutateAsync(mandateId);
 * ```
 */
export function useCancelMandate(): UseMutationResult<MandateResponse, Error, string> {
  const config = useSepaDirectDebitConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelMandate(config.client, config.basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSepaDirectDebitQueryKey(config, 'mandates'),
      });
    },
  });
}

/**
 * Create or update the tenant's SEPA Direct Debit configuration. Invalidates the
 * configuration query on success.
 *
 * @example
 * ```tsx
 * const upsert = useUpsertSepaConfiguration();
 * await upsert.mutateAsync({ creditorId, defaultScheme: 'Core' });
 * ```
 */
export function useUpsertSepaConfiguration(): UseMutationResult<
  SepaConfigurationResponse,
  Error,
  SepaConfigurationRequest
> {
  const config = useSepaDirectDebitConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SepaConfigurationRequest) =>
      upsertSepaConfiguration(config.client, config.basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSepaDirectDebitQueryKey(config, 'configuration'),
      });
    },
  });
}
