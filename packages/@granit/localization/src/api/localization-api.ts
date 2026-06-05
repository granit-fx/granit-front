import type { ApplicationLocalizationResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Fetches all localization resources for the requested culture, plus the
 * list of available languages. Anonymous endpoint, cached 1h.
 *
 * `GET {basePath}` — optional `cultureName` query parameter (BCP 47 format).
 * If omitted, the backend resolves the culture from the `Accept-Language`
 * header.
 */
export async function getApplicationLocalization(
  client: AxiosInstance,
  basePath: string,
  cultureName?: string
): Promise<ApplicationLocalizationResponse> {
  const { data } = await client.get<ApplicationLocalizationResponse>(basePath, {
    params: cultureName ? { cultureName } : undefined,
  });
  return data;
}
