import { useGranitClient } from '@granit/react-api-client';
import { getWorkspaceTree } from '@granit/workspaces';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { WorkspaceTreeResponse } from '@granit/workspaces';

const API_PREFIX = '/api/v1';

/**
 * Cache key for the workspace tree. Bumped via
 * `queryClient.invalidateQueries({ queryKey: ['workspaces', 'tree'] })`
 * whenever a permission change should re-filter the visible workspaces.
 */
export const workspaceTreeQueryKey = () => ['workspaces', 'tree'] as const;

/**
 * `GET /api/v1/workspaces` — returns the workspace tree the requesting user can
 * see, with permission-filtered sections / items, sorted by `order` then
 * `name`. Mirrors `Granit.Workspaces.Endpoints.WorkspacesEndpoints`.
 *
 * 5-minute staleTime — the tree is shaped by module DI + permission
 * grants, neither of which churns mid-session. The .NET handler caches
 * the response per `(user-perms-hash, culture)` so even an aggressive
 * refetch usually short-circuits server-side.
 */
export function useWorkspaces(
  options: { readonly enabled?: boolean } = {}
): UseQueryResult<WorkspaceTreeResponse> {
  const api = useGranitClient();
  return useQuery({
    queryKey: workspaceTreeQueryKey(),
    queryFn: ({ signal }) => getWorkspaceTree(api, API_PREFIX, { signal }),
    enabled: options.enabled ?? true,
    staleTime: 5 * 60_000,
  });
}
