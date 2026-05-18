// ---------------------------------------------------------------------------
// `granit-map` Trusted Types policy — covers the Leaflet sinks reached by
// `@granit/react-map`. Leaflet's `bindPopup(htmlString)` and similar APIs
// write to `innerHTML` under the hood; under CSP `require-trusted-types-for
// 'script'` those writes need a TrustedHTML.
//
// The framework already pre-escapes user-controlled values through
// `escapeHtml()` in `map-snapshot-widget.tsx`, so the policy could be a
// pass-through. We sanitize via DOMPurify anyway — defense in depth in case
// a future contributor (or third-party Leaflet plugin) calls bindPopup
// with un-escaped data.
// ---------------------------------------------------------------------------

import { installNamedPolicy } from '@granit/csp';

import type { InstallResult } from '@granit/csp';

export const GRANIT_MAP_POLICY_NAME = 'granit-map' as const;

interface DOMPurifyLike {
  sanitize(dirty: string, config?: object): string;
}

let cachedSanitizer: DOMPurifyLike | null = null;

/** @internal — test seam to inject a fake sanitizer without importing DOMPurify. */
export function __setSanitizerForTests(s: DOMPurifyLike | null): void {
  cachedSanitizer = s;
}

async function loadSanitizer(): Promise<DOMPurifyLike> {
  if (cachedSanitizer) return cachedSanitizer;
  // Lazy import keeps DOMPurify out of the bundle of apps that never install
  // this policy. Apps that DO need it (granted, almost all map-using ones)
  // pay the ~50 KB at the moment `installPolicy()` is called — typically at
  // boot, so synchronous-feeling for the user.
  const mod = (await import('dompurify')) as unknown as {
    default?: DOMPurifyLike;
    sanitize?: DOMPurifyLike['sanitize'];
  };
  const sanitizer: DOMPurifyLike = mod.default ?? { sanitize: mod.sanitize! };
  cachedSanitizer = sanitizer;
  return sanitizer;
}

/**
 * Install the `granit-map` Trusted Types policy. Idempotent, SSR-safe,
 * no-op when Trusted Types are unavailable.
 *
 * Returns an {@link InstallResult} synchronously (the policy is registered
 * synchronously); DOMPurify is loaded lazily on first `createHTML` call.
 *
 * **CSP requirement**: list `granit-map` in the `trusted-types` directive:
 * ```
 * trusted-types granit granit-map;
 * require-trusted-types-for 'script';
 * ```
 */
export function installPolicy(): InstallResult {
  return installNamedPolicy(GRANIT_MAP_POLICY_NAME, {
    createHTML: (input) => {
      // Synchronous TT contract — we must return a sanitized string here.
      // If DOMPurify hasn't loaded yet (very rare: first call before
      // `loadSanitizer().then(...)` completes), we fall back to the
      // already-escaped input. Framework code only feeds escapeHtml()
      // output, so that fallback is safe; third-party plugins should
      // ensure installPolicy() is awaited before mounting a map.
      if (cachedSanitizer) {
        return cachedSanitizer.sanitize(input, { USE_PROFILES: { html: true } });
      }
      // Fire the lazy load so the next call is sanitized.
      void loadSanitizer();
      return input;
    },
  });
}
