import type { AdminLanguage } from '../types.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List all languages with admin status.
 *
 * `GET {basePath}/localization/languages`
 */
export async function listLanguages(
  client: AxiosInstance,
  basePath: string
): Promise<AdminLanguage[]> {
  const response = await client.get<AdminLanguage[]>(`${basePath}/localization/languages`);
  return response.data;
}

/**
 * Enable or disable a language.
 *
 * `PUT {basePath}/localization/languages/{cultureName}`
 */
export async function updateLanguageStatus(
  client: AxiosInstance,
  basePath: string,
  cultureName: string,
  isEnabled: boolean
): Promise<void> {
  await client.put(`${basePath}/localization/languages/${encodeURIComponent(cultureName)}`, {
    isEnabled,
  });
}

/**
 * Set a localization override (create or update).
 *
 * `PUT {basePath}/localization/overrides/{resourceName}/{cultureName}/{key}`
 */
export async function setLocalizationOverride(
  client: AxiosInstance,
  basePath: string,
  resourceName: string,
  cultureName: string,
  key: string,
  value: string
): Promise<void> {
  await client.put(
    `${basePath}/localization/overrides/${encodeURIComponent(resourceName)}/${encodeURIComponent(cultureName)}/${encodeURIComponent(key)}`,
    { value }
  );
}

/**
 * Delete a localization override.
 *
 * `DELETE {basePath}/localization/overrides/{resourceName}/{cultureName}/{key}`
 */
export async function deleteLocalizationOverride(
  client: AxiosInstance,
  basePath: string,
  resourceName: string,
  cultureName: string,
  key: string
): Promise<void> {
  await client.delete(
    `${basePath}/localization/overrides/${encodeURIComponent(resourceName)}/${encodeURIComponent(cultureName)}/${encodeURIComponent(key)}`
  );
}
