import type {
  IdentityUser,
  IdentityUserCacheStats,
  IdentityUserCacheSyncAllResult,
  IdentityUserCacheSyncStaleResult,
  IdentityUserListParams,
  IdentityUserPage,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { UserId } from '@granit/types';

/**
 * Search cached identity users with optional filtering and pagination.
 *
 * `GET {basePath}/`
 */
export async function searchUsers(
  client: AxiosInstance,
  basePath: string,
  params?: IdentityUserListParams
): Promise<IdentityUserPage> {
  const response = await client.get<IdentityUserPage>(`${basePath}/`, { params });
  return response.data;
}

/**
 * Fetch a single cached identity user by ID.
 *
 * `GET {basePath}/{userId}`
 */
export async function getUserById(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<IdentityUser> {
  const response = await client.get<IdentityUser>(`${basePath}/${encodeURIComponent(userId)}`);
  return response.data;
}

/**
 * Resolve multiple users by their IDs in a single request.
 *
 * `POST {basePath}/batch`
 */
export async function batchResolveUsers(
  client: AxiosInstance,
  basePath: string,
  userIds: readonly UserId[]
): Promise<readonly IdentityUser[]> {
  const response = await client.post<readonly IdentityUser[]>(`${basePath}/batch`, { userIds });
  return response.data;
}

/**
 * Fetch cache statistics (total entries, stale entries, sync timestamps).
 *
 * `GET {basePath}/stats`
 */
export async function getCacheStats(
  client: AxiosInstance,
  basePath: string
): Promise<IdentityUserCacheStats> {
  const response = await client.get<IdentityUserCacheStats>(`${basePath}/stats`);
  return response.data;
}

/**
 * Trigger a cache sync for specific user IDs and return the refreshed records.
 *
 * `POST {basePath}/sync`
 */
export async function syncUsers(
  client: AxiosInstance,
  basePath: string,
  userIds: readonly UserId[]
): Promise<readonly IdentityUser[]> {
  const response = await client.post<readonly IdentityUser[]>(`${basePath}/sync`, { userIds });
  return response.data;
}

/**
 * Trigger a full cache sync for all identity provider users.
 *
 * `POST {basePath}/sync-all`
 */
export async function syncAllUsers(
  client: AxiosInstance,
  basePath: string
): Promise<IdentityUserCacheSyncAllResult> {
  const response = await client.post<IdentityUserCacheSyncAllResult>(`${basePath}/sync-all`);
  return response.data;
}

/**
 * Trigger a cache sync for stale entries only.
 *
 * `POST {basePath}/sync-stale`
 */
export async function syncStaleUsers(
  client: AxiosInstance,
  basePath: string
): Promise<IdentityUserCacheSyncStaleResult> {
  const response = await client.post<IdentityUserCacheSyncStaleResult>(`${basePath}/sync-stale`);
  return response.data;
}

/**
 * Erase a user's cached data (hard delete).
 *
 * `DELETE {basePath}/{userId}`
 */
export async function eraseUserCache(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(userId)}`);
}

/**
 * Pseudonymize a user's cached data (GDPR Art. 18 — replaces PII with
 * anonymized placeholders while preserving the entry for referential integrity).
 *
 * `PATCH {basePath}/{userId}/pseudonymize`
 */
export async function pseudonymizeUserCache(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<void> {
  await client.patch(`${basePath}/${encodeURIComponent(userId)}/pseudonymize`);
}
