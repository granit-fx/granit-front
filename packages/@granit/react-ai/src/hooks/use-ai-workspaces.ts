import { listAIWorkspaces } from '@granit/ai';
import { useQuery } from '@tanstack/react-query';

import { buildAIQueryKey, useAIConfig } from '../providers/ai-provider.js';

import type { AIWorkspaceListResponse } from '@granit/ai';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch all AI workspaces.
 *
 * @example
 * ```tsx
 * const { data } = useAIWorkspaces();
 * data?.workspaces.map(ws => <div key={ws.name}>{ws.name}</div>);
 * ```
 */
export function useAIWorkspaces(options?: {
  enabled?: boolean;
}): UseQueryResult<AIWorkspaceListResponse> {
  const config = useAIConfig();

  return useQuery({
    queryKey: buildAIQueryKey(config, 'workspaces'),
    queryFn: () => listAIWorkspaces(config.client, config.basePath ?? ''),
    enabled: options?.enabled ?? true,
  });
}
