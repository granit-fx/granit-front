import { useBffConfig } from '../providers/bff-provider';

import type { BffUser } from '@granit/bff';

/**
 * Extract the tenant id to inject into `X-Tenant-Id` from a BFF user.
 *
 * **Never returns the tenant id for a Host user.** A Host user has no
 * default tenant scope: the backend (`Granit.MultiTenancy` +
 * `Granit.MultiTenancy.Authorization`) rejects any `X-Tenant-Id` header
 * coming from a Host session unless the user holds the
 * `MultiTenancy.Host.Impersonate` permission, and even then the
 * impersonation must be an explicit, short-lived action — not the result
 * of an automatic header injection. Returning `undefined` here keeps the
 * interceptor honest.
 *
 * @returns `tenantId` for an authenticated tenant user, `undefined` for
 *   Host users, anonymous sessions, or while bootstrapping.
 */
export function resolveBffTenantId(user: BffUser | null): string | undefined {
  if (!user) return undefined;
  if (user.isHost) return undefined;
  return user.tenantId;
}

/**
 * React-side accessor for {@link resolveBffTenantId} reading the active
 * `<BffProvider>` context. Drop-in for `setTenantGetter`:
 *
 * @example
 * ```tsx
 * function ApiClientBootstrap() {
 *   const getTenantId = useBffTenantGetter();
 *   useEffect(() => setTenantGetter(getTenantId), [getTenantId]);
 *   return null;
 * }
 * ```
 */
export function useBffTenantGetter(): () => string | undefined {
  const { user } = useBffConfig();
  return () => resolveBffTenantId(user);
}
