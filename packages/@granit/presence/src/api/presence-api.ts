import { buildApiUrl } from '@granit/api-client';

import { PRESENCE_DEFAULTS } from '../constants';

import type {
  BatchPresenceRequest,
  BatchPresenceResponse,
  HeartbeatRequest,
  PresenceResponse,
  SetPresenceRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { UserId } from '@granit/types';

// ---------------------------------------------------------------------------
// Self endpoints
// ---------------------------------------------------------------------------

/**
 * Returns the current user's presence snapshot.
 *
 * `GET {basePath}/presence/my`
 *
 * Requires authentication only — no extra permission gate.
 */
export async function getMyPresence(
  client: AxiosInstance,
  basePath: string
): Promise<PresenceResponse> {
  const { data } = await client.get<PresenceResponse>(buildApiUrl(basePath, 'presence', 'my'));
  return data;
}

/**
 * Sets the current user's manual override.
 *
 * `PUT {basePath}/presence/my`
 *
 * Requires `Presence.Self.Manage`.
 */
export async function setMyPresence(
  client: AxiosInstance,
  basePath: string,
  request: SetPresenceRequest
): Promise<PresenceResponse> {
  const { data } = await client.put<PresenceResponse>(
    buildApiUrl(basePath, 'presence', 'my'),
    request
  );
  return data;
}

/**
 * Clears the current user's manual override — equivalent to setting
 * `manualStatus = "Available"`.
 *
 * `DELETE {basePath}/presence/my/override`
 *
 * Requires `Presence.Self.Manage`.
 */
export async function clearMyPresenceOverride(
  client: AxiosInstance,
  basePath: string
): Promise<PresenceResponse> {
  const { data } = await client.delete<PresenceResponse>(
    buildApiUrl(basePath, 'presence', 'my', 'override')
  );
  return data;
}

/**
 * Records a heartbeat for the current user. Should be called periodically
 * while the tab is visible (recommended cadence: 30–45 s).
 *
 * `POST {basePath}/presence/my/poll`
 *
 * Requires `Presence.Self.Manage`. The server clamps `idleSeconds` to
 * `[0, 2 × OfflineThreshold]`; clients can send any non-negative value.
 */
export async function pollMyPresence(
  client: AxiosInstance,
  basePath: string,
  request: HeartbeatRequest
): Promise<PresenceResponse> {
  const { data } = await client.post<PresenceResponse>(
    buildApiUrl(basePath, 'presence', 'my', 'poll'),
    request
  );
  return data;
}

// ---------------------------------------------------------------------------
// Other users
// ---------------------------------------------------------------------------

/**
 * Returns presence for an arbitrary user.
 *
 * `GET {basePath}/presence/users/{userId}`
 *
 * Requires `Presence.Users.Read`. Never 404s — unknown users return
 * `effectiveStatus = "Offline"` with `lastSeenUtc = null`.
 */
export async function getUserPresence(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<PresenceResponse> {
  const { data } = await client.get<PresenceResponse>(
    buildApiUrl(basePath, 'presence', 'users', encodeURIComponent(userId))
  );
  return data;
}

/**
 * Batch presence lookup.
 *
 * `POST {basePath}/presence/users/batch`
 *
 * Requires `Presence.Users.Read`. The server caps the batch at
 * `MaxBatchSize` (200). Callers that need more must chunk.
 */
export async function getBatchPresence(
  client: AxiosInstance,
  basePath: string,
  request: BatchPresenceRequest
): Promise<BatchPresenceResponse> {
  const { data } = await client.post<BatchPresenceResponse>(
    buildApiUrl(basePath, 'presence', 'users', 'batch'),
    request
  );
  return data;
}

// ---------------------------------------------------------------------------
// Higher-level batch helpers
// ---------------------------------------------------------------------------

/**
 * Returns the deduplicated, sorted list of user IDs — callers do not need to
 * worry about ordering or duplicates when picking IDs from multiple sources.
 */
export function normalizeUserIds(userIds: readonly UserId[]): UserId[] {
  return Array.from(new Set(userIds))
    .filter((id) => id.length > 0)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Fetches presence for a list of users in one (or more) batch calls.
 *
 * Lists larger than the server cap (`PRESENCE_DEFAULTS.MaxBatchSize`) are
 * chunked automatically and resolved in parallel.
 *
 * Requires `Presence.Users.Read`.
 */
export async function fetchBatchPresence(
  client: AxiosInstance,
  basePath: string,
  userIds: readonly UserId[]
): Promise<BatchPresenceResponse> {
  const maxBatch = PRESENCE_DEFAULTS.MaxBatchSize;
  if (userIds.length <= maxBatch) {
    return getBatchPresence(client, basePath, { userIds });
  }
  // Server cap exceeded — chunk and fan out in parallel.
  const chunks: UserId[][] = [];
  for (let i = 0; i < userIds.length; i += maxBatch) {
    chunks.push(userIds.slice(i, i + maxBatch));
  }
  const responses = await Promise.all(
    chunks.map((chunk) => getBatchPresence(client, basePath, { userIds: chunk }))
  );
  const merged: Record<UserId, PresenceResponse> = {};
  for (const { presences } of responses) {
    Object.assign(merged, presences);
  }
  return { presences: merged };
}
