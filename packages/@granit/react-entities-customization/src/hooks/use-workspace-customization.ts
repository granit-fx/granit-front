import {
  getWorkspaceCustomization,
  putWorkspaceCustomization,
} from '@granit/entities-customization';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buildCustomizationQueryKey,
  useCustomizationConfig,
} from '../providers/customization-provider.js';

import type {
  WorkspaceCustomizationRequest,
  WorkspaceCustomizationResponse,
} from '@granit/entities-customization';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

interface UseWorkspaceCustomizationArgs {
  readonly workspaceName: string;
}

/** Read the active workspace layout deltas. Disabled when `workspaceName` is empty. */
export function useWorkspaceCustomization({
  workspaceName,
}: UseWorkspaceCustomizationArgs): UseQueryResult<WorkspaceCustomizationResponse> {
  const config = useCustomizationConfig();

  return useQuery({
    queryKey: buildCustomizationQueryKey(config, 'workspaces', workspaceName),
    queryFn: () => getWorkspaceCustomization(config.client, config.apiBase, workspaceName),
    enabled: workspaceName.length > 0,
  });
}

interface PutWorkspaceCustomizationArgs {
  readonly workspaceName: string;
  readonly request: WorkspaceCustomizationRequest;
}

/**
 * Replace the workspace layout deltas. Invalidates the matching read query
 * and fires the `onWorkspaceCustomizationChanged` hook so apps can refresh
 * the workspace manifest cache (`@granit/react-workspaces`).
 */
export function usePutWorkspaceCustomization(): UseMutationResult<
  WorkspaceCustomizationResponse,
  Error,
  PutWorkspaceCustomizationArgs
> {
  const config = useCustomizationConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceName, request }: PutWorkspaceCustomizationArgs) =>
      putWorkspaceCustomization(config.client, config.apiBase, workspaceName, request),
    onSuccess: (_data, { workspaceName }) => {
      queryClient.invalidateQueries({
        queryKey: buildCustomizationQueryKey(config, 'workspaces', workspaceName),
      });
      config.onWorkspaceCustomizationChanged?.(workspaceName);
    },
  });
}
