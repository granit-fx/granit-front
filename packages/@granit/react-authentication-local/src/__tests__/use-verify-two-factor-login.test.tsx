import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useVerifyTwoFactorLogin } from '../hooks/use-verify-two-factor-login';
import { LocalAuthProvider } from '../providers/local-auth-provider';

import type { LocalAuthConfig } from '../providers/local-auth-provider';
import type { AccountLoginResponse } from '@granit/authentication-local';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/authentication-local', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    verifyTwoFactorLogin: vi.fn(),
  };
});

const { verifyTwoFactorLogin } = await import('@granit/authentication-local');

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

describe('useVerifyTwoFactorLogin', () => {
  it('should call verifyTwoFactorLogin with TOTP code', async () => {
    const client = createMockClient();
    const response: AccountLoginResponse = {
      succeeded: true,
      requiresTwoFactor: false,
      isLockedOut: false,
      isNotAllowed: false,
    };
    vi.mocked(verifyTwoFactorLogin).mockResolvedValue(response);

    const { result } = renderHook(() => useVerifyTwoFactorLogin(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ code: '123456' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(verifyTwoFactorLogin).toHaveBeenCalledWith(client, '/api/v1/account', {
      code: '123456',
    });
    expect(result.current.data).toEqual(response);
  });

  it('should call verifyTwoFactorLogin with recovery code', async () => {
    const client = createMockClient();
    const response: AccountLoginResponse = {
      succeeded: true,
      requiresTwoFactor: false,
      isLockedOut: false,
      isNotAllowed: false,
    };
    vi.mocked(verifyTwoFactorLogin).mockResolvedValue(response);

    const { result } = renderHook(() => useVerifyTwoFactorLogin(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ code: 'ABCD-1234-EFGH', method: 'RecoveryCode' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(verifyTwoFactorLogin).toHaveBeenCalledWith(client, '/api/v1/account', {
      code: 'ABCD-1234-EFGH',
      method: 'RecoveryCode',
    });
  });

  it('should call verifyTwoFactorLogin with an emailed code', async () => {
    const client = createMockClient();
    const response: AccountLoginResponse = {
      succeeded: true,
      requiresTwoFactor: false,
      isLockedOut: false,
      isNotAllowed: false,
    };
    vi.mocked(verifyTwoFactorLogin).mockResolvedValue(response);

    const { result } = renderHook(() => useVerifyTwoFactorLogin(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ code: '654321', method: 'Email' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(verifyTwoFactorLogin).toHaveBeenCalledWith(client, '/api/v1/account', {
      code: '654321',
      method: 'Email',
    });
  });

  it('should handle invalid code error', async () => {
    const client = createMockClient();
    vi.mocked(verifyTwoFactorLogin).mockRejectedValue(new Error('Invalid code'));

    const { result } = renderHook(() => useVerifyTwoFactorLogin(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ code: '000000' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Invalid code');
  });
});
