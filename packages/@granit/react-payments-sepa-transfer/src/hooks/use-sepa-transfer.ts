import {
  getSepaTransferConfiguration,
  upsertSepaTransferConfiguration,
} from '@granit/payments-sepa-transfer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildSepaTransferQueryKey,
  useSepaTransferConfig,
} from '../providers/sepa-transfer-provider';

import type {
  SepaTransferConfigurationRequest,
  SepaTransferConfigurationResponse,
} from '@granit/payments-sepa-transfer';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Get the current tenant's SEPA bank transfer configuration.
 *
 * @example
 * ```tsx
 * const { data: config } = useSepaTransferConfiguration();
 * ```
 */
export function useSepaTransferConfiguration(): UseQueryResult<SepaTransferConfigurationResponse> {
  const config = useSepaTransferConfig();

  return useQuery({
    queryKey: buildSepaTransferQueryKey(config, 'configuration'),
    queryFn: () => getSepaTransferConfiguration(config.client, config.basePath),
  });
}

/**
 * Create or update the tenant's SEPA bank transfer configuration. Invalidates
 * the configuration query on success.
 *
 * @example
 * ```tsx
 * const upsert = useUpsertSepaTransferConfiguration();
 * await upsert.mutateAsync({ beneficiaryName: 'Acme NV', beneficiaryIban: 'BE68…' });
 * ```
 */
export function useUpsertSepaTransferConfiguration(): UseMutationResult<
  SepaTransferConfigurationResponse,
  Error,
  SepaTransferConfigurationRequest
> {
  const config = useSepaTransferConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SepaTransferConfigurationRequest) =>
      upsertSepaTransferConfiguration(config.client, config.basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSepaTransferQueryKey(config, 'configuration'),
      });
    },
  });
}
