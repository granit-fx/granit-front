import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useChangeEmail, useConfirmEmailChange } from '../hooks/use-email';
import { AccountProvider } from '../providers/account-provider';

import type { AccountConfig } from '../providers/account-provider';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    changeEmail: vi.fn(),
    confirmEmailChange: vi.fn(),
  };
});

const { changeEmail, confirmEmailChange } = await import('@granit/account');

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

describe('useChangeEmail', () => {
  it('should call changeEmail with correct arguments', async () => {
    const client = createMockClient();
    vi.mocked(changeEmail).mockResolvedValue(undefined);

    const { result } = renderHook(() => useChangeEmail(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ newEmail: 'new@example.com' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(changeEmail).toHaveBeenCalledWith(client, '/api/v1/account', {
      newEmail: 'new@example.com',
    });
  });

  it('should handle error gracefully', async () => {
    const client = createMockClient();
    vi.mocked(changeEmail).mockRejectedValue(new Error('Service Unavailable'));

    const { result } = renderHook(() => useChangeEmail(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ newEmail: 'new@example.com' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Service Unavailable');
  });
});

describe('useConfirmEmailChange', () => {
  it('should call confirmEmailChange with correct arguments', async () => {
    const client = createMockClient();
    vi.mocked(confirmEmailChange).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConfirmEmailChange(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      userId: 'user-1',
      newEmail: 'new@example.com',
      token: 'confirm-token-abc',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(confirmEmailChange).toHaveBeenCalledWith(client, '/api/v1/account', {
      userId: 'user-1',
      newEmail: 'new@example.com',
      token: 'confirm-token-abc',
    });
  });

  it('should handle invalid token error', async () => {
    const client = createMockClient();
    vi.mocked(confirmEmailChange).mockRejectedValue(new Error('Bad Request'));

    const { result } = renderHook(() => useConfirmEmailChange(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      userId: 'user-1',
      newEmail: 'new@example.com',
      token: 'expired-token',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Bad Request');
  });
});
