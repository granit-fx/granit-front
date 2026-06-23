import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  mockLoginRequiresTwoFactor,
  mockLoginSuccess,
} from '@granit/react-authentication-local/testing';

import { useLoginWithRedirect } from '../hooks/use-login-with-redirect';
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

let locationMock: { href: string; search: string };

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

function stubLocation(search = '') {
  locationMock = { href: '', search };
  vi.stubGlobal('location', locationMock);
}

describe('useLoginWithRedirect', () => {
  it('redirects to returnUrl on success', async () => {
    stubLocation();
    const client = createMockClient();
    vi.mocked(loginAccount).mockResolvedValue(mockLoginSuccess);

    const { result } = renderHook(
      () =>
        useLoginWithRedirect({
          search: '?returnUrl=%2Fconnect%2Fauthorize%3Fclient_id%3Dadmin',
        }),
      { wrapper: createWrapper(client) }
    );

    result.current.loginAndRedirect({
      login: 'user@example.com',
      password: 'P@ssw0rd!',
    });

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));

    expect(locationMock.href).toBe('/connect/authorize?client_id=admin');
  });

  it('redirects to fallbackUrl when returnUrl is absent', async () => {
    stubLocation();
    const client = createMockClient();
    vi.mocked(loginAccount).mockResolvedValue(mockLoginSuccess);

    const { result } = renderHook(
      () => useLoginWithRedirect({ search: '', fallbackUrl: '/dashboard' }),
      { wrapper: createWrapper(client) }
    );

    result.current.loginAndRedirect({
      login: 'user@example.com',
      password: 'P@ssw0rd!',
    });

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));

    expect(locationMock.href).toBe('/dashboard');
  });

  it('redirects to "/" when no returnUrl and no fallbackUrl', async () => {
    stubLocation();
    const client = createMockClient();
    vi.mocked(loginAccount).mockResolvedValue(mockLoginSuccess);

    const { result } = renderHook(() => useLoginWithRedirect({ search: '' }), {
      wrapper: createWrapper(client),
    });

    result.current.loginAndRedirect({
      login: 'user@example.com',
      password: 'P@ssw0rd!',
    });

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));

    expect(locationMock.href).toBe('/');
  });

  it('calls onTwoFactorRequired when 2FA is needed', async () => {
    const client = createMockClient();
    vi.mocked(loginAccount).mockResolvedValue(mockLoginRequiresTwoFactor);
    const onTwoFactorRequired = vi.fn();

    const { result } = renderHook(() => useLoginWithRedirect({ search: '', onTwoFactorRequired }), {
      wrapper: createWrapper(client),
    });

    result.current.loginAndRedirect({
      login: 'user@example.com',
      password: 'P@ssw0rd!',
    });

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));

    expect(onTwoFactorRequired).toHaveBeenCalledOnce();
  });

  it('exposes the underlying mutation for UI state', async () => {
    const client = createMockClient();
    vi.mocked(loginAccount).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useLoginWithRedirect({ search: '' }), {
      wrapper: createWrapper(client),
    });

    result.current.loginAndRedirect({
      login: 'user@example.com',
      password: 'wrong',
    });

    await waitFor(() => expect(result.current.mutation.isError).toBe(true));

    expect(result.current.mutation.error?.message).toBe('Network error');
  });

  it('calls onError when the login request fails', async () => {
    const client = createMockClient();
    const error = new Error('Request failed');
    vi.mocked(loginAccount).mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderHook(() => useLoginWithRedirect({ search: '', onError }), {
      wrapper: createWrapper(client),
    });

    result.current.loginAndRedirect({
      login: 'user@example.com',
      password: 'wrong',
    });

    await waitFor(() => expect(result.current.mutation.isError).toBe(true));

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(error);
  });
});
