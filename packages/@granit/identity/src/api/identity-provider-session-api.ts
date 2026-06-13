import type { UserDeviceResponse, UserSessionId, UserSessionResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { UserId } from '@granit/types';

// ---------------------------------------------------------------------------
// Admin session/device management — another user's sessions, served by the
// canonical session manager. Mirrors Granit.Identity.Endpoints
// IdentityProviderSession{Read,Write}Endpoints + IdentityProviderDeviceEndpoints.
//
// Authorization is permission-based on the backend (Identity.Sessions.Read /
// Identity.Sessions.Manage); the front issues the calls and surfaces 403/501.
// ---------------------------------------------------------------------------

/**
 * List active sessions for a user.
 *
 * `GET {basePath}/users/{userId}/sessions`
 */
export async function listUserSessions(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<readonly UserSessionResponse[]> {
  const response = await client.get<readonly UserSessionResponse[]>(
    `${basePath}/users/${encodeURIComponent(userId)}/sessions`
  );
  return response.data;
}

/**
 * List the devices a user has signed in from.
 *
 * `GET {basePath}/users/{userId}/devices`
 */
export async function listUserDevices(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<readonly UserDeviceResponse[]> {
  const response = await client.get<readonly UserDeviceResponse[]>(
    `${basePath}/users/${encodeURIComponent(userId)}/devices`
  );
  return response.data;
}

/**
 * Terminate a specific session. May return 501 if `supportsIndividualSessionTermination` is false.
 *
 * `DELETE {basePath}/users/{userId}/sessions/{sessionId}`
 */
export async function terminateSession(
  client: AxiosInstance,
  basePath: string,
  userId: UserId,
  sessionId: UserSessionId
): Promise<void> {
  await client.delete(
    `${basePath}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`
  );
}

/**
 * Terminate all active sessions for a user.
 *
 * `DELETE {basePath}/users/{userId}/sessions`
 */
export async function terminateAllSessions(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<void> {
  await client.delete(`${basePath}/users/${encodeURIComponent(userId)}/sessions`);
}
