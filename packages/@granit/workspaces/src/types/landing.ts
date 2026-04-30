/**
 * Tier of the landing-route precedence chain that resolved the route
 * returned by `GET /me/landing-route`. Mirrors
 * `Granit.Workspaces.Endpoints.Landing.LandingRouteSource` — ADR-048's
 * 5-tier resolver, highest to lowest:
 *
 * 1. `PersonalSticky` — last-visited route, sticky across sessions
 * 2. `PersonalPinned` — set explicitly via `PUT /me/landing-route/pinned`
 * 3. `Role` — default route attached to one of the user's roles
 * 4. `Tenant` — tenant-wide default
 * 5. `Framework` — fallback configured via `WorkspacesEndpointsOptions`
 */
export type LandingRouteSource =
  | 'PersonalSticky'
  | 'PersonalPinned'
  | 'Role'
  | 'Tenant'
  | 'Framework';

/**
 * Response payload for `GET /me/landing-route`. Mirrors
 * `Granit.Workspaces.Endpoints.Dtos.LandingRouteResponse`.
 */
export interface LandingRouteResponse {
  /** Resolved internal route (e.g. `"/w/Granit.Framework"`). */
  readonly route: string;
  /** Tier of the precedence chain that produced the route. */
  readonly source: LandingRouteSource;
}

/**
 * Request body for `PUT /me/landing-route/pinned`. Mirrors
 * `Granit.Workspaces.Endpoints.Dtos.SetPinnedLandingRouteRequest`.
 *
 * Pass `null` to clear the personal pin and let the resolver fall through
 * to the next tier (Role / Tenant / Framework).
 */
export interface SetPinnedLandingRouteRequest {
  readonly route: string | null;
}
