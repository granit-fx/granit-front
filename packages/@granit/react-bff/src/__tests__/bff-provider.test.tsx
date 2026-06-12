import { render, renderHook, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BffGuard } from '../components/bff-guard';
import { useBffAuth } from '../hooks/use-bff-auth';
import { useBffCsrf } from '../hooks/use-bff-csrf';
import { useBffFetch } from '../hooks/use-bff-fetch';
import { BffProvider, useBffConfig } from '../providers/bff-provider';

import type { BffConfig } from '@granit/bff';

const authenticatedResponse = {
  authenticated: true,
  isHost: false,
  sub: 'user-123',
  name: 'Alice',
  email: 'alice@test.com',
  roles: ['admin'],
  tenantId: 'tenant-1',
  sessionExpiresAt: '2026-03-22T20:00:00Z',
};

const unauthenticatedResponse = { authenticated: false };

const csrfResponse = { csrfToken: 'csrf-test-token' };

function mockFetchSequence(...responses: object[]) {
  const fn = vi.fn();
  for (const resp of responses) {
    fn.mockResolvedValueOnce(new Response(JSON.stringify(resp), { status: 200 }));
  }
  return fn;
}

function createWrapper(config: BffConfig) {
  return ({ children }: { children: React.ReactNode }) => (
    <BffProvider config={config}>{children}</BffProvider>
  );
}

