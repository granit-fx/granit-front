import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useConfirmEmail, useRegister, useResendConfirmation } from '../hooks/use-registration';
import { AccountProvider } from '../providers/account-provider';

import type { AccountConfig } from '../providers/account-provider';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    registerAccount: vi.fn(),
    confirmEmail: vi.fn(),
    resendConfirmationEmail: vi.fn(),
  };
});

const { registerAccount, confirmEmail, resendConfirmationEmail } = await import('@granit/account');

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

describe('useRegister', () => {
  it('should call registerAccount with correct arguments', async () => {
    const client = createMockClient();
    vi.mocked(registerAccount).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      email: 'user@example.com',
      password: 'P@ssword1!',
      firstName: 'John',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(registerAccount).toHaveBeenCalledWith(client, '/api/v1/account', {
      email: 'user@example.com',
      password: 'P@ssword1!',
      firstName: 'John',
    });
    expect(result.current.data).toBeUndefined();
  });

  it('should handle registration error', async () => {
    const client = createMockClient();
    vi.mocked(registerAccount).mockRejectedValue(new Error('Conflict'));

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ email: 'dup@example.com', password: 'P@ssword1!' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Conflict');
  });
});

describe('useConfirmEmail', () => {
  it('should call confirmEmail with userId and token', async () => {
    const client = createMockClient();
    vi.mocked(confirmEmail).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConfirmEmail(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ userId: 'user-1', token: 'abc123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(confirmEmail).toHaveBeenCalledWith(client, '/api/v1/account', 'user-1', 'abc123');
  });

  it('should handle invalid token error', async () => {
    const client = createMockClient();
    vi.mocked(confirmEmail).mockRejectedValue(new Error('Invalid token'));

    const { result } = renderHook(() => useConfirmEmail(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ userId: 'user-1', token: 'invalid' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Invalid token');
  });
});

describe('useResendConfirmation', () => {
  it('should call resendConfirmationEmail', async () => {
    const client = createMockClient();
    vi.mocked(resendConfirmationEmail).mockResolvedValue(undefined);

    const { result } = renderHook(() => useResendConfirmation(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(resendConfirmationEmail).toHaveBeenCalledWith(client, '/api/v1/account');
  });

  it('should handle rate limit error', async () => {
    const client = createMockClient();
    vi.mocked(resendConfirmationEmail).mockRejectedValue(new Error('Too Many Requests'));

    const { result } = renderHook(() => useResendConfirmation(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Too Many Requests');
  });
});
