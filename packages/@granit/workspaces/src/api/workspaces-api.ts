import type {
  LandingRouteResponse,
  SetPinnedLandingRouteRequest,
  WorkspaceTreeResponse,
} from '../types/index.js';
import type { AxiosInstance, AxiosRequestConfig } from '@granit/api-client';

/**
 * Returns the workspace tree the requesting user can see, with
 * permission-filtered sections / items.
 *
 * `GET {basePath}/workspaces`
 */
export async function getWorkspaceTree(
  client: AxiosInstance,
  basePath: string,
  config?: AxiosRequestConfig
): Promise<WorkspaceTreeResponse> {
  const { data } = await client.get<WorkspaceTreeResponse>(`${basePath}/workspaces`, config);
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
