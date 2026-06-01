import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TenantProvider, useTenant } from '../providers/tenant-provider';

import type { TenantResolver } from '@granit/multi-tenancy';
import type { ReactNode } from 'react';

vi.mock('@granit/api-client', () => ({
  setTenantGetter: vi.fn(),
}));

function wrapper(resolvers: readonly TenantResolver[], isEnabled?: boolean) {
  return ({ children }: { children: ReactNode }) => (
    <TenantProvider resolvers={resolvers} options={{ isEnabled }}>
      {children}
    </TenantProvider>
  );
}

describe('TenantProvider', () => {
  it('provides tenant context when resolver matches', () => {
    const resolvers: TenantResolver[] = [
      { order: 100, name: 'test', resolve: () => ({ id: 'tenant-1', name: 'Acme' }) },
    ];

    const { result } = renderHook(() => useTenant(), { wrapper: wrapper(resolvers) });

    expect(result.current).toEqual({
      isAvailable: true,
      tenantId: 'tenant-1',
      tenantName: 'Acme',
    });
  });

  it('returns isAvailable false when no resolver matches', () => {
    const resolvers: TenantResolver[] = [{ order: 100, name: 'empty', resolve: () => null }];

    const { result } = renderHook(() => useTenant(), { wrapper: wrapper(resolvers) });

    expect(result.current).toEqual({
      isAvailable: false,
      tenantId: undefined,
      tenantName: undefined,
    });
  });

  it('returns isAvailable false when disabled', () => {
    const resolvers: TenantResolver[] = [
      { order: 100, name: 'test', resolve: () => ({ id: 'tenant-1' }) },
    ];

    const { result } = renderHook(() => useTenant(), { wrapper: wrapper(resolvers, false) });

    expect(result.current).toEqual({
      isAvailable: false,
      tenantId: undefined,
      tenantName: undefined,
    });
  });

  it('calls setTenantGetter on mount', async () => {
    const { setTenantGetter } = await import('@granit/api-client');
    const resolvers: TenantResolver[] = [
      { order: 100, name: 'test', resolve: () => ({ id: 'tenant-1' }) },
    ];

    renderHook(() => useTenant(), { wrapper: wrapper(resolvers) });

    expect(setTenantGetter).toHaveBeenCalledWith(expect.any(Function));
  });

  it('does not fire onTenantChange on initial mount', () => {
    const onTenantChange = vi.fn();
    const resolvers: TenantResolver[] = [
      { order: 100, name: 'test', resolve: () => ({ id: 'tenant-1' }) },
    ];

    renderHook(() => useTenant(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TenantProvider resolvers={resolvers} onTenantChange={onTenantChange}>
          {children}
        </TenantProvider>
      ),
    });

    expect(onTenantChange).not.toHaveBeenCalled();
  });

  it('fires onTenantChange when the resolved tenant id changes', () => {
    const onTenantChange = vi.fn();
    let currentTenantId = 'tenant-a';
    const resolvers: TenantResolver[] = [
      { order: 100, name: 'dynamic', resolve: () => ({ id: currentTenantId }) },
    ];

    const { rerender } = renderHook(() => useTenant(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TenantProvider resolvers={[...resolvers]} onTenantChange={onTenantChange}>
          {children}
        </TenantProvider>
      ),
    });

    currentTenantId = 'tenant-b';
    rerender();

    expect(onTenantChange).toHaveBeenCalledTimes(1);
    expect(onTenantChange).toHaveBeenCalledWith('tenant-b', 'tenant-a');
  });
});

describe('useTenant', () => {
  it('throws when used outside TenantProvider', () => {
    expect(() => renderHook(() => useTenant())).toThrow(
      'useTenant must be used within a TenantProvider'
    );
  });
});
