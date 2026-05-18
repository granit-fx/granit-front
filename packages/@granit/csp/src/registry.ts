// Tracks which Granit Trusted Types policies the app has installed at
// runtime. Used by `getCspTrustedTypesDirective()` so the BFF can emit a
// CSP header that lists exactly the policies in use — narrow by default,
// no opaque catch-all.

import type { GranitPolicyName } from './types.js';

const installed = new Set<GranitPolicyName>();

/** @internal — invoked by each package's `installPolicy()` on success. */
export function markInstalled(name: GranitPolicyName): void {
  installed.add(name);
}

/** Returns the policies the app has installed so far. Order is insertion. */
export function listInstalledGranitPolicies(): readonly GranitPolicyName[] {
  return Array.from(installed);
}

/**
 * Returns a value suitable for the CSP `trusted-types` directive, e.g.
 * `'granit granit-map'`. When no policy is installed, returns `'none'`
 * which under `require-trusted-types-for 'script'` blocks every sink.
 *
 * Typical usage server-side (Vite dev / BFF response header):
 *
 * ```ts
 * res.setHeader(
 *   'Content-Security-Policy',
 *   `require-trusted-types-for 'script'; trusted-types ${getCspTrustedTypesDirective()};`
 * );
 * ```
 */
export function getCspTrustedTypesDirective(): string {
  const policies = Array.from(installed);
  return policies.length === 0 ? "'none'" : policies.join(' ');
}

/** @internal — test-only reset, exported only via the `csp/testing` path. */
export function resetGranitPoliciesForTests(): void {
  installed.clear();
}
