import { useGranitClient } from '@granit/react-api-client';
import { getWorkspaceTree } from '@granit/workspaces';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { WorkspaceTreeResponse } from '@granit/workspaces';

const API_PREFIX = '/api/v1';

/**
 * Cache key for the workspace tree.
 *
 * Pass the same `includeShells` value used in `useWorkspaces` so
 * invalidations by key are scoped to the same variant:
 * `queryClient.invalidateQueries({ queryKey: ['workspaces', 'tree'] })`
 * clears ALL variants (prefix match); a fully-qualified key invalidates
 * only the matching variant.
 */
export const workspaceTreeQueryKey = (includeShells?: boolean) =>
  ['workspaces', 'tree', includeShells] as const;

/**
 * `GET /api/v1/workspaces` — returns the workspace tree the requesting user can
 * see, with permission-filtered sections / items, sorted by `order` then
 * `name`. Mirrors `Granit.Workspaces.Endpoints.WorkspacesEndpoints`.
 *
 * 5-minute staleTime — the tree is shaped by module DI + permission
 * grants, neither of which churns mid-session. The .NET handler caches
 * the response per `(user-perms-hash, culture)` so even an aggressive
 * refetch usually short-circuits server-side.
 *
 * Pass `includeShells: false` to omit Framework shell workspaces — the
 * Tenant-scope sidebar switcher benefits from this since it already
 * filters shells out client-side; skipping them server-side halves the
 * payload.
 */
export function useWorkspaces(
  options: { readonly enabled?: boolean; readonly includeShells?: boolean } = {}
): UseQueryResult<WorkspaceTreeResponse> {
  const api = useGranitClient();
  return useQuery({
    queryKey: workspaceTreeQueryKey(options.includeShells),
    queryFn: ({ signal }) =>
      getWorkspaceTree(api, API_PREFIX, { signal, includeShells: options.includeShells }),
    enabled: options.enabled ?? true,
    staleTime: 5 * 60_000,
  });
}
