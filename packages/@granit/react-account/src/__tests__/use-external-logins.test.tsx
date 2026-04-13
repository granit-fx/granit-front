import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useChallengeExternalLogin,
  useExternalLogins,
  useUnlinkExternalLogin,
} from '../hooks/use-external-logins.js';
import { AccountProvider } from '../providers/account-provider.js';

import type { AccountConfig } from '../providers/account-provider.js';
import type { AccountExternalLoginInfo } from '@granit/account';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getExternalLogins: vi.fn(),
    challengeExternalLogin: vi.fn(),
    unlinkExternalLogin: vi.fn(),
  };
});

const { getExternalLogins, challengeExternalLogin, unlinkExternalLogin } =
  await import('@granit/account');

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

function createWrapperWithQueryClient(client: AxiosInstance) {
  const queryClient = createTestQueryClient();
  const config: AccountConfig = { client };
  return {
    wrapper: ({ children }: { children: ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        <AccountProvider config={config}>{children}</AccountProvider>
      ),
    queryClient,
  };
}

const mockLogins: readonly AccountExternalLoginInfo[] = [
  {
    loginProvider: 'Google',
    providerKey: 'goog-123',
    providerDisplayName: 'Google',
  },
  {
    loginProvider: 'Microsoft',
    providerKey: 'ms-456',
    providerDisplayName: 'Microsoft',
  },
];

afterEach(() => {
  vi.clearAllMocks();
});

describe('useExternalLogins', () => {
  it('should fetch external logins', async () => {
    const client = createMockClient();
    vi.mocked(getExternalLogins).mockResolvedValue(mockLogins);

    const { result } = renderHook(() => useExternalLogins(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getExternalLogins).toHaveBeenCalledWith(client, '/account');
    expect(result.current.data).toEqual(mockLogins);
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(getExternalLogins).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useExternalLogins(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});

describe('useChallengeExternalLogin', () => {
  it('should call challengeExternalLogin with provider', async () => {
    const client = createMockClient();
    vi.mocked(challengeExternalLogin).mockResolvedValue(undefined);

    const { result } = renderHook(() => useChallengeExternalLogin(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate('Google');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(challengeExternalLogin).toHaveBeenCalledWith(client, '/account', 'Google');
  });
});

describe('useUnlinkExternalLogin', () => {
  it('should call unlinkExternalLogin and invalidate on success', async () => {
    const client = createMockClient();
    vi.mocked(unlinkExternalLogin).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnlinkExternalLogin(), { wrapper });

    result.current.mutate('Google');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(unlinkExternalLogin).toHaveBeenCalledWith(client, '/account', 'Google');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['account', 'external-logins'],
    });
  });

  it('should handle unlink error', async () => {
    const client = createMockClient();
    vi.mocked(unlinkExternalLogin).mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useUnlinkExternalLogin(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate('Google');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Forbidden');
  });
});
