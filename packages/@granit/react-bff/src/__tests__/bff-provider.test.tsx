import { render, renderHook, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BffGuard } from '../components/bff-guard.js';
import { useBffAuth } from '../hooks/use-bff-auth.js';
import { useBffCsrf } from '../hooks/use-bff-csrf.js';
import { useBffFetch } from '../hooks/use-bff-fetch.js';
import { BffProvider, useBffConfig, useBffContext } from '../providers/bff-provider.js';

import type { BffConfig } from '@granit/bff';

const authenticatedResponse = {
  authenticated: true,
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
});

describe('useBffConfig', () => {
  it('should throw when used outside BffProvider', () => {
    expect(() => {
      renderHook(() => useBffConfig());
    }).toThrow('useBffConfig must be used within a <BffProvider>');
  });

  it('should still work via deprecated useBffContext alias', () => {
    expect(() => {
      renderHook(() => useBffContext());
    }).toThrow('useBffConfig must be used within a <BffProvider>');
  });
});

describe('useBffFetch', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
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
