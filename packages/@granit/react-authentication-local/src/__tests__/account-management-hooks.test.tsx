import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePasskeys, useDeletePasskey } from '../hooks/use-passkeys';
import { useChangePassword } from '../hooks/use-password';
import { useProfile, useUpdateProfile } from '../hooks/use-profile';
import { useEnableTwoFactor, useTwoFactorStatus } from '../hooks/use-two-factor';
import { LocalAuthProvider } from '../providers/local-auth-provider';

import type { LocalAuthConfig } from '../providers/local-auth-provider';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/authentication-local', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getTwoFactorStatus: vi.fn(),
    enableTwoFactor: vi.fn(),
    listPasskeys: vi.fn(),
    deletePasskey: vi.fn(),
    changePassword: vi.fn(),
  };
});

const api = await import('@granit/authentication-local');

function createWrapper(client: AxiosInstance) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    const config: LocalAuthConfig = { client };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <LocalAuthProvider config={config}>{children}</LocalAuthProvider>
    );
  };
}

afterEach(() => vi.clearAllMocks());

describe('account-management hooks', () => {
  it('useProfile fetches the profile at the resolved base path', async () => {
    const client = createMockClient();
    vi.mocked(api.getProfile).mockResolvedValue({
      userId: 'u1',
      email: 'a@b.c',
      emailConfirmed: true,
      firstName: null,
      lastName: null,
      twoFactorEnabled: false,
      hasPassword: true,
      externalLogins: [],
    });

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.getProfile).toHaveBeenCalledWith(client, '/api/v1/account');
    expect(result.current.data?.userId).toBe('u1');
  });

  it('useUpdateProfile primes the profile cache from the response', async () => {
    const client = createMockClient();
    const updated = {
      userId: 'u1',
      email: 'a@b.c',
      emailConfirmed: true,
      firstName: 'Ada',
      lastName: 'Lovelace',
      twoFactorEnabled: false,
      hasPassword: true,
      externalLogins: [],
    };
    vi.mocked(api.updateProfile).mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper(client) });
    result.current.mutate({ firstName: 'Ada', lastName: 'Lovelace' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.updateProfile).toHaveBeenCalledWith(client, '/api/v1/account', {
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });

  it('useTwoFactorStatus fetches the status', async () => {
    const client = createMockClient();
    vi.mocked(api.getTwoFactorStatus).mockResolvedValue({
      isEnabled: true,
      hasAuthenticatorApp: true,
      recoveryCodesLeft: 5,
    });

    const { result } = renderHook(() => useTwoFactorStatus(), { wrapper: createWrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.recoveryCodesLeft).toBe(5);
  });

  it('useEnableTwoFactor returns recovery codes', async () => {
    const client = createMockClient();
    vi.mocked(api.enableTwoFactor).mockResolvedValue({ recoveryCodes: ['a', 'b'] });

    const { result } = renderHook(() => useEnableTwoFactor(), { wrapper: createWrapper(client) });
    result.current.mutate({ code: '123456' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.recoveryCodes).toHaveLength(2);
    expect(api.enableTwoFactor).toHaveBeenCalledWith(client, '/api/v1/account', { code: '123456' });
  });

  it('usePasskeys lists passkeys and useDeletePasskey removes one', async () => {
    const client = createMockClient();
    vi.mocked(api.listPasskeys).mockResolvedValue([
      { id: 'pk-1', name: 'Laptop', createdAt: '2026-01-01T00:00:00Z', lastUsedAt: null },
    ] as never);
    vi.mocked(api.deletePasskey).mockResolvedValue(undefined);

    const list = renderHook(() => usePasskeys(), { wrapper: createWrapper(client) });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    expect(list.result.current.data).toHaveLength(1);

    const del = renderHook(() => useDeletePasskey(), { wrapper: createWrapper(client) });
    del.result.current.mutate('pk-1');
    await waitFor(() => expect(del.result.current.isSuccess).toBe(true));
    expect(api.deletePasskey).toHaveBeenCalledWith(client, '/api/v1/account', 'pk-1');
  });

  it('useChangePassword posts the change', async () => {
    const client = createMockClient();
    vi.mocked(api.changePassword).mockResolvedValue(undefined);

    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper(client) });
    result.current.mutate({ currentPassword: 'old', newPassword: 'new' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.changePassword).toHaveBeenCalledWith(client, '/api/v1/account', {
      currentPassword: 'old',
      newPassword: 'new',
    });
  });
});
