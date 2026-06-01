import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCompletePasskeyAssertion } from '../hooks/use-complete-passkey-assertion';
import { LocalAuthProvider } from '../providers/local-auth-provider';

import type { LocalAuthConfig } from '../providers/local-auth-provider';
import type { AccountLoginResponse } from '@granit/authentication-local';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/authentication-local', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    completePasskeyAssertion: vi.fn(),
  };
});

const { completePasskeyAssertion } = await import('@granit/authentication-local');

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

describe('useCompletePasskeyAssertion', () => {
  it('should call completePasskeyAssertion with credential JSON', async () => {
    const client = createMockClient();
    const response: AccountLoginResponse = {
      succeeded: true,
      requiresTwoFactor: false,
      isLockedOut: false,
      isNotAllowed: false,
    };
    vi.mocked(completePasskeyAssertion).mockResolvedValue(response);

    const { result } = renderHook(() => useCompletePasskeyAssertion(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      credentialJson: '{"id":"cred-1","response":{"authenticatorData":"..."}}',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(completePasskeyAssertion).toHaveBeenCalledWith(client, '/api/v1/account', {
      credentialJson: '{"id":"cred-1","response":{"authenticatorData":"..."}}',
    });
    expect(result.current.data).toEqual(response);
  });

  it('should handle assertion failure', async () => {
    const client = createMockClient();
    vi.mocked(completePasskeyAssertion).mockRejectedValue(new Error('Invalid credential'));

    const { result } = renderHook(() => useCompletePasskeyAssertion(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ credentialJson: '{"invalid":"data"}' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Invalid credential');
  });
});
