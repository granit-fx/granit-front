import { useEffect, useRef } from 'react';

import { useLandingRoute } from '../api/use-landing-route.js';

import type { LandingRouteResponse } from '@granit/workspaces';

export interface UseLandingRedirectOptions {
  /**
   * Disable the redirect (e.g. when the user is already navigating
   * somewhere explicit). Defaults to `true`. Setting it to `false`
   * keeps the underlying `useLandingRoute` query enabled so the
   * resolved route stays warm in the cache.
   */
  readonly enabled?: boolean;
  /**
   * When provided, called instead of `navigate` once the route
   * resolves. Useful when the host wants to filter or log the
   * destination before redirecting.
   */
  readonly onResolved?: (route: LandingRouteResponse) => void;
}

export interface UseLandingRedirectReturn {
  /** True until the underlying query resolves. */
  readonly isResolving: boolean;
  /** The resolved landing route, or `undefined` while loading. */
  readonly resolved: LandingRouteResponse | undefined;
  /** True after the redirect has fired (one-shot guard). */
  readonly hasRedirected: boolean;
}

/**
 * One-shot redirect to the route resolved by the .NET 5-tier landing
 * resolver (`GET /me/landing-route`). Mount once on the post-login
 * layout — the hook fires `navigate(route)` exactly once after the
 * query lands, then stays inert.
 *
 * Stays router-agnostic: the host owns navigation. Pass
 * `(path) => navigate(path)` from React Router, or any equivalent
 * imperative API.
 *
 * The redirect short-circuits if `enabled` is false (or flips to
 * false) — apps can disable it on routes the user explicitly typed
 * to so a deep link isn't clobbered by the resolver.
 */
export function useLandingRedirect(
  navigate: (path: string) => void,
  options: UseLandingRedirectOptions = {}
): UseLandingRedirectReturn {
  const enabled = options.enabled ?? true;
  const { data: resolved, isLoading } = useLandingRoute({ enabled });
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !resolved || firedRef.current) return;
    firedRef.current = true;
    options.onResolved?.(resolved);
    navigate(resolved.route);
  }, [enabled, resolved, navigate, options]);

  return {
    isResolving: isLoading,
    resolved,
    hasRedirected: firedRef.current,
  };
}
