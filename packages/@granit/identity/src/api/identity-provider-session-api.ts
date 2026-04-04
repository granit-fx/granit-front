import type { IdentityDeviceActivity, IdentitySession, IdentitySessionId } from '../types/index.js';
import type { UserId } from '@granit/types';
import type { AxiosInstance } from 'axios';

/**
 * List active sessions for a user.
 *
 * `GET {basePath}/users/{userId}/sessions`
 */
export async function fetchUserSessions(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<readonly IdentitySession[]> {
  const response = await client.get<readonly IdentitySession[]>(
    `${basePath}/users/${encodeURIComponent(userId)}/sessions`
  );
  return response.data;
}

/**
 * List device activity for a user.
 *
 * `GET {basePath}/users/{userId}/devices`
 */
export async function fetchUserDeviceActivity(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<readonly IdentityDeviceActivity[]> {
  const response = await client.get<readonly IdentityDeviceActivity[]>(
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
  sessionId: IdentitySessionId
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
