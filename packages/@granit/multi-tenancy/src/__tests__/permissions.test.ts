import { describe, expect, it } from 'vitest';

import { MultiTenancyPermissions } from '../permissions';

describe('MultiTenancyPermissions', () => {
  it('exposes the tenant management permission strings', () => {
    expect(MultiTenancyPermissions.Tenants).toEqual({
      Read: 'MultiTenancy.Tenants.Read',
      Create: 'MultiTenancy.Tenants.Create',
      Update: 'MultiTenancy.Tenants.Update',
      Manage: 'MultiTenancy.Tenants.Manage',
    });
  });

  it('exposes the Host.Impersonate permission for tenant impersonation gating (VULN-203)', () => {
    // Contract string — must match the .NET backend permission exactly.
    expect(MultiTenancyPermissions.Host.Impersonate).toBe('MultiTenancy.Host.Impersonate');
  });
});
