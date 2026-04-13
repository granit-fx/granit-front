import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAccountSettings } from '../hooks/use-account-settings.js';
import { AccountProvider } from '../providers/account-provider.js';

import type { AccountConfig } from '../providers/account-provider.js';
import type { AccountSettingsResponse } from '@granit/account';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getAccountSettings: vi.fn(),
  };
});

const { getAccountSettings } = await import('@granit/account');

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

describe('useAccountSettings', () => {
  it('should fetch account settings with default basePath', async () => {
    const client = createMockClient();
    const response: AccountSettingsResponse = { allowSelfRegistration: true };
    vi.mocked(getAccountSettings).mockResolvedValue(response);

    const { result } = renderHook(() => useAccountSettings(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getAccountSettings).toHaveBeenCalledWith(client, '/api/v1/account');
    expect(result.current.data).toEqual({ allowSelfRegistration: true });
  });

  it('should return allowSelfRegistration false when endpoint returns false', async () => {
    const client = createMockClient();
    const response: AccountSettingsResponse = { allowSelfRegistration: false };
    vi.mocked(getAccountSettings).mockResolvedValue(response);

    const { result } = renderHook(() => useAccountSettings(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.allowSelfRegistration).toBe(false);
  });

  it('should have no data when fetch fails (fail-closed)', async () => {
    const client = createMockClient();
    vi.mocked(getAccountSettings).mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useAccountSettings(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // No data on error — consumers use `data?.allowSelfRegistration ?? false`
    expect(result.current.data).toBeUndefined();
  });

  it('should not retry on failure', async () => {
    const client = createMockClient();
    vi.mocked(getAccountSettings).mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useAccountSettings(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(getAccountSettings).toHaveBeenCalledTimes(1);
  });
});
