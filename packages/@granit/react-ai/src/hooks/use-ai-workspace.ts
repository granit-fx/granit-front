import { getAIWorkspace } from '@granit/ai';
import { useQuery } from '@tanstack/react-query';

import { useAIConfig } from '../providers/ai-provider';

import { aiKeys } from './query-keys';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch a single AI workspace by key.
 *
 * @example
 * ```tsx
 * const { data: workspace } = useAIWorkspace('default');
 * console.log(workspace?.model);
 * ```
 */
export function useAIWorkspace(
  key: string,
  options?: { enabled?: boolean }
): UseQueryResult<AIWorkspaceResponse> {
  const config = useAIConfig();

  return useQuery({
    queryKey: aiKeys.workspace(config.queryKeyPrefix, key),
    queryFn: () => getAIWorkspace(config.client, config.basePath, key),
    enabled: options?.enabled ?? true,
  });
}
