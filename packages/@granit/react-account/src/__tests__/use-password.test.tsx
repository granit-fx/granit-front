import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useChangePassword, useForgotPassword, useResetPassword } from '../hooks/use-password';
import { AccountProvider } from '../providers/account-provider';

import type { AccountConfig } from '../providers/account-provider';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  };
});

const { changePassword, forgotPassword, resetPassword } = await import('@granit/account');

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

describe('useChangePassword', () => {
  it('should call changePassword with correct arguments', async () => {
    const client = createMockClient();
    vi.mocked(changePassword).mockResolvedValue(undefined);

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      currentPassword: 'OldP@ss1!',
      newPassword: 'NewP@ss1!',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(changePassword).toHaveBeenCalledWith(client, '/api/v1/account', {
      currentPassword: 'OldP@ss1!',
      newPassword: 'NewP@ss1!',
    });
  });

  it('should handle wrong current password error', async () => {
    const client = createMockClient();
    vi.mocked(changePassword).mockRejectedValue(new Error('Bad Request'));

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      currentPassword: 'wrong',
      newPassword: 'NewP@ss1!',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Bad Request');
  });
});

describe('useForgotPassword', () => {
  it('should call forgotPassword with correct arguments', async () => {
    const client = createMockClient();
    vi.mocked(forgotPassword).mockResolvedValue(undefined);

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ email: 'user@example.com' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(forgotPassword).toHaveBeenCalledWith(client, '/api/v1/account', {
      email: 'user@example.com',
    });
  });

  it('should handle error gracefully', async () => {
    const client = createMockClient();
    vi.mocked(forgotPassword).mockRejectedValue(new Error('Service Unavailable'));

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ email: 'user@example.com' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Service Unavailable');
  });
});

describe('useResetPassword', () => {
  it('should call resetPassword with correct arguments', async () => {
    const client = createMockClient();
    vi.mocked(resetPassword).mockResolvedValue(undefined);

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      userId: 'user-1',
      token: 'reset-token-abc',
      newPassword: 'NewP@ss1!',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(resetPassword).toHaveBeenCalledWith(client, '/api/v1/account', {
      userId: 'user-1',
      token: 'reset-token-abc',
      newPassword: 'NewP@ss1!',
    });
  });

  it('should handle invalid reset token error', async () => {
    const client = createMockClient();
    vi.mocked(resetPassword).mockRejectedValue(new Error('Bad Request'));

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      userId: 'user-1',
      token: 'expired-token',
      newPassword: 'NewP@ss1!',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Bad Request');
  });
});
