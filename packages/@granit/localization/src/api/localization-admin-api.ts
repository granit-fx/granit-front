import type { AxiosInstance } from '@granit/api-client';

/**
 * Set a localization override (create or update).
 *
 * `PUT {basePath}/overrides/{resourceName}/{cultureName}/{key}` where
 * `basePath` is the localization module root (e.g. `/api/v1/localization`).
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
    `${basePath}/overrides/${encodeURIComponent(resourceName)}/${encodeURIComponent(cultureName)}/${encodeURIComponent(key)}`,
    { value }
  );
}

/**
 * Delete a localization override.
 *
 * `DELETE {basePath}/overrides/{resourceName}/{cultureName}/{key}` where
 * `basePath` is the localization module root (e.g. `/api/v1/localization`).
 */
export async function deleteLocalizationOverride(
  client: AxiosInstance,
  basePath: string,
  resourceName: string,
  cultureName: string,
  key: string
): Promise<void> {
  await client.delete(
    `${basePath}/overrides/${encodeURIComponent(resourceName)}/${encodeURIComponent(cultureName)}/${encodeURIComponent(key)}`
  );
}
