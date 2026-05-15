import { useGranitClient } from '@granit/react-api-client';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { LandingRouteResponse, SetPinnedLandingRouteRequest } from '@granit/workspaces';

const LANDING_ROUTE_PATH = '/api/v1/me/landing-route';
const LANDING_ROUTE_PINNED_PATH = '/api/v1/me/landing-route/pinned';

/** Cache key for the resolved landing route. */
export const landingRouteQueryKey = () => ['workspaces', 'landing-route'] as const;

/**
 * `GET /api/v1/me/landing-route` — returns the route the user should be sent to
 * after login, plus the tier of the 5-tier resolver that produced it
 * (PersonalSticky / PersonalPinned / Role / Tenant / Framework). Mirrors
 * `Granit.Workspaces.Endpoints.LandingRouteEndpoints.GetAsync`.
 *
 * Short staleTime — the landing route changes whenever the user pins a
 * new one or visits a workspace (PersonalSticky updates server-side), so
 * we don't want to keep stale answers around past a minute.
 */
export function useLandingRoute(
  options: { readonly enabled?: boolean } = {}
): UseQueryResult<LandingRouteResponse> {
  const api = useGranitClient();
  return useQuery({
    queryKey: landingRouteQueryKey(),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<LandingRouteResponse>(LANDING_ROUTE_PATH, { signal });
      return data;
    },
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}

/**
 * `PUT /api/v1/me/landing-route/pinned` — sets (or clears, with `route: null`)
 * the user's personal pin in the precedence chain. Mirrors
 * `Granit.Workspaces.Endpoints.LandingRouteEndpoints.SetPinnedAsync`.
 *
 * Invalidates the cached landing-route on success so a subsequent
 * `useLandingRoute()` reads the updated tier.
 */
export function useSetLandingPin(): UseMutationResult<void, Error, SetPinnedLandingRouteRequest> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: SetPinnedLandingRouteRequest) => {
      await api.put(LANDING_ROUTE_PINNED_PATH, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landingRouteQueryKey() }).catch(() => {});
    },
  });
}
