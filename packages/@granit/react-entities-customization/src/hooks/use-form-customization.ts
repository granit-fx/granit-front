import { getEntityCustomization, putEntityCustomization } from '@granit/entities-customization';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildCustomizationQueryKey,
  useCustomizationConfig,
} from '../providers/customization-provider';

import type {
  EntityCustomizationRequest,
  EntityCustomizationResponse,
  LayoutKind,
} from '@granit/entities-customization';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

interface UseEntityCustomizationArgs {
  readonly entityName: string;
  readonly layoutKind: LayoutKind;
}

/**
 * Read the active layout deltas for an entity/layoutKind pair. Disabled
 * when `entityName` is empty.
 */
export function useEntityCustomization({
  entityName,
  layoutKind,
}: UseEntityCustomizationArgs): UseQueryResult<EntityCustomizationResponse> {
  const config = useCustomizationConfig();

  return useQuery({
    queryKey: buildCustomizationQueryKey(config, 'layout', entityName, layoutKind),
    queryFn: () => getEntityCustomization(config.client, config.apiBase, entityName, layoutKind),
    enabled: entityName.length > 0,
  });
}

interface PutEntityCustomizationArgs {
  readonly entityName: string;
  readonly layoutKind: LayoutKind;
  readonly request: EntityCustomizationRequest;
}

/**
 * Replace the layout deltas for an entity/layoutKind. On success:
 * - the matching `useEntityCustomization` query is invalidated
 * - the optional `onFormCustomizationChanged(entityName)` provider hook
 *   fires (apps wire it to invalidate the entity manifest cache, since the
 *   layout flows through `@granit/react-entities`).
 */
export function usePutEntityCustomization(): UseMutationResult<
  EntityCustomizationResponse,
  Error,
  PutEntityCustomizationArgs
> {
  const config = useCustomizationConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entityName, layoutKind, request }: PutEntityCustomizationArgs) =>
      putEntityCustomization(config.client, config.apiBase, entityName, layoutKind, request),
    onSuccess: (_data, { entityName, layoutKind }) => {
      queryClient.invalidateQueries({
        queryKey: buildCustomizationQueryKey(config, 'layout', entityName, layoutKind),
      });
      config.onFormCustomizationChanged?.(entityName);
    },
  });
}
