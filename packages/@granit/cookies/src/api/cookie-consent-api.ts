import type { ConsentDecisionRequest, CookieConsentConfigResponse } from '../types/index';
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

/**
 * Records a cookie-consent decision in the server-side ledger.
 *
 * `POST {basePath}/consent` (default backend route `POST /cookies/consent`) —
 * anonymous, returns `204 No Content`. Appends the decision to the append-only
 * consent ledger (GDPR Art. 7(1) accountability). Best-effort: the backend
 * acknowledges the decision even when no persistent ledger is registered.
 *
 * @example
 * ```ts
 * await recordCookieConsentDecision(
 *   apiClient,
 *   '/cookies',
 *   toConsentDecision(consents, { cmpSource: 'cookieconsent' })
 * );
 * ```
 */
export async function recordCookieConsentDecision(
  client: AxiosInstance,
  basePath: string,
  request: ConsentDecisionRequest
): Promise<void> {
  await client.post(`${basePath}/consent`, request);
}
