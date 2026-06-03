export const MultiTenancyPermissions = {
  Tenants: {
    Read: 'MultiTenancy.Tenants.Read',
    Create: 'MultiTenancy.Tenants.Create',
    Update: 'MultiTenancy.Tenants.Update',
    Manage: 'MultiTenancy.Tenants.Manage',
  },
  Host: {
    /**
     * Required for a Host user to act in a tenant's context (send an
     * `X-Tenant-Id` header). The front must NEVER auto-inject a tenant header
     * for a Host: the default JWT resolver upholds this by construction (a Host
     * token carries no `tenant_id` claim, so the tenant getter returns
     * `undefined`). Gate any explicit Host "switch tenant" UI on this
     * permission before setting a tenant. See security audit VULN-203.
     */
    Impersonate: 'MultiTenancy.Host.Impersonate',
  },
} as const;
