import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockLoginSuccess } from '@granit/react-authentication-local/testing';

import { useLogin } from '../hooks/use-login';
import { LocalAuthProvider } from '../providers/local-auth-provider';

import type { LocalAuthConfig } from '../providers/local-auth-provider';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/authentication-local', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    loginAccount: vi.fn(),
  };
});

const { loginAccount } = await import('@granit/authentication-local');

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: LocalAuthConfig = { client };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <LocalAuthProvider config={config}>{children}</LocalAuthProvider>
    );
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useLogin', () => {
  it('should call loginAccount with correct arguments', async () => {
    const client = createMockClient();
    vi.mocked(loginAccount).mockResolvedValue(mockLoginSuccess);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      login: 'user@example.com',
      password: 'P@ssw0rd!',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(loginAccount).toHaveBeenCalledWith(client, '/api/v1/account', {
      login: 'user@example.com',
      password: 'P@ssw0rd!',
    });
    expect(result.current.data).toEqual(mockLoginSuccess);
  });

  it('should handle login error', async () => {
    const client = createMockClient();
    vi.mocked(loginAccount).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ login: 'bad@example.com', password: 'wrong' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});
