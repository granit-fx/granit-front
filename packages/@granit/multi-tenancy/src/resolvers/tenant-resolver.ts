import type { TenantInfo } from '../types/index';

/**
 * Synchronous tenant resolver.
 * Mirrors .NET Granit.MultiTenancy.Resolvers.ITenantResolver.
 *
 * On the frontend, resolvers extract tenant info from in-memory sources
 * (parsed JWT, URL, local storage, etc.) rather than HTTP context.
 */
export interface TenantResolver {
  /** Resolution priority. Lower = resolved first. */
  readonly order: number;
  /** Display name for logging/debugging. */
  readonly name: string;
  /** Attempts to resolve the tenant. Returns null if it cannot be determined. */
  resolve(): TenantInfo | null;
}

/**
 * Execute resolvers in ascending order, returning the first non-null result.
 * Mirrors .NET Granit.MultiTenancy.Pipeline.TenantResolverPipeline.
 */
export function resolveTenant(resolvers: readonly TenantResolver[]): TenantInfo | null {
  const sorted = Array.from(resolvers).sort((a, b) => a.order - b.order);
  for (const resolver of sorted) {
    const result = resolver.resolve();
    if (result !== null) {
      return result;
    }
  }
  return null;
}
