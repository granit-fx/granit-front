import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useClearQueriesOnTenantChange } from '../hooks/use-clear-queries-on-tenant-change';
import { TenantProvider } from '../providers/tenant-provider';

import type { TenantResolver } from '@granit/multi-tenancy';

function staticResolver(id: string | undefined): TenantResolver {
  return {
    name: 'static',
    order: 0,
    resolve: () => (id ? { id, name: id } : null),
  };
}

function HookProbe(): null {
  useClearQueriesOnTenantChange();
  return null;
}

describe('useClearQueriesOnTenantChange', () => {
  it('does not clear on mount when tenant is stable', () => {
    const qc = new QueryClient();
    const clear = vi.spyOn(qc, 'clear');

    render(
      <QueryClientProvider client={qc}>
        <TenantProvider resolvers={[staticResolver('tenant-1')]}>
          <HookProbe />
        </TenantProvider>
      </QueryClientProvider>
    );

    expect(clear).not.toHaveBeenCalled();
  });

  it('clears the cache when the resolved tenant id changes', () => {
    const qc = new QueryClient();
    const clear = vi.spyOn(qc, 'clear');

    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <TenantProvider resolvers={[staticResolver('tenant-1')]}>
          <HookProbe />
        </TenantProvider>
      </QueryClientProvider>
    );

    rerender(
      <QueryClientProvider client={qc}>
        <TenantProvider resolvers={[staticResolver('tenant-2')]}>
          <HookProbe />
        </TenantProvider>
      </QueryClientProvider>
    );

    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('throws when used outside a TenantProvider', () => {
    const qc = new QueryClient();
    expect(() =>
      render(
        <QueryClientProvider client={qc}>
          <HookProbe />
        </QueryClientProvider>
      )
    ).toThrow(/useTenant must be used within a TenantProvider/);
  });
});
