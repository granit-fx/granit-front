import { useGranitClient } from '@granit/react-api-client';
import { getLandingRoute, setPinnedLandingRoute } from '@granit/workspaces';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { LandingRouteResponse, SetPinnedLandingRouteRequest } from '@granit/workspaces';

const API_PREFIX = '/api/v1';

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
    queryFn: ({ signal }) => getLandingRoute(api, API_PREFIX, { signal }),
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
    mutationFn: (request: SetPinnedLandingRouteRequest) =>
      setPinnedLandingRoute(api, API_PREFIX, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landingRouteQueryKey() }).catch(() => {});
    },
  });
}
