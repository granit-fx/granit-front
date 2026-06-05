import type { CookieConsentConfigResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Fetches the CMP-agnostic cookie consent configuration.
 *
 * `GET {basePath}/config` (default backend route `GET /cookies/config`) —
 * anonymous, cached server-side for one hour. CMP adapters use this as the
 * canonical `loadConfig` implementation.
 *
 * @example
 * ```ts
 * const provider = createCookieConsentProvider({
 *   loadConfig: () => getCookieConsentConfig(apiClient, '/cookies'),
 * });
 * ```
 */
export async function getCookieConsentConfig(
  client: AxiosInstance,
  basePath: string
): Promise<CookieConsentConfigResponse> {
  const { data } = await client.get<CookieConsentConfigResponse>(`${basePath}/config`);
  return data;
}
