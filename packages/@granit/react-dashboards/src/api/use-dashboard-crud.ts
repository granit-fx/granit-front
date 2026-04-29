import { useGranitClient } from '@granit/react-api-client';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { DashboardDefinition, DashboardDefinitionDescriptor } from '@granit/dashboards';

const DASHBOARD_PATH = '/dashboards';

/**
 * Cache keys for dashboard CRUD entries. Exported for tests + sibling hooks
 * that need to invalidate / read the same query without going through the
 * hook itself.
 *
 * - `['dashboards']` — list of descriptors.
 * - `['dashboards', name]` — single full definition.
 *
 * The list query is the cheaper read (descriptors omit nothing today, but
 * the split lets the backend evolve the descriptor shape without breaking
 * the get-by-name contract).
 */
export const dashboardListQueryKey = () => ['dashboards'] as const;
export const dashboardQueryKey = (name: string) => ['dashboards', name] as const;

/**
 * `GET /dashboards` — returns descriptors for every dashboard the caller is
 * allowed to read. Mirrors `IDashboardDefinitionRegistry.list()` (B4-write).
 *
 * Long staleTime — the list is mostly admin-driven (manual create / edit /
 * delete); we don't pay a refetch on every focus.
 */
export function useDashboards(
  options: {
    readonly enabled?: boolean;
  } = {}
): UseQueryResult<readonly DashboardDefinitionDescriptor[]> {
  const api = useGranitClient();
  return useQuery({
    queryKey: dashboardListQueryKey(),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<readonly DashboardDefinitionDescriptor[]>(DASHBOARD_PATH, {
        signal,
      });
      return data;
    },
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}

/**
 * `GET /dashboards/{name}` — returns the full definition for one dashboard.
 * Mirrors `IDashboardDefinitionRegistry.get(name)` (B4-write).
 *
 * Used by the editor: the builder needs the widgets array to seed
 * `<EditableDashboard>`, which the descriptor already carries — the split
 * exists so the backend can evolve independently.
 */
export function useDashboard(
  name: string,
  options: { readonly enabled?: boolean } = {}
): UseQueryResult<DashboardDefinition> {
  const api = useGranitClient();
  return useQuery({
    queryKey: dashboardQueryKey(name),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<DashboardDefinition>(
        `${DASHBOARD_PATH}/${encodeURIComponent(name)}`,
        { signal }
      );
      return data;
    },
    enabled: (options.enabled ?? true) && name.length > 0,
    staleTime: 60_000,
  });
}

/**
 * `POST /dashboards` — creates a new dashboard. Body is the full
 * {@link DashboardDefinition}. On success, invalidates the list query so
 * the catalog refetches.
 */
export function useCreateDashboard(): UseMutationResult<
  DashboardDefinition,
  Error,
  DashboardDefinition
> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (definition: DashboardDefinition) => {
      const { data } = await api.post<DashboardDefinition>(DASHBOARD_PATH, definition);
      return data;
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: dashboardListQueryKey() });
      queryClient.setQueryData(dashboardQueryKey(created.name), created);
    },
  });
}

/**
 * `PUT /dashboards/{name}` — updates an existing dashboard. Body is the
 * full {@link DashboardDefinition} (the editor commits the whole shape;
 * widget-level diff endpoints are out of scope until B4 ships them).
 *
 * On success, refreshes the per-dashboard cache + invalidates the list so
 * descriptor changes (renames, version bumps) propagate.
 */
export function useUpdateDashboard(): UseMutationResult<
  DashboardDefinition,
  Error,
  DashboardDefinition
> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (definition: DashboardDefinition) => {
      const { data } = await api.put<DashboardDefinition>(
        `${DASHBOARD_PATH}/${encodeURIComponent(definition.name)}`,
        definition
      );
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(dashboardQueryKey(updated.name), updated);
      void queryClient.invalidateQueries({ queryKey: dashboardListQueryKey() });
    },
  });
}

/**
 * `DELETE /dashboards/{name}` — removes a dashboard. Pass the dashboard
 * name (the wire identifier, `Granit.{Module}.{Name}`).
 *
 * On success, drops the per-dashboard cache entry + invalidates the list.
 */
export function useDeleteDashboard(): UseMutationResult<void, Error, string> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      await api.delete(`${DASHBOARD_PATH}/${encodeURIComponent(name)}`);
    },
    onSuccess: (_void, name) => {
      queryClient.removeQueries({ queryKey: dashboardQueryKey(name) });
      void queryClient.invalidateQueries({ queryKey: dashboardListQueryKey() });
    },
  });
}
