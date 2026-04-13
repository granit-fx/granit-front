import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useBackToImpersonator, useSessionHeartbeat } from '../hooks/use-session.js';
import { AccountProvider } from '../providers/account-provider.js';

import type { AccountConfig } from '../providers/account-provider.js';
import type { AccountImpersonationResult } from '@granit/account';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    sessionHeartbeat: vi.fn(),
    backToImpersonator: vi.fn(),
  };
});

const { sessionHeartbeat, backToImpersonator } = await import('@granit/account');

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: AccountConfig = { client };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <AccountProvider config={config}>{children}</AccountProvider>
    );
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useSessionHeartbeat', () => {
  it('should call sessionHeartbeat', async () => {
    const client = createMockClient();
    vi.mocked(sessionHeartbeat).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSessionHeartbeat(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sessionHeartbeat).toHaveBeenCalledWith(client, '/api/v1/account');
  });

  it('should handle heartbeat error', async () => {
    const client = createMockClient();
    vi.mocked(sessionHeartbeat).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useSessionHeartbeat(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});

describe('useBackToImpersonator', () => {
  it('should call backToImpersonator', async () => {
    const client = createMockClient();
    const response: AccountImpersonationResult = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    };
    vi.mocked(backToImpersonator).mockResolvedValue(response);

    const { result } = renderHook(() => useBackToImpersonator(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(backToImpersonator).toHaveBeenCalledWith(client, '/api/v1/account');
    expect(result.current.data).toEqual(response);
  });

  it('should handle error when not impersonating', async () => {
    const client = createMockClient();
    vi.mocked(backToImpersonator).mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useBackToImpersonator(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Forbidden');
  });
});
