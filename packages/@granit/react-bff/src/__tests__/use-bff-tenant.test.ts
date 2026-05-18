import { describe, expect, it } from 'vitest';

import { resolveBffTenantId } from '../hooks/use-bff-tenant.js';

import type { BffHostUser, BffTenantUser } from '@granit/bff';

const tenantUser: BffTenantUser = {
  authenticated: true,
  isHost: false,
  sub: 't',
  name: 'T',
  email: 't@x',
  roles: [],
  sessionExpiresAt: '2026-12-31T23:59:59Z',
  tenantId: 'acme' as BffTenantUser['tenantId'],
};

const hostUser: BffHostUser = {
  authenticated: true,
  isHost: true,
  sub: 'h',
  name: 'H',
  email: 'h@x',
  roles: ['Host'],
  sessionExpiresAt: '2026-12-31T23:59:59Z',
};

describe('resolveBffTenantId', () => {
  it('returns tenantId for a tenant user', () => {
    expect(resolveBffTenantId(tenantUser)).toBe('acme');
  });

  it('returns undefined for a host user — never auto-inject X-Tenant-Id', () => {
    expect(resolveBffTenantId(hostUser)).toBeUndefined();
  });

  it('returns undefined for an anonymous / bootstrap state', () => {
    expect(resolveBffTenantId(null)).toBeUndefined();
  });
});
