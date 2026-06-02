// Minimal Trusted Types surface — typed against the W3C draft. Avoids
// requiring `@types/trusted-types` for consumers that don't have lib.dom
// patched, while still keeping the public API type-safe.

/** Names of Trusted Types policies installed by Granit packages. */
export type GranitPolicyName =
  | 'granit'
  | 'granit-map'
  | 'granit-keycloak'
  | (string & { readonly __granitPolicy?: never });

/** Function called when a third party tries to assign to a DOM sink. */
export interface TrustedTypePolicyOptions {
  createHTML?: (input: string) => string;
  createScript?: (input: string) => string;
  createScriptURL?: (input: string) => string;
}

/** Result of an `installPolicy()` call. */
export type InstallResult =
  | { readonly status: 'installed'; readonly name: string }
  | { readonly status: 'already-installed'; readonly name: string }
  | { readonly status: 'unsupported'; readonly reason: 'no-window' | 'no-trusted-types' };
