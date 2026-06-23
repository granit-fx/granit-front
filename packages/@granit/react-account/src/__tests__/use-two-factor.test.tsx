import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockTwoFactorStatus } from '@granit/react-account/testing';

import {
  useAuthenticatorKey,
  useDisableTwoFactor,
  useDisableTwoFactorEmail,
  useEnableTwoFactor,
  useEnableTwoFactorEmail,
  useGenerateRecoveryCodes,
  useSendTwoFactorEmailEnrollmentCode,
  useTwoFactorStatus,
} from '../hooks/use-two-factor';
import { AccountProvider } from '../providers/account-provider';

import type { AccountConfig } from '../providers/account-provider';
import type {
  AccountAuthenticatorKeyResponse,
  AccountRecoveryCodesResponse,
  AccountTwoFactorEnableResponse,
} from '@granit/account';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getTwoFactorStatus: vi.fn(),
    getAuthenticatorKey: vi.fn(),
    enableTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
    generateRecoveryCodes: vi.fn(),
    sendTwoFactorEmailEnrollmentCode: vi.fn(),
    enableTwoFactorEmail: vi.fn(),
    disableTwoFactorEmail: vi.fn(),
  };
});

const {
  getTwoFactorStatus,
  getAuthenticatorKey,
  enableTwoFactor,
  disableTwoFactor,
  generateRecoveryCodes,
  sendTwoFactorEmailEnrollmentCode,
  enableTwoFactorEmail,
  disableTwoFactorEmail,
} = await import('@granit/account');

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

afterEach(() => {
  vi.clearAllMocks();
});

describe('useTwoFactorStatus', () => {
  it('should fetch two-factor status', async () => {
    const client = createMockClient();
    vi.mocked(getTwoFactorStatus).mockResolvedValue(mockTwoFactorStatus);

    const { result } = renderHook(() => useTwoFactorStatus(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getTwoFactorStatus).toHaveBeenCalledWith(client, '/api/v1/account');
    expect(result.current.data).toEqual(mockTwoFactorStatus);
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(getTwoFactorStatus).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useTwoFactorStatus(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});

describe('useAuthenticatorKey', () => {
  it('should fetch authenticator key', async () => {
    const client = createMockClient();
    const mockKey: AccountAuthenticatorKeyResponse = {
      sharedKey: 'ABCD1234',
      qrCodeUri: 'otpauth://totp/app:user@example.com?secret=ABCD1234',
    };
    vi.mocked(getAuthenticatorKey).mockResolvedValue(mockKey);

    const { result } = renderHook(() => useAuthenticatorKey(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getAuthenticatorKey).toHaveBeenCalledWith(client, '/api/v1/account');
    expect(result.current.data).toEqual(mockKey);
  });
});

describe('useEnableTwoFactor', () => {
  it('should call enableTwoFactor and invalidate two-factor query on success', async () => {
    const client = createMockClient();
    const response: AccountTwoFactorEnableResponse = {
      recoveryCodes: ['CODE1', 'CODE2', 'CODE3'],
    };
    vi.mocked(enableTwoFactor).mockResolvedValue(response);

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useEnableTwoFactor(), { wrapper });

    result.current.mutate({ code: '123456' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(enableTwoFactor).toHaveBeenCalledWith(client, '/api/v1/account', { code: '123456' });
    expect(result.current.data).toEqual(response);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['account', 'two-factor'],
    });
  });

  it('should handle invalid code error', async () => {
    const client = createMockClient();
    vi.mocked(enableTwoFactor).mockRejectedValue(new Error('Bad Request'));

    const { result } = renderHook(() => useEnableTwoFactor(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ code: '000000' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Bad Request');
  });
});

describe('useDisableTwoFactor', () => {
  it('should call disableTwoFactor and invalidate two-factor query on success', async () => {
    const client = createMockClient();
    vi.mocked(disableTwoFactor).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDisableTwoFactor(), { wrapper });

    result.current.mutate({ password: 'P@ssw0rd!' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(disableTwoFactor).toHaveBeenCalledWith(client, '/api/v1/account', {
      password: 'P@ssw0rd!',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['account', 'two-factor'],
    });
  });
});

describe('useGenerateRecoveryCodes', () => {
  it('should call generateRecoveryCodes and invalidate two-factor query on success', async () => {
    const client = createMockClient();
    const response: AccountRecoveryCodesResponse = {
      recoveryCodes: ['NEW1', 'NEW2', 'NEW3'],
    };
    vi.mocked(generateRecoveryCodes).mockResolvedValue(response);

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useGenerateRecoveryCodes(), { wrapper });

    result.current.mutate({ password: 'P@ssw0rd!' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(generateRecoveryCodes).toHaveBeenCalledWith(client, '/api/v1/account', {
      password: 'P@ssw0rd!',
    });
    expect(result.current.data).toEqual(response);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['account', 'two-factor'],
    });
  });
});

describe('useSendTwoFactorEmailEnrollmentCode', () => {
  it('should call sendTwoFactorEmailEnrollmentCode with no arguments', async () => {
    const client = createMockClient();
    vi.mocked(sendTwoFactorEmailEnrollmentCode).mockResolvedValue();

    const { result } = renderHook(() => useSendTwoFactorEmailEnrollmentCode(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sendTwoFactorEmailEnrollmentCode).toHaveBeenCalledWith(client, '/api/v1/account');
  });
});

describe('useEnableTwoFactorEmail', () => {
  it('should call enableTwoFactorEmail and invalidate two-factor query on success', async () => {
    const client = createMockClient();
    vi.mocked(enableTwoFactorEmail).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useEnableTwoFactorEmail(), { wrapper });

    result.current.mutate({ code: '123456' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(enableTwoFactorEmail).toHaveBeenCalledWith(client, '/api/v1/account', {
      code: '123456',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['account', 'two-factor'],
    });
  });
});

describe('useDisableTwoFactorEmail', () => {
  it('should call disableTwoFactorEmail and invalidate two-factor query on success', async () => {
    const client = createMockClient();
    vi.mocked(disableTwoFactorEmail).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDisableTwoFactorEmail(), { wrapper });

    result.current.mutate({ password: 'P@ssw0rd!' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(disableTwoFactorEmail).toHaveBeenCalledWith(client, '/api/v1/account', {
      password: 'P@ssw0rd!',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['account', 'two-factor'],
    });
  });
});
