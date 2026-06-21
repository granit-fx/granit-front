import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';

import { ShellAuthProvider, type ShellAuthState, useShellAuth } from '../auth-context';

function wrapper(value: ShellAuthState) {
  return ({ children }: { children: ReactNode }) => (
    <ShellAuthProvider value={value}>{children}</ShellAuthProvider>
  );
}

describe('useShellAuth', () => {
  it('returns the provided auth state', () => {
    const value: ShellAuthState = { authenticated: true, loading: false, login: vi.fn() };
    const { result } = renderHook(() => useShellAuth(), { wrapper: wrapper(value) });
    expect(result.current).toBe(value);
  });

  it('throws when used outside a ShellAuthProvider', () => {
    expect(() => renderHook(() => useShellAuth())).toThrow(/within a <ShellAuthProvider>/);
  });
});
