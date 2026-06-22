import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RightSidebarProvider, useRightSidebar } from '../right-sidebar-context';

import type { ReactNode } from 'react';

const STORAGE_KEY = 'granit:right-sidebar-open';

function wrapper({ children }: { readonly children: ReactNode }) {
  return <RightSidebarProvider>{children}</RightSidebarProvider>;
}

const originalMatchMedia = globalThis.matchMedia;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  globalThis.matchMedia = originalMatchMedia;
});

describe('useRightSidebar', () => {
  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useRightSidebar())).toThrow(/RightSidebarProvider/);
  });

  it('defaults to closed when nothing is persisted', () => {
    const { result } = renderHook(() => useRightSidebar(), { wrapper });
    expect(result.current.open).toBe(false);
  });

  it('hydrates the open state from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    const { result } = renderHook(() => useRightSidebar(), { wrapper });
    expect(result.current.open).toBe(true);
  });

  it('setOpen persists the new value', () => {
    const { result } = renderHook(() => useRightSidebar(), { wrapper });
    act(() => result.current.setOpen(true));
    expect(result.current.open).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('toggle flips the inline state on desktop', () => {
    globalThis.matchMedia = (() => ({ matches: true })) as unknown as typeof globalThis.matchMedia;
    const { result } = renderHook(() => useRightSidebar(), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.open).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.open).toBe(false);
  });

  it('toggle opens the mobile sheet instead of the inline panel on small screens', () => {
    globalThis.matchMedia = (() => ({ matches: false })) as unknown as typeof globalThis.matchMedia;
    const { result } = renderHook(() => useRightSidebar(), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.sheetOpen).toBe(true);
    expect(result.current.open).toBe(false);
  });

  it('setSheetOpen updates the mobile sheet state', () => {
    const { result } = renderHook(() => useRightSidebar(), { wrapper });
    act(() => result.current.setSheetOpen(true));
    expect(result.current.sheetOpen).toBe(true);
  });
});
