import { impersonateUser, listUsers } from '@granit/openiddict-admin';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdminUsers, useImpersonateUser } from '../hooks/use-admin-users.js';
import { OpenIddictAdminProvider } from '../providers/openiddict-admin-provider.js';

import type { AdminImpersonationResult, AdminUser, AdminUserPage } from '@granit/openiddict-admin';

vi.mock('@granit/openiddict-admin', () => ({
  listUsers: vi.fn(),
  impersonateUser: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function createWrapper() {
  const queryClient = createTestQueryClient();
  const client = createMockClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <OpenIddictAdminProvider config={{ client }}>{children}</OpenIddictAdminProvider>
      </QueryClientProvider>
    ),
    queryClient,
    client,
  };
}

const mockUser: AdminUser = {
  userId: 'usr-001',
  username: 'admin',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  enabled: true,
  metadata: {},
};

const mockPage: AdminUserPage = {
  items: [mockUser],
  totalCount: 1,
};

describe('useAdminUsers', () => {
  it('should fetch users list', async () => {
    vi.mocked(listUsers).mockResolvedValueOnce(mockPage);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminUsers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listUsers).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockPage);
  });

  it('should pass params to listUsers', async () => {
    vi.mocked(listUsers).mockResolvedValueOnce(mockPage);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminUsers({ search: 'admin', page: 1, pageSize: 10 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listUsers).toHaveBeenCalledWith(expect.anything(), '/api/v1/admin', {
      search: 'admin',
      page: 1,
      pageSize: 10,
    });
  });

  it('should handle fetch error', async () => {
    vi.mocked(listUsers).mockRejectedValueOnce(new Error('Server Error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminUsers(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Server Error');
  });
});

describe('useImpersonateUser', () => {
  const mockImpersonation: AdminImpersonationResult = {
    accessToken: 'impersonated-access-token',
    refreshToken: 'impersonated-refresh-token',
    expiresIn: 3600,
  };

  it('should impersonate a user and return tokens', async () => {
    vi.mocked(impersonateUser).mockResolvedValueOnce(mockImpersonation);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useImpersonateUser(), { wrapper });

    result.current.mutate('usr-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(impersonateUser).toHaveBeenCalledWith(expect.anything(), '/api/v1/admin', 'usr-001');
    expect(result.current.data).toEqual(mockImpersonation);
  });

  it('should handle impersonation error', async () => {
    vi.mocked(impersonateUser).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useImpersonateUser(), { wrapper });

    result.current.mutate('usr-001');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});
