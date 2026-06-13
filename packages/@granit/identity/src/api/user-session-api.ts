import type {
  UserDeviceResponse,
  UserSessionId,
  UserSessionResponse,
  UserSessionsRevokedResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

// ---------------------------------------------------------------------------
// Self-service session/device management — the caller's OWN sessions and
// devices, served by the canonical session manager and agnostic to the auth
// transport (BFF cookie or bearer token). Mirrors Granit.Identity.Endpoints
// UserSessionEndpoints + UserDeviceEndpoints.
//
// These replace the removed `/bff/sessions` surface (granit-dotnet #2692): the
// canonical `/sessions` (+ `/devices`) endpoints require no permission, only an
// authenticated caller. Goes through the centralized Axios client so the
// CSRF/auth/tenant interceptors apply.
// ---------------------------------------------------------------------------

/**
 * List the caller's own active sessions.
 *
 * `GET {basePath}/sessions`
 */
export async function listMySessions(
  client: AxiosInstance,
  basePath: string
): Promise<readonly UserSessionResponse[]> {
  const response = await client.get<readonly UserSessionResponse[]>(`${basePath}/sessions`);
  return response.data;
}

/**
 * List the caller's own devices.
 *
 * `GET {basePath}/devices`
 */
export async function listMyDevices(
  client: AxiosInstance,
  basePath: string
): Promise<readonly UserDeviceResponse[]> {
  const response = await client.get<readonly UserDeviceResponse[]>(`${basePath}/devices`);
  return response.data;
}

/**
 * Revoke one of the caller's own sessions by ID.
 *
 * The current session cannot be revoked this way — use logout instead.
 *
 * `DELETE {basePath}/sessions/{sessionId}`
 */
export async function revokeMySession(
  client: AxiosInstance,
  basePath: string,
  sessionId: UserSessionId
): Promise<void> {
  await client.delete(`${basePath}/sessions/${encodeURIComponent(sessionId)}`);
}

/**
 * Revoke all of the caller's sessions except the current one
 * ("log out everywhere else").
 *
 * `DELETE {basePath}/sessions`
 *
 * @returns The number of sessions revoked.
 */
export async function revokeMyOtherSessions(
  client: AxiosInstance,
  basePath: string
): Promise<UserSessionsRevokedResponse> {
  const response = await client.delete<UserSessionsRevokedResponse>(`${basePath}/sessions`);
  return response.data;
}
