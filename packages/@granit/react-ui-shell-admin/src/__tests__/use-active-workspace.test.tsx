import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import { useActiveWorkspace } from '../use-active-workspace';

function wrapperAt(path: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('useActiveWorkspace', () => {
  it('resolves the workspace from a /w/{name} url', () => {
    const { result } = renderHook(() => useActiveWorkspace(), {
      wrapper: wrapperAt('/w/billing/invoices'),
    });
    expect(result.current.activeWorkspaceName).toBe('billing');
  });

  it('returns null on the launcher home route', () => {
    const { result } = renderHook(() => useActiveWorkspace(), { wrapper: wrapperAt('/') });
    expect(result.current.activeWorkspaceName).toBeNull();
  });

  it('falls back to the persisted workspace on a non-/w route', () => {
    localStorage.setItem('granit:host:active-workspace', 'sales');
    const { result } = renderHook(() => useActiveWorkspace(), { wrapper: wrapperAt('/parties') });
    expect(result.current.activeWorkspaceName).toBe('sales');
  });

  it('persists and exposes a manually set workspace', () => {
    const { result } = renderHook(() => useActiveWorkspace(), { wrapper: wrapperAt('/settings') });
    act(() => result.current.setActiveWorkspace('marketing'));
    expect(localStorage.getItem('granit:host:active-workspace')).toBe('marketing');
    expect(result.current.activeWorkspaceName).toBe('marketing');
  });

  it('mirrors the url workspace into storage', () => {
    renderHook(() => useActiveWorkspace(), { wrapper: wrapperAt('/w/finance/reports') });
    expect(localStorage.getItem('granit:host:active-workspace')).toBe('finance');
  });
});
