import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockAccountSettings } from '@granit/react-account/testing';

import { useAvailableExternalProviders } from '../hooks/use-available-external-providers';
import { AccountProvider } from '../providers/account-provider';

import type { AccountConfig } from '../providers/account-provider';
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

describe('useAvailableExternalProviders', () => {
  it('derives the providers list from the account config', async () => {
    const client = createMockClient();
    vi.mocked(getAccountSettings).mockResolvedValue(mockAccountSettings);

    const { result } = renderHook(() => useAvailableExternalProviders(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.providers).toEqual(mockAccountSettings.externalProviders);
  });

  it('returns an empty list while loading', () => {
    const client = createMockClient();
    vi.mocked(getAccountSettings).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAvailableExternalProviders(), {
      wrapper: createWrapper(client),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.providers).toEqual([]);
  });

  it('returns an empty list when the config exposes no providers', async () => {
    const client = createMockClient();
    const response: AccountSettingsResponse = {
      allowSelfRegistration: false,
      externalProviders: [],
    };
    vi.mocked(getAccountSettings).mockResolvedValue(response);

    const { result } = renderHook(() => useAvailableExternalProviders(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.providers).toEqual([]);
  });

  it('returns an empty list (fail-closed) when the config fetch fails', async () => {
    const client = createMockClient();
    vi.mocked(getAccountSettings).mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useAvailableExternalProviders(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.providers).toEqual([]);
  });
});
