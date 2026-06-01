import { installNamedPolicy } from './install-policy';

import type { InstallResult } from './types/index';

/** Name of the core Granit policy — to be listed first in `trusted-types`. */
export const GRANIT_CORE_POLICY_NAME = 'granit' as const;

/**
 * Install the core `granit` Trusted Types policy. **Refuses every sink**
 * — the framework itself does not assign to `innerHTML`, `outerHTML`,
 * `iframe.src` or any other dangerous DOM sink, so any attempted call
 * with this policy as the source is a programming error and should
 * throw loudly rather than be quietly sanitized.
 *
 * Packages that DO need a sink (Leaflet popups, Keycloak silent renew
 * iframe, ...) ship their own scoped policy via a `<pkg>/csp` subpath.
 * The app composes the policies it needs:
 *
 * ```ts
 * import { installPolicy as installCore } from '@granit/csp';
 * import { installPolicy as installMap } from '@granit/react-map/csp';
 *
 * installCore();
 * installMap();
 * ```
 *
 * Call once at app bootstrap, before any framework code renders. Safe
 * to call again (idempotent) and on browsers without Trusted Types
 * support (no-op).
 */
export function installPolicy(): InstallResult {
  return installNamedPolicy(GRANIT_CORE_POLICY_NAME, {
    createHTML: () => {
      throw new TypeError(
        '[@granit/csp] The core "granit" policy refuses HTML creation. A package needing innerHTML must register its own scoped policy via a `<pkg>/csp` subpath.'
      );
    },
    createScript: () => {
      throw new TypeError('[@granit/csp] eval-equivalent script creation is banned.');
    },
    createScriptURL: () => {
      throw new TypeError(
        '[@granit/csp] The core "granit" policy refuses script URLs. Use a scoped policy.'
      );
    },
  });
}
