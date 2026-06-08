import {
  listAuthorizations,
  revokeAuthorization,
  revokeUserAuthorizations,
} from '@granit/openiddict-admin';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  useOidcAuthorizations,
  useRevokeAuthorization,
  useRevokeUserAuthorizations,
} from '../hooks/use-oidc-authorizations';
import { OpenIddictAdminProvider } from '../providers/openiddict-admin-provider';

import type { AdminOidcAuthorization } from '@granit/openiddict-admin';

vi.mock('@granit/openiddict-admin', () => ({
  listAuthorizations: vi.fn(),
  revokeAuthorization: vi.fn(),
  revokeUserAuthorizations: vi.fn(),
}));

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

const mockAuthorizations: readonly AdminOidcAuthorization[] = [
  {
    id: 'auth-001',
    clientId: 'guava-front',
    subject: 'usr-001',
    type: 'permanent',
    status: 'valid',
    scopes: ['openid', 'profile'],
  },
];

describe('useOidcAuthorizations', () => {
  it('should fetch authorizations', async () => {
    vi.mocked(listAuthorizations).mockResolvedValueOnce(mockAuthorizations);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useOidcAuthorizations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listAuthorizations).toHaveBeenCalledWith(expect.anything(), '/api/v1/admin', undefined);
    expect(result.current.data).toEqual(mockAuthorizations);
  });

  it('should pass params to listAuthorizations', async () => {
    vi.mocked(listAuthorizations).mockResolvedValueOnce(mockAuthorizations);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useOidcAuthorizations({ userId: 'usr-001' }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listAuthorizations).toHaveBeenCalledWith(expect.anything(), '/api/v1/admin', {
      userId: 'usr-001',
    });
  });

  it('should handle fetch error', async () => {
    vi.mocked(listAuthorizations).mockRejectedValueOnce(new Error('Server Error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useOidcAuthorizations(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Server Error');
  });
});

describe('useRevokeAuthorization', () => {
  it('should revoke an authorization and invalidate authorizations query', async () => {
    vi.mocked(revokeAuthorization).mockResolvedValueOnce(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRevokeAuthorization(), { wrapper });

    result.current.mutate('auth-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(revokeAuthorization).toHaveBeenCalledWith(
      expect.anything(),
      '/api/v1/admin',
      'auth-001'
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'oidc', 'authorizations'],
    });
  });

  it('should handle revoke error', async () => {
    vi.mocked(revokeAuthorization).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRevokeAuthorization(), { wrapper });

    result.current.mutate('invalid-id');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});

describe('useRevokeUserAuthorizations', () => {
  it('should revoke all user authorizations and invalidate query', async () => {
    vi.mocked(revokeUserAuthorizations).mockResolvedValueOnce(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRevokeUserAuthorizations(), { wrapper });

    result.current.mutate('usr-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(revokeUserAuthorizations).toHaveBeenCalledWith(
      expect.anything(),
      '/api/v1/admin',
      'usr-001'
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'oidc', 'authorizations'],
    });
  });

  it('should handle revoke all error', async () => {
    vi.mocked(revokeUserAuthorizations).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRevokeUserAuthorizations(), { wrapper });

    result.current.mutate('invalid-user');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});
