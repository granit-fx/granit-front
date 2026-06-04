import type { TrustedTypePolicyOptions } from './types/index';

interface TrustedTypePolicyFactory {
  createPolicy(name: string, options: TrustedTypePolicyOptions): unknown;
}

/** Internal — read the Trusted Types factory in a SSR-safe way. */
export function getTrustedTypesFactory(): TrustedTypePolicyFactory | null {
  if (typeof globalThis === 'undefined') return null;
  const w = globalThis as { trustedTypes?: TrustedTypePolicyFactory };
  return w.trustedTypes ?? null;
}
