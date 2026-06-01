import { getFormCustomization, putFormCustomization } from '@granit/entities-customization';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildCustomizationQueryKey,
  useCustomizationConfig,
} from '../providers/customization-provider';

import type {
  FormCustomizationRequest,
  FormCustomizationResponse,
  FormVariant,
} from '@granit/entities-customization';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

interface UseFormCustomizationArgs {
  readonly entityName: string;
  readonly variant: FormVariant;
}

/**
 * Read the active form layout deltas for an entity/variant pair. Disabled
 * when `entityName` is empty.
 */
export function useFormCustomization({
  entityName,
  variant,
}: UseFormCustomizationArgs): UseQueryResult<FormCustomizationResponse> {
  const config = useCustomizationConfig();

  return useQuery({
    queryKey: buildCustomizationQueryKey(config, 'forms', entityName, variant),
    queryFn: () => getFormCustomization(config.client, config.apiBase, entityName, variant),
    enabled: entityName.length > 0,
  });
}

interface PutFormCustomizationArgs {
  readonly entityName: string;
  readonly variant: FormVariant;
  readonly request: FormCustomizationRequest;
}

/**
 * Replace the form layout deltas for an entity/variant. On success:
 * - the matching `useFormCustomization` query is invalidated
 * - the optional `onFormCustomizationChanged(entityName)` provider hook
 *   fires (apps wire it to invalidate the entity manifest cache, since the
 *   layout flows through `@granit/react-entities`).
 */
export function usePutFormCustomization(): UseMutationResult<
  FormCustomizationResponse,
  Error,
  PutFormCustomizationArgs
> {
  const config = useCustomizationConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entityName, variant, request }: PutFormCustomizationArgs) =>
      putFormCustomization(config.client, config.apiBase, entityName, variant, request),
    onSuccess: (_data, { entityName, variant }) => {
      queryClient.invalidateQueries({
        queryKey: buildCustomizationQueryKey(config, 'forms', entityName, variant),
      });
      config.onFormCustomizationChanged?.(entityName);
    },
  });
}
