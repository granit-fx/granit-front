import type { TenantResolver } from './tenant-resolver';
import type { TenantInfo } from '../types/index';

export interface JwtClaimTenantResolverOptions {
  /** Function returning the decoded JWT payload (e.g. keycloak.tokenParsed). */
  readonly tokenParsedGetter: () => Record<string, unknown> | undefined;
  /** JWT claim type. Default: "tenant_id". */
  readonly claimType?: string;
}

/**
 * Creates a tenant resolver that extracts tenant ID from a JWT claim.
 * Mirrors .NET JwtClaimTenantResolver (order = 200).
 */
export function createJwtClaimTenantResolver(
  options: JwtClaimTenantResolverOptions
): TenantResolver {
  const claimType = options.claimType ?? 'tenant_id';

  return {
    order: 200,
    name: 'JwtClaimTenantResolver',
    resolve(): TenantInfo | null {
      const parsed = options.tokenParsedGetter();
      if (!parsed) return null;

      const value = parsed[claimType];
      if (typeof value !== 'string' || value === '') return null;

      const name = typeof parsed['tenant_name'] === 'string' ? parsed['tenant_name'] : undefined;

      return { id: value, name };
    },
  };
}
