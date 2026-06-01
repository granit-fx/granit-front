import { getAIWorkspace } from '@granit/ai';
import { useQuery } from '@tanstack/react-query';

import { buildAIQueryKey, useAIConfig } from '../providers/ai-provider';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch a single AI workspace by name.
 *
 * @example
 * ```tsx
 * const { data: workspace } = useAIWorkspace('default');
 * console.log(workspace?.model);
 * ```
 */
export function useAIWorkspace(
  name: string,
  options?: { enabled?: boolean }
): UseQueryResult<AIWorkspaceResponse> {
  const config = useAIConfig();

  return useQuery({
    queryKey: buildAIQueryKey(config, 'workspaces', name),
    queryFn: () => getAIWorkspace(config.client, config.basePath ?? '', name),
    enabled: options?.enabled ?? true,
  });
}
