import { markInstalled } from './registry';
import {
  getTrustedTypesFactory,
  type GranitPolicyName,
  type InstallResult,
  type TrustedTypePolicyOptions,
} from './types/index';

const installed = new Set<GranitPolicyName>();

/**
 * Install a named Trusted Types policy idempotently. Safe to call multiple
 * times: subsequent calls return `'already-installed'` without throwing
 * (the underlying `trustedTypes.createPolicy` throws on duplicates).
 *
 * Safe to call on browsers without Trusted Types support, in SSR, and in
 * test environments — returns `'unsupported'` instead of throwing.
 *
 * @internal Per-package wrapper. Consumers should call the package's own
 * `installPolicy()` (e.g. from `@granit/csp`, `@granit/react-map/csp`)
 * which calls this with the appropriate name and options.
 */
export function installNamedPolicy(
  name: GranitPolicyName,
  options: TrustedTypePolicyOptions
): InstallResult {
  if (installed.has(name)) {
    return { status: 'already-installed', name };
  }
  if (
    typeof globalThis === 'undefined' ||
    (globalThis as { window?: unknown }).window === undefined
  ) {
    return { status: 'unsupported', reason: 'no-window' };
  }
  const factory = getTrustedTypesFactory();
  if (!factory) {
    return { status: 'unsupported', reason: 'no-trusted-types' };
  }
  factory.createPolicy(name, options);
  installed.add(name);
  markInstalled(name);
  return { status: 'installed', name };
}

/** @internal — test-only reset. */
export function resetInstalledPoliciesForTests(): void {
  installed.clear();
}
