import { logger } from './logger';

import type { TranslateFunction } from '@granit/react-validation';

/**
 * Hand-written form value shapes (zod was dropped framework-wide in PR #727).
 * The subscription form is reused for both create and edit, so it always carries
 * `targetUrl` + `eventType`; the spec-derived constraints decide which fields are
 * authoritatively validated per mode (Update validates only `targetUrl`).
 */
export interface WebhookSubscriptionFormValues {
  readonly targetUrl: string;
  readonly eventType: string;
}

export interface WebhookDeactivationFormValues {
  readonly reason: string;
}

// Client-only SSRF guards. The OpenAPI contract only carries `required` +
// `maxLength` on `targetUrl` (plus the backend `Validation:WebhookUrlBlockedTld`
// granitValidator, which is the authoritative server-side check). These regexes
// are a front-end augmentation layered ON TOP of the spec-derived constraints to
// fail fast in the browser — drop them once the spec exposes an equivalent
// pattern in contracts/openapi/webhooks.json.
const PRIVATE_IPV4 =
  /^https?:\/\/(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/i;
const PRIVATE_IPV6 = /^https?:\/\/\[(::1|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|fe80:)/i;
const BLOCKED_TLDS = /\.(local|internal|localhost|onion)([:/]|$)/i;

function isBlockedHost(url: string): boolean {
  return PRIVATE_IPV4.test(url) || PRIVATE_IPV6.test(url);
}

/**
 * Validates `targetUrl` against the client-only SSRF rules preserved from the
 * former zod schema. Returns a localized error message, or `undefined` when the
 * URL passes every guard. Empty/maxLength are left to the spec resolver.
 */
export function validateTargetUrl(url: string, t: TranslateFunction): string | undefined {
  if (!url) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (err) {
    // Unparseable URL — reject it (mirrors the former zod `.url()` check).
    logger.error('[validation] Failed to parse target URL', err);
    return t('Webhooks.Form.TargetUrlInvalid');
  }

  if (!url.startsWith('https://')) {
    return t('Webhooks.Form.TargetUrlHttps');
  }

  if (isBlockedHost(url) || BLOCKED_TLDS.test(parsed.hostname)) {
    return t('Webhooks.Form.TargetUrlPrivate');
  }

  return undefined;
}
