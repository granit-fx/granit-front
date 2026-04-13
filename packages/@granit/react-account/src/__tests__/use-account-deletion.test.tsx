import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDeleteAccount } from '../hooks/use-account-deletion.js';
import { AccountProvider } from '../providers/account-provider.js';

import type { AccountConfig } from '../providers/account-provider.js';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    deleteAccount: vi.fn(),
  };
});

const { deleteAccount } = await import('@granit/account');

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

describe('useDeleteAccount', () => {
  it('should call deleteAccount with password confirmation', async () => {
    const client = createMockClient();
    vi.mocked(deleteAccount).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ password: 'MyP@ssword1!' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteAccount).toHaveBeenCalledWith(client, '/api/v1/account', {
      password: 'MyP@ssword1!',
    });
  });

  it('should handle wrong password error', async () => {
    const client = createMockClient();
    vi.mocked(deleteAccount).mockRejectedValue(new Error('Bad Request'));

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ password: 'wrong' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Bad Request');
  });

  it('should handle unauthorized error', async () => {
    const client = createMockClient();
    vi.mocked(deleteAccount).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ password: 'MyP@ssword1!' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});
