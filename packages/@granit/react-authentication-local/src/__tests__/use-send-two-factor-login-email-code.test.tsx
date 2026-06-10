import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSendTwoFactorLoginEmailCode } from '../hooks/use-send-two-factor-login-email-code';
import { LocalAuthProvider } from '../providers/local-auth-provider';

import type { LocalAuthConfig } from '../providers/local-auth-provider';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/authentication-local', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    sendTwoFactorLoginEmailCode: vi.fn(),
  };
});

const { sendTwoFactorLoginEmailCode } = await import('@granit/authentication-local');

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

describe('useSendTwoFactorLoginEmailCode', () => {
  it('should call sendTwoFactorLoginEmailCode with no arguments', async () => {
    const client = createMockClient();
    vi.mocked(sendTwoFactorLoginEmailCode).mockResolvedValue();

    const { result } = renderHook(() => useSendTwoFactorLoginEmailCode(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sendTwoFactorLoginEmailCode).toHaveBeenCalledWith(client, '/api/v1/account');
  });

  it('should surface a "no active 2FA session" error', async () => {
    const client = createMockClient();
    vi.mocked(sendTwoFactorLoginEmailCode).mockRejectedValue(new Error('No active 2FA session'));

    const { result } = renderHook(() => useSendTwoFactorLoginEmailCode(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('No active 2FA session');
  });
});
