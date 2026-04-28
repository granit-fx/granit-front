import type {
  AdminAppSetting,
  BulkSettingEntry,
  BulkUpdateSettingsResponse,
  SettingValueResponse,
  SettingsMap,
  UpdateSettingValueRequest,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/** Scopes that expose admin bulk endpoints. `user` is per-user and has no bulk form. */
export type AdminSettingsScope = 'global' | 'tenant';

/**
 * Get all visible settings for a scope.
 *
 * `GET /settings/{scope}`
 */
export async function getSettings(
  client: AxiosInstance,
  basePath: string,
  scope: string
): Promise<SettingsMap> {
  const response = await client.get<SettingsMap>(`${basePath}/settings/${scope}`);
  return response.data;
}

/**
 * Get a single setting by name.
 *
 * `GET /settings/{scope}/{name}`
 */
export async function getSetting(
  client: AxiosInstance,
  basePath: string,
  scope: string,
  name: string
): Promise<SettingValueResponse> {
  const response = await client.get<SettingValueResponse>(
    `${basePath}/settings/${scope}/${encodeURIComponent(name)}`
  );
  return response.data;
}

/**
 * Create or update a setting value.
 *
 * `PUT /settings/{scope}/{name}`
 */
export async function updateSetting(
  client: AxiosInstance,
  basePath: string,
  scope: string,
  name: string,
  request: UpdateSettingValueRequest
): Promise<void> {
  await client.put(`${basePath}/settings/${scope}/${encodeURIComponent(name)}`, request);
}

/**
 * Delete (reset) a setting value so the cascade takes over.
 *
 * `DELETE /settings/{scope}/{name}`
 */
export async function deleteSetting(
  client: AxiosInstance,
  basePath: string,
  scope: string,
  name: string
): Promise<void> {
  await client.delete(`${basePath}/settings/${scope}/${encodeURIComponent(name)}`);
}

// ── Admin endpoints ─────────────────────────────────────────────────────────

/**
 * Get all application settings with admin metadata for a given scope.
 *
 * `GET {basePath}/settings/{scope}/definitions`
 */
export async function getAdminAppSettings(
  client: AxiosInstance,
  basePath: string,
  scope: AdminSettingsScope
): Promise<AdminAppSetting[]> {
  const response = await client.get<AdminAppSetting[]>(`${basePath}/settings/${scope}/definitions`);
  return response.data;
}

/**
 * Batch-update application settings for a given scope.
 *
 * `PUT {basePath}/settings/{scope}/bulk`
 *
 * The response always has HTTP 200 when the request body parses. Callers must
 * inspect `results` and filter `outcome !== "Updated"` to surface failures.
 * A 422 is returned only for structural validation failures on the request
 * envelope (empty list, too many entries).
 */
export async function saveAdminAppSettings(
  client: AxiosInstance,
  basePath: string,
  scope: AdminSettingsScope,
  settings: readonly BulkSettingEntry[]
): Promise<BulkUpdateSettingsResponse> {
  const response = await client.put<BulkUpdateSettingsResponse>(
    `${basePath}/settings/${scope}/bulk`,
    { settings }
  );
  return response.data;
}
