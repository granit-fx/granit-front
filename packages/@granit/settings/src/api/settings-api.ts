import type {
  AdminAppSetting,
  SettingValueResponse,
  SettingsMap,
  UpdateSettingValueRequest,
} from '../types/index.js';
import type { AxiosInstance } from 'axios';

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
 * Get all application settings with admin metadata.
 *
 * `GET {basePath}/admin/config/settings`
 */
export async function getAdminAppSettings(
  client: AxiosInstance,
  basePath: string
): Promise<AdminAppSetting[]> {
  const response = await client.get<AdminAppSetting[]>(`${basePath}/admin/config/settings`);
  return response.data;
}

/**
 * Batch-update application settings.
 *
 * `PUT {basePath}/admin/config/settings`
 */
export async function saveAdminAppSettings(
  client: AxiosInstance,
  basePath: string,
  settings: ReadonlyArray<{ key: string; value: string }>
): Promise<void> {
  await client.put(`${basePath}/admin/config/settings`, settings);
}
