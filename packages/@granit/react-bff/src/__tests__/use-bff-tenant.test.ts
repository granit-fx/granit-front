import { describe, expect, it } from 'vitest';

import { mockBffHostUser, mockBffTenantUser } from '@granit/react-bff/testing';

import { resolveBffTenantId } from '../hooks/use-bff-tenant';

describe('resolveBffTenantId', () => {
  it('returns tenantId for a tenant user', () => {
    expect(resolveBffTenantId(mockBffTenantUser)).toBe('acme');
  });

  it('returns undefined for a host user — never auto-inject X-Tenant-Id', () => {
    expect(resolveBffTenantId(mockBffHostUser)).toBeUndefined();
  });

  it('returns undefined for an anonymous / bootstrap state', () => {
    expect(resolveBffTenantId(null)).toBeUndefined();
  });
});
