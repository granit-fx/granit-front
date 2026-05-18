// ---------------------------------------------------------------------------
// @granit/csp — Trusted Types policy compartments for Granit apps.
//
// Each Granit package that assigns to a DOM sink (innerHTML, iframe.src, …)
// owns a narrowly scoped policy under a `<pkg>/csp` subpath. This package
// hosts the shared infrastructure: install primitive, runtime registry,
// `trusted-types` directive builder.
//
// Convention: every scoped policy MUST expose `GRANIT_<PKG>_POLICY_NAME`
// (kebab-cased, prefixed `granit-`) plus an idempotent `installPolicy()`.
// ---------------------------------------------------------------------------

export { installPolicy, GRANIT_CORE_POLICY_NAME } from './core-policy.js';

export { getCspTrustedTypesDirective, listInstalledGranitPolicies } from './registry.js';

export { installNamedPolicy } from './install-policy.js';

export type { GranitPolicyName, InstallResult, TrustedTypePolicyOptions } from './types/index.js';
