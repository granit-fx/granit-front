import type { AxiosInstance } from '@granit/api-client';

/**
 * Build the optional Axios config carrying a retry-stable `Idempotency-Key`
 * header. Returns `undefined` when no key is supplied so the call signature
 * stays `(url, body)` — the shared `@granit/api-client` idempotency interceptor
 * still mints a per-request key, this only pins ONE key across retries.
 */
function idempotencyConfig(idempotencyKey?: string) {
  return idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined;
}

/**
 * Set a localization override (create or update).
 *
 * `PUT {basePath}/overrides/{resourceName}/{cultureName}/{key}` where
 * `basePath` is the localization module root (e.g. `/api/v1/localization`).
 *
 * Pass `idempotencyKey` to make a retried write (after an ambiguous failure)
 * replay the original instead of re-applying it.
 */
export async function setLocalizationOverride(
  client: AxiosInstance,
  basePath: string,
  resourceName: string,
  cultureName: string,
  key: string,
  value: string,
  idempotencyKey?: string
): Promise<void> {
  const url = `${basePath}/overrides/${encodeURIComponent(resourceName)}/${encodeURIComponent(cultureName)}/${encodeURIComponent(key)}`;
  if (idempotencyKey) {
    await client.put(url, { value }, idempotencyConfig(idempotencyKey));
  } else {
    await client.put(url, { value });
  }
}

/**
 * Delete a localization override.
 *
 * `DELETE {basePath}/overrides/{resourceName}/{cultureName}/{key}` where
 * `basePath` is the localization module root (e.g. `/api/v1/localization`).
 *
 * Pass `idempotencyKey` to make a retried delete replay the original.
 */
export async function deleteLocalizationOverride(
  client: AxiosInstance,
  basePath: string,
  resourceName: string,
  cultureName: string,
  key: string,
  idempotencyKey?: string
): Promise<void> {
  const url = `${basePath}/overrides/${encodeURIComponent(resourceName)}/${encodeURIComponent(cultureName)}/${encodeURIComponent(key)}`;
  if (idempotencyKey) {
    await client.delete(url, idempotencyConfig(idempotencyKey));
  } else {
    await client.delete(url);
  }
}
