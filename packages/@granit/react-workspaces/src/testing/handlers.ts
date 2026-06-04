import { noContent } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { mockDefaultLandingRoute, mockWorkspaceTree } from './data';

import type { LandingRouteResponse } from '@granit/workspaces';

/** Default workspaces base path — mirrors the `@granit/react-workspaces` hooks. */
const DEFAULT_BASE_PATH = '/api/v1/workspaces';

/**
 * Create stateful MSW handlers for the workspaces endpoints.
 *
 * The workspace tree lives under `{baseUrl}` (`GET /api/v1/workspaces`),
 * while the landing-route resolver hangs off the API root under
 * `/me/landing-route` — `@granit/react-workspaces` issues both against the
 * same `/api/v1` prefix, so the API root is derived by stripping the trailing
 * `/workspaces` segment off `baseUrl`. The pinned route mutates in-memory
 * state — a `PUT …/pinned` is reflected by the subsequent
 * `GET …/me/landing-route`.
 *
 * @param baseUrl - Workspaces base path (default: `/api/v1/workspaces`)
 */
export function createWorkspacesHandlers(baseUrl = DEFAULT_BASE_PATH) {
  // `/me/landing-route` is mounted on the API root, one level above the
  // workspaces collection — derive it from `baseUrl`.
  const apiRoot = baseUrl.replace(/\/workspaces$/, '');

  let pinnedRoute: string | null = null;

  return [
    // ── Workspace tree ───────────────────────────────────────────────────────
    http.get(baseUrl, () => HttpResponse.json(mockWorkspaceTree)),

    // ── Landing route (5-tier resolver) ──────────────────────────────────────
    http.get(`${apiRoot}/me/landing-route`, () =>
      HttpResponse.json<LandingRouteResponse>(
        pinnedRoute ? { route: pinnedRoute, source: 'PersonalPinned' } : mockDefaultLandingRoute
      )
    ),

    http.put(`${apiRoot}/me/landing-route/pinned`, async ({ request }) => {
      const body = (await request.json()) as { route: string | null } | null;
      pinnedRoute = body?.route ?? null;
      return noContent();
    }),
  ];
}
