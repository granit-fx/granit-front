import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useKeycloakTenantResolvers } from '../hooks/use-keycloak-tenant-resolvers';

describe('useKeycloakTenantResolvers', () => {
  it('creates a resolver that extracts tenant from tokenParsed', () => {
    const tokenParsed = { tenant_id: 'abc-123', tenant_name: 'Acme' };

    const { result } = renderHook(() => useKeycloakTenantResolvers({ tokenParsed }));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.resolve()).toEqual({ id: 'abc-123', name: 'Acme' });
  });

  it('returns a resolver that resolves null when tokenParsed is undefined', () => {
    const { result } = renderHook(() => useKeycloakTenantResolvers({ tokenParsed: undefined }));

    expect(result.current[0]!.resolve()).toBeNull();
  });

  it('supports custom claim type', () => {
    const tokenParsed = { org_id: 'org-789' };

    const { result } = renderHook(() =>
      useKeycloakTenantResolvers({ tokenParsed, claimType: 'org_id' })
    );

    expect(result.current[0]!.resolve()).toEqual({ id: 'org-789', name: undefined });
  });

  it('memoizes resolvers for same tokenParsed reference', () => {
    const tokenParsed = { tenant_id: 'abc-123' };

    const { result, rerender } = renderHook(() => useKeycloakTenantResolvers({ tokenParsed }));

    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
