import { describe, expect, it } from 'vitest';

import { createJwtClaimTenantResolver } from '../resolvers/jwt-claim-tenant-resolver';

describe('createJwtClaimTenantResolver', () => {
  it('resolves tenant from default tenant_id claim', () => {
    const resolver = createJwtClaimTenantResolver({
      tokenParsedGetter: () => ({ tenant_id: 'abc-123' }),
    });

    expect(resolver.resolve()).toEqual({ id: 'abc-123', name: undefined });
  });

  it('resolves tenant with tenant_name when present', () => {
    const resolver = createJwtClaimTenantResolver({
      tokenParsedGetter: () => ({
        tenant_id: 'abc-123',
        tenant_name: 'Acme Corp',
      }),
    });

    expect(resolver.resolve()).toEqual({ id: 'abc-123', name: 'Acme Corp' });
  });

  it('returns null when tokenParsed is undefined', () => {
    const resolver = createJwtClaimTenantResolver({
      tokenParsedGetter: () => undefined,
    });

    expect(resolver.resolve()).toBeNull();
  });

  it('returns null when claim is missing', () => {
    const resolver = createJwtClaimTenantResolver({
      tokenParsedGetter: () => ({ sub: 'user-1' }),
    });

    expect(resolver.resolve()).toBeNull();
  });

  it('returns null when claim is an empty string', () => {
    const resolver = createJwtClaimTenantResolver({
      tokenParsedGetter: () => ({ tenant_id: '' }),
    });

    expect(resolver.resolve()).toBeNull();
  });

  it('supports custom claim type', () => {
    const resolver = createJwtClaimTenantResolver({
      tokenParsedGetter: () => ({ org_id: 'org-456' }),
      claimType: 'org_id',
    });

    expect(resolver.resolve()).toEqual({ id: 'org-456', name: undefined });
  });

  it('has order 200 matching .NET JwtClaimTenantResolver', () => {
    const resolver = createJwtClaimTenantResolver({
      tokenParsedGetter: () => undefined,
    });

    expect(resolver.order).toBe(200);
    expect(resolver.name).toBe('JwtClaimTenantResolver');
  });
});
