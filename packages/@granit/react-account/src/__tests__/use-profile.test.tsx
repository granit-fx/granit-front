import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useProfile, useUpdateProfile } from '../hooks/use-profile.js';
import { AccountProvider } from '../providers/account-provider.js';

import type { AccountConfig } from '../providers/account-provider.js';
import type { AccountProfileResponse } from '@granit/account';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  };
});

const { getProfile, updateProfile } = await import('@granit/account');

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

const mockProfile: AccountProfileResponse = {
  userId: toEntityId<'User'>('user-1'),
  email: 'user@example.com',
  emailConfirmed: true,
  firstName: 'John',
  lastName: 'Doe',
  twoFactorEnabled: false,
  hasPassword: true,
  externalLogins: [],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('useProfile', () => {
  it('should fetch profile with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(getProfile).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getProfile).toHaveBeenCalledWith(client, '/api/v1/account');
    expect(result.current.data).toEqual(mockProfile);
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(getProfile).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});

describe('useUpdateProfile', () => {
  it('should call updateProfile and invalidate profile query on success', async () => {
    const client = createMockClient();
    const updatedProfile: AccountProfileResponse = { ...mockProfile, firstName: 'Jane' };
    vi.mocked(updateProfile).mockResolvedValue(updatedProfile);

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({ firstName: 'Jane' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateProfile).toHaveBeenCalledWith(client, '/api/v1/account', { firstName: 'Jane' });
    expect(result.current.data).toEqual(updatedProfile);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['account', 'profile'],
    });
  });

  it('should handle update error', async () => {
    const client = createMockClient();
    vi.mocked(updateProfile).mockRejectedValue(new Error('Bad Request'));

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ firstName: '' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Bad Request');
  });
});