describe('BffProvider', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    globalThis.sessionStorage?.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should fetch /bff/user on mount', async () => {
    globalThis.fetch = mockFetchSequence(authenticatedResponse, csrfResponse);

    const config: BffConfig = { pathPrefix: '/admin', sessionCheckInterval: 0 };
    const { result } = renderHook(() => useBffAuth(), {
      wrapper: createWrapper(config),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe('Alice');
    expect(result.current.user?.sub).toBe('user-123');
  });

  it('should set user to null when not authenticated', async () => {
    globalThis.fetch = mockFetchSequence(unauthenticatedResponse);

    const config: BffConfig = { pathPrefix: '/app', sessionCheckInterval: 0 };
    const { result } = renderHook(() => useBffAuth(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should call onUnauthenticated when user is not authenticated', async () => {
    const onUnauthenticated = vi.fn();
    globalThis.fetch = mockFetchSequence(unauthenticatedResponse);

    const config: BffConfig = {
      pathPrefix: '/app',
      sessionCheckInterval: 0,
      onUnauthenticated,
    };
    renderHook(() => useBffAuth(), { wrapper: createWrapper(config) });

    await waitFor(() => {
      expect(onUnauthenticated).toHaveBeenCalledOnce();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'));

    const config: BffConfig = { pathPrefix: '/app', sessionCheckInterval: 0 };
    const { result } = renderHook(() => useBffAuth(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should fetch CSRF token after successful auth check', async () => {
    globalThis.fetch = mockFetchSequence(authenticatedResponse, csrfResponse);

    const config: BffConfig = { pathPrefix: '/admin', sessionCheckInterval: 0 };
    const { result } = renderHook(() => useBffCsrf(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => {
      expect(result.current.csrfToken).toBe('csrf-test-token');
    });
  });

  it('should stay authenticated when the CSRF token prefetch fails', async () => {
    // authenticated user, then the csrf-token request rejects.
    const fn = vi.fn();
    fn.mockResolvedValueOnce(new Response(JSON.stringify(authenticatedResponse), { status: 200 }));
    fn.mockRejectedValueOnce(new Error('csrf boom'));
    globalThis.fetch = fn;

    const config: BffConfig = { pathPrefix: '/admin', sessionCheckInterval: 0 };
    const { result } = renderHook(() => useBffAuth(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // A transient CSRF failure must NOT bounce the user back to unauthenticated.
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.sub).toBe('user-123');
  });

  it('should re-check after a transient unauthenticated response while login is pending', async () => {
    // Simulate the post-callback window: a login redirect was in flight.
    globalThis.sessionStorage?.setItem('granit.bff.login-pending', '1');

    // First /bff/user lands before the cookie is readable → authenticated:false;
    // the backoff re-check then sees the established session.
    const fn = vi.fn();
    fn.mockResolvedValueOnce(
      new Response(JSON.stringify(unauthenticatedResponse), { status: 200 })
    );
    fn.mockResolvedValueOnce(new Response(JSON.stringify(authenticatedResponse), { status: 200 }));
    fn.mockResolvedValueOnce(new Response(JSON.stringify(csrfResponse), { status: 200 }));
    globalThis.fetch = fn;

    const onUnauthenticated = vi.fn();
    const config: BffConfig = { pathPrefix: '/admin', sessionCheckInterval: 0, onUnauthenticated };
    const { result } = renderHook(() => useBffAuth(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // The transient false never reached the unauthenticated handler, and the
    // pending flag is cleared once authenticated.
    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(globalThis.sessionStorage?.getItem('granit.bff.login-pending')).toBeNull();
  });

  it('should give up after exhausting the backoff and report unauthenticated', async () => {
    globalThis.sessionStorage?.setItem('granit.bff.login-pending', '1');

    // Persistently unauthenticated: initial + 2 backoff retries all return false.
    // A fresh Response per call — a body can only be consumed once.
    const fn = vi.fn(
      () =>
        new Response(JSON.stringify(unauthenticatedResponse), {
          status: 200,
        }) as unknown as Response
    );
    globalThis.fetch = fn as unknown as typeof fetch;

    const onUnauthenticated = vi.fn();
    const config: BffConfig = { pathPrefix: '/admin', sessionCheckInterval: 0, onUnauthenticated };
    const { result } = renderHook(() => useBffAuth(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => {
      expect(onUnauthenticated).toHaveBeenCalled();
    });

    expect(result.current.isAuthenticated).toBe(false);
    // initial attempt + LOGIN_RECHECK_BACKOFF_MS.length (2) retries = 3 calls.
    expect(fn).toHaveBeenCalledTimes(3);
    expect(globalThis.sessionStorage?.getItem('granit.bff.login-pending')).toBeNull();
  });
});

describe('useBffConfig', () => {
  it('should throw when used outside BffProvider', () => {
    expect(() => {
      renderHook(() => useBffConfig());
    }).toThrow('useBffConfig must be used within a <BffProvider>');
  });
});

describe('useBffFetch', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    globalThis.sessionStorage?.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should return a fetch function', async () => {
    globalThis.fetch = mockFetchSequence(authenticatedResponse, csrfResponse);

    const config: BffConfig = { pathPrefix: '/app', sessionCheckInterval: 0 };
    const { result } = renderHook(() => useBffFetch(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => {
      expect(typeof result.current).toBe('function');
    });
  });
});

describe('BffGuard', () => {
  const originalFetch = globalThis.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    globalThis.sessionStorage?.clear();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('should show fallback while loading', () => {
    // fetch never resolves — stays in loading state
    vi.mocked(globalThis.fetch).mockReturnValue(new Promise(() => {}));

    const config: BffConfig = { pathPrefix: '/app', sessionCheckInterval: 0 };

    render(
      <BffProvider config={config}>
        <BffGuard fallback={<span data-testid="loading">Loading...</span>}>
          <span data-testid="content">Protected</span>
        </BffGuard>
      </BffProvider>
    );

    expect(screen.getByTestId('loading')).toBeTruthy();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('should render children when authenticated', async () => {
    globalThis.fetch = mockFetchSequence(authenticatedResponse, csrfResponse);

    const config: BffConfig = { pathPrefix: '/app', sessionCheckInterval: 0 };

    render(
      <BffProvider config={config}>
        <BffGuard>
          <span data-testid="content">Protected</span>
        </BffGuard>
      </BffProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeTruthy();
    });
  });

  it('should redirect to login when not authenticated', async () => {
    globalThis.fetch = mockFetchSequence(unauthenticatedResponse);

    const config: BffConfig = { pathPrefix: '/admin', sessionCheckInterval: 0 };

    render(
      <BffProvider config={config}>
        <BffGuard>
          <span data-testid="content">Protected</span>
        </BffGuard>
      </BffProvider>
    );

    await waitFor(() => {
      expect(window.location.href).toBe('/admin/bff/login');
    });

    expect(screen.queryByTestId('content')).toBeNull();
  });
});
