import type {
  LandingRouteResponse,
  SetPinnedLandingRouteRequest,
  WorkspaceTreeResponse,
} from '../types/index';
import type { AxiosInstance, AxiosRequestConfig } from '@granit/api-client';

/**
 * Returns the workspace tree the requesting user can see, with
 * permission-filtered sections / items.
 *
 * `GET {basePath}/workspaces`
 *
 * Pass `includeShells: false` to omit Framework shell workspaces from the
 * response — the backend skips computing shell contributions entirely,
 * which reduces payload size for Tenant-scope contexts.
 */
export async function getWorkspaceTree(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly includeShells?: boolean } & AxiosRequestConfig
): Promise<WorkspaceTreeResponse> {
  const { includeShells, ...config } = options ?? {};
  const { data } = await client.get<WorkspaceTreeResponse>(`${basePath}/workspaces`, {
    ...config,
    params:
      includeShells === undefined
        ? config.params
        : { ...(config.params as Record<string, unknown> | undefined), includeShells },
  });
  return data;
}

/**
 * Resolves the requesting user's landing route via the 5-tier precedence
 * chain (PersonalSticky / PersonalPinned / Role / Tenant / Framework).
 *
 * `GET {basePath}/me/landing-route`
 */
export async function getLandingRoute(
  client: AxiosInstance,
  basePath: string,
  config?: AxiosRequestConfig
): Promise<LandingRouteResponse> {
  const { data } = await client.get<LandingRouteResponse>(`${basePath}/me/landing-route`, config);
  return data;
}

/**
 * Pins (or clears, with `route: null`) the requesting user's preferred
 * landing route in the precedence chain.
 *
 * `PUT {basePath}/me/landing-route/pinned`
 */
export async function setPinnedLandingRoute(
  client: AxiosInstance,
  basePath: string,
  request: SetPinnedLandingRouteRequest
): Promise<void> {
  await client.put(`${basePath}/me/landing-route/pinned`, request);
}
