import { createAuthContext } from '@granit/react-authentication';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MockAuthProvider } from '../mock-auth-provider';

import type { KeycloakAuthContextType, KeycloakUserInfo } from '@granit/authentication-keycloak';
import type { BffConfig } from '@granit/bff';
import type { ReactNode } from 'react';

const { AuthContext, useAuth } = createAuthContext<KeycloakAuthContextType>();

const demoUser: KeycloakUserInfo = {
  sub: 'user-123',
  name: 'Ada Lovelace',
  preferred_username: 'ada',
  email: 'ada@example.com',
};

function wrapperFor(props?: Partial<Omit<Parameters<typeof MockAuthProvider>[0], 'children'>>) {
  return ({ children }: { children: ReactNode }) => (
    <MockAuthProvider context={AuthContext} user={demoUser} {...props}>
      {children}
    </MockAuthProvider>
  );
}

describe('MockAuthProvider', () => {
  it('provides a fake authenticated context value immediately (no delay)', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor() });

    expect(result.current.authenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.keycloak).toBeNull();
    expect(result.current.user).toEqual(demoUser);
  });

  it('exposes no-op login/logout callbacks that do not throw', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor() });

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(() => {
      result.current.login();
      result.current.logout();
    }).not.toThrow();
  });

  it('renders children when not loading', () => {
    render(
      <MockAuthProvider context={AuthContext} user={demoUser}>
        <span data-testid="child">visible</span>
      </MockAuthProvider>
    );

    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('honours a custom user object', () => {
    const customUser: KeycloakUserInfo = { sub: 'other-9', name: 'Grace Hopper' };
    const { result } = renderHook(() => useAuth(), {
      wrapper: wrapperFor({ user: customUser }),
    });

    expect(result.current.user).toEqual(customUser);
  });

  describe('artificial loading delay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('shows the loadingFallback while the delay elapses, then the children', () => {
      render(
        <MockAuthProvider
          context={AuthContext}
          user={demoUser}
          loadingMs={500}
          loadingFallback={<span data-testid="spinner">loading…</span>}
        >
          <span data-testid="child">ready</span>
        </MockAuthProvider>
      );

      // Before the timer fires: fallback shown, children hidden.
      expect(screen.getByTestId('spinner')).toBeTruthy();
      expect(screen.queryByTestId('child')).toBeNull();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // After the delay: children rendered, fallback gone.
      expect(screen.getByTestId('child')).toBeTruthy();
      expect(screen.queryByTestId('spinner')).toBeNull();
    });

    it('renders null fallback by default while loading', () => {
      const { container } = render(
        <MockAuthProvider context={AuthContext} user={demoUser} loadingMs={200}>
          <span data-testid="child">ready</span>
        </MockAuthProvider>
      );

      expect(screen.queryByTestId('child')).toBeNull();
      expect(container).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByTestId('child')).toBeTruthy();
    });

    it('clears the timer on unmount without firing', () => {
      const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
      const { unmount } = render(
        <MockAuthProvider context={AuthContext} user={demoUser} loadingMs={300}>
          <span data-testid="child">ready</span>
        </MockAuthProvider>
      );

      unmount();
      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });
  });

  describe('BFF wrapping', () => {
    beforeEach(() => {
      // BffProvider performs a `/bff/user` fetch on mount; stub it so the tree
      // mounts cleanly without hitting the network.
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('null', { status: 200, headers: { 'content-type': 'application/json' } })
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('does not wrap in BffProvider when bffConfig is absent', () => {
      render(
        <MockAuthProvider context={AuthContext} user={demoUser}>
          <span data-testid="child">no-bff</span>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('child')).toBeTruthy();
      // No BFF session fetch should have been triggered.
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('wraps the tree in BffProvider when bffConfig is provided', async () => {
      const bffConfig: BffConfig = { pathPrefix: '/admin', sessionCheckInterval: 0 };

      render(
        <MockAuthProvider context={AuthContext} user={demoUser} bffConfig={bffConfig}>
          <span data-testid="child">with-bff</span>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('child')).toBeTruthy();
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/admin/bff/user',
          expect.objectContaining({ credentials: 'include' })
        );
      });
    });

    it('still provides the auth context value through the BffProvider wrapper', async () => {
      const bffConfig: BffConfig = { pathPrefix: '', sessionCheckInterval: 0 };
      const { result } = renderHook(() => useAuth(), {
        wrapper: wrapperFor({ bffConfig }),
      });

      await waitFor(() => {
        expect(result.current.authenticated).toBe(true);
      });
      expect(result.current.user).toEqual(demoUser);
    });
  });
});
