import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useBffSessions,
  useRevokeBffSession,
  useRevokeAllOtherBffSessions,
} from '../hooks/use-bff-sessions.js';
import { BffProvider } from '../providers/bff-provider.js';

import type { BffConfig } from '@granit/bff';

const authenticatedResponse = {
  authenticated: true,
  isHost: false,
  sub: 'user-123',
  name: 'Alice',
  email: 'alice@test.com',
  roles: ['admin'],
  tenantId: 'tenant-1',
  sessionExpiresAt: '2026-03-23T20:00:00Z',
};

const csrfResponse = { token: 'csrf-test-token' };

const sessionsResponse = {
  sessions: [
    {
      sessionId: 'ab12...yz89',
      isCurrent: true,
      createdAt: '2026-03-23T10:00:00Z',
      userAgent: 'Mozilla/5.0',
    },
    {
      sessionId: 'cd34...wx67',
      isCurrent: false,
      createdAt: '2026-03-22T08:00:00Z',
      userAgent: null,
    },
  ],
};

function mockFetchResponses(...responses: Array<{ body: object; status?: number }>) {
  const fn = vi.fn();
  for (const resp of responses) {
    fn.mockResolvedValueOnce(
      new Response(JSON.stringify(resp.body), { status: resp.status ?? 200 })
    );
  }
  return fn;
}

function createWrapper(config: BffConfig) {
  return ({ children }: { children: React.ReactNode }) => (
    <BffProvider config={config}>{children}</BffProvider>
  );
}

const defaultConfig: BffConfig = { pathPrefix: '/admin', sessionCheckInterval: 0 };

describe('useBffSessions', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should fetch sessions when authenticated', async () => {
    globalThis.fetch = mockFetchResponses(
      { body: authenticatedResponse },
      { body: csrfResponse },
      { body: sessionsResponse }
    );

    const { result } = renderHook(() => useBffSessions(), {
      wrapper: createWrapper(defaultConfig),
    });

    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(2);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.sessions[0].sessionId).toBe('ab12...yz89');
    expect(result.current.sessions[0].isCurrent).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should return empty sessions when not authenticated', async () => {
    globalThis.fetch = mockFetchResponses({ body: { authenticated: false } });

    const { result } = renderHook(() => useBffSessions(), {
      wrapper: createWrapper(defaultConfig),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual([]);
  });

  it('should set error on fetch failure', async () => {
    globalThis.fetch = mockFetchResponses({ body: authenticatedResponse }, { body: csrfResponse });
    // The sessions fetch fails
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useBffSessions(), {
      wrapper: createWrapper(defaultConfig),
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.sessions).toEqual([]);
  });

  it('should support refetch', async () => {
    globalThis.fetch = mockFetchResponses(
      { body: authenticatedResponse },
      { body: csrfResponse },
      { body: { sessions: [sessionsResponse.sessions[0]] } },
      { body: sessionsResponse }
    );

    const { result } = renderHook(() => useBffSessions(), {
      wrapper: createWrapper(defaultConfig),
    });

    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(1);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.sessions).toHaveLength(2);
  });
});

describe('useRevokeBffSession', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should revoke a session and toggle isRevoking', async () => {
    globalThis.fetch = mockFetchResponses({ body: authenticatedResponse }, { body: csrfResponse });
    // Revoke response
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    const { result } = renderHook(() => useRevokeBffSession(), {
      wrapper: createWrapper(defaultConfig),
    });

    // Wait for auth init
    await waitFor(() => {
      expect(result.current.isRevoking).toBe(false);
    });

    await act(async () => {
      await result.current.revoke('cd34...wx67');
    });

    expect(result.current.isRevoking).toBe(false);

    // Verify the DELETE call was made
    const calls = vi.mocked(globalThis.fetch).mock.calls;
    const deleteCall = calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('/bff/sessions/cd34...wx67')
    );
    expect(deleteCall).toBeDefined();
    expect(deleteCall?.[1]?.method).toBe('DELETE');
  });

  it('should propagate errors from revoke', async () => {
    globalThis.fetch = mockFetchResponses({ body: authenticatedResponse }, { body: csrfResponse });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response('Not found', { status: 404 }));

    const { result } = renderHook(() => useRevokeBffSession(), {
      wrapper: createWrapper(defaultConfig),
    });

    await waitFor(() => {
      expect(result.current.isRevoking).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.revoke('unknown-id');
      })
    ).rejects.toThrow('Failed to revoke BFF session: 404');
  });
});

describe('useRevokeAllOtherBffSessions', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should revoke all other sessions', async () => {
    globalThis.fetch = mockFetchResponses({ body: authenticatedResponse }, { body: csrfResponse });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    const { result } = renderHook(() => useRevokeAllOtherBffSessions(), {
      wrapper: createWrapper(defaultConfig),
    });

    await waitFor(() => {
      expect(result.current.isRevoking).toBe(false);
    });

    await act(async () => {
      await result.current.revokeAll();
    });

    expect(result.current.isRevoking).toBe(false);

    // Verify the DELETE call was made to /bff/sessions (no ID suffix)
    const calls = vi.mocked(globalThis.fetch).mock.calls;
    const deleteCall = calls.find(
      (c) => typeof c[0] === 'string' && c[0] === '/admin/bff/sessions' && c[1]?.method === 'DELETE'
    );
    expect(deleteCall).toBeDefined();
  });

  it('should propagate errors from revokeAll', async () => {
    globalThis.fetch = mockFetchResponses({ body: authenticatedResponse }, { body: csrfResponse });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response('Unauthorized', { status: 401 })
    );

    const { result } = renderHook(() => useRevokeAllOtherBffSessions(), {
      wrapper: createWrapper(defaultConfig),
    });

    await waitFor(() => {
      expect(result.current.isRevoking).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.revokeAll();
      })
    ).rejects.toThrow('Failed to revoke all other BFF sessions: 401');
  });
});
