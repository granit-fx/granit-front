import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useBeginPasskeyAssertion } from '../hooks/use-begin-passkey-assertion.js';
import { LocalAuthProvider } from '../providers/local-auth-provider.js';

import type { LocalAuthConfig } from '../providers/local-auth-provider.js';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/authentication-local', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    beginPasskeyAssertion: vi.fn(),
  };
});

const { beginPasskeyAssertion } = await import('@granit/authentication-local');

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

describe('useBeginPasskeyAssertion', () => {
  it('should call beginPasskeyAssertion and return options JSON', async () => {
    const client = createMockClient();
    const optionsJson = '{"challenge":"abc123","rpId":"example.com"}';
    vi.mocked(beginPasskeyAssertion).mockResolvedValue(optionsJson);

    const { result } = renderHook(() => useBeginPasskeyAssertion(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(beginPasskeyAssertion).toHaveBeenCalledWith(client, '/api/v1/account');
    expect(result.current.data).toBe(optionsJson);
  });

  it('should handle assertion error', async () => {
    const client = createMockClient();
    vi.mocked(beginPasskeyAssertion).mockRejectedValue(new Error('Not supported'));

    const { result } = renderHook(() => useBeginPasskeyAssertion(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not supported');
  });
});
