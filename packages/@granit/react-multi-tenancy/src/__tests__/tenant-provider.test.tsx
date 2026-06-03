import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TenantProvider, useTenant } from '../providers/tenant-provider';

import type { TenantResolver } from '@granit/multi-tenancy';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@granit/api-client', () => ({
  setTenantGetter: vi.fn(),
}));

/** Minimal QueryClient stub — TenantProvider only calls `.clear()`. */
function fakeQueryClient(): { clear: ReturnType<typeof vi.fn> } & QueryClient {
  return { clear: vi.fn() } as unknown as { clear: ReturnType<typeof vi.fn> } & QueryClient;
}

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

  it('does not clear the query cache on initial mount (VULN-200)', () => {
    const queryClient = fakeQueryClient();
    const resolvers: TenantResolver[] = [
      { order: 100, name: 'test', resolve: () => ({ id: 'tenant-1' }) },
    ];

    renderHook(() => useTenant(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TenantProvider resolvers={resolvers} queryClient={queryClient}>
          {children}
        </TenantProvider>
      ),
    });

    expect(queryClient.clear).not.toHaveBeenCalled();
  });

  it('clears the query cache when the tenant id changes, before onTenantChange (VULN-200)', () => {
    const queryClient = fakeQueryClient();
    const onTenantChange = vi.fn(() => {
      // Cache must already be cleared by the time custom side effects run.
      expect(queryClient.clear).toHaveBeenCalledTimes(1);
    });
    let currentTenantId = 'tenant-a';
    const resolvers: TenantResolver[] = [
      { order: 100, name: 'dynamic', resolve: () => ({ id: currentTenantId }) },
    ];

    const { rerender } = renderHook(() => useTenant(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TenantProvider
          resolvers={[...resolvers]}
          queryClient={queryClient}
          onTenantChange={onTenantChange}
        >
          {children}
        </TenantProvider>
      ),
    });

    currentTenantId = 'tenant-b';
    rerender();

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
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
