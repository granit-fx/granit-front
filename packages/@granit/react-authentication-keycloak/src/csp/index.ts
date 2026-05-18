// ---------------------------------------------------------------------------
// `granit-keycloak` Trusted Types policy — covers the Keycloak.js sinks
// reached during silent renew, third-party-cookies check, and check-session
// iframe initialization. Keycloak.js calls
// `iframe.setAttribute('src', urlString)` (silent check-sso, session iframe);
// under CSP `require-trusted-types-for 'script'` those writes need a
// TrustedScriptURL.
//
// The policy allow-lists URLs whose origin matches the configured Keycloak
// authority (set via `setKeycloakAuthority()` at app bootstrap). Anything
// else throws — so an XSS that attempts to redirect the silent renew to a
// rogue origin cannot succeed.
// ---------------------------------------------------------------------------

import { installNamedPolicy } from '@granit/csp';

import type { InstallResult } from '@granit/csp';

export const GRANIT_KEYCLOAK_POLICY_NAME = 'granit-keycloak' as const;

let allowedOrigins = new Set<string>();

/**
 * Declare the Keycloak authority origin(s) the policy will accept. Pass the
 * full `authority` URL from your Keycloak config — only the origin part is
 * used. Apps with multi-realm setups can register several authorities.
 *
 * Must be called BEFORE `installPolicy()` so the policy closure captures
 * the allow-list at registration time.
 */
export function setKeycloakAuthorities(authorities: readonly string[]): void {
  allowedOrigins = new Set(
    authorities.map((a) => {
      try {
        return new URL(a).origin;
      } catch {
        throw new TypeError(`[@granit/react-authentication-keycloak/csp] Invalid authority URL: ${a}`);
      }
    })
  );
}

/** @internal — test helper to read the current allow-list. */
export function __getAllowedOriginsForTests(): ReadonlySet<string> {
  return allowedOrigins;
}

function assertAllowedScriptUrl(input: string): string {
  // Same-origin relative URLs (e.g. silent-check-sso.html) are always OK —
  // they cannot be redirected off-origin without crossing the
  // protocol-relative or absolute-URL boundary, which we reject.
  if (input.startsWith('/') && !input.startsWith('//')) return input;

  let url: URL;
  try {
    url = new URL(input, globalThis.location?.href);
  } catch {
    throw new TypeError(
      `[granit-keycloak] Refused script URL "${input.slice(0, 60)}": malformed`
    );
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new TypeError(
      `[granit-keycloak] Refused script URL scheme "${url.protocol}". Only http(s) allowed.`
    );
  }
  if (allowedOrigins.size === 0) {
    throw new TypeError(
      '[granit-keycloak] No Keycloak authority registered. Call `setKeycloakAuthorities([authority])` before `installPolicy()`.'
    );
  }
  if (!allowedOrigins.has(url.origin)) {
    throw new TypeError(
      `[granit-keycloak] Refused script URL to "${url.origin}" — not in the registered Keycloak authority allow-list.`
    );
  }
  return input;
}

/**
 * Install the `granit-keycloak` Trusted Types policy. Idempotent, SSR-safe,
 * no-op when Trusted Types are unavailable.
 *
 * **CSP requirement**: list `granit-keycloak` in the `trusted-types`
 * directive and call `setKeycloakAuthorities([keycloakConfig.authority])`
 * before this call.
 */
export function installPolicy(): InstallResult {
  return installNamedPolicy(GRANIT_KEYCLOAK_POLICY_NAME, {
    createScriptURL: assertAllowedScriptUrl,
  });
}
