import { createScope, deleteScope, listScopes } from '@granit/openiddict-admin';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useCreateOidcScope, useDeleteOidcScope, useOidcScopes } from '../hooks/use-oidc-scopes.js';
import { OpenIddictAdminProvider } from '../providers/openiddict-admin-provider.js';

import type { AdminOidcScope } from '@granit/openiddict-admin';

vi.mock('@granit/openiddict-admin', () => ({
  listScopes: vi.fn(),
  createScope: vi.fn(),
  deleteScope: vi.fn(),
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

const mockScope: AdminOidcScope = {
  name: 'api',
  displayName: 'API access',
  description: null,
};

const mockScopes: readonly AdminOidcScope[] = [
  mockScope,
  { name: 'openid', displayName: 'OpenID', description: null },
];

describe('useOidcScopes', () => {
  it('should fetch all OIDC scopes', async () => {
    vi.mocked(listScopes).mockResolvedValueOnce(mockScopes);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useOidcScopes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listScopes).toHaveBeenCalledWith(expect.anything(), '/api/admin');
    expect(result.current.data).toEqual(mockScopes);
  });

  it('should handle fetch error', async () => {
    vi.mocked(listScopes).mockRejectedValueOnce(new Error('Server Error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useOidcScopes(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Server Error');
  });
});

describe('useCreateOidcScope', () => {
  it('should create a scope and invalidate scopes query', async () => {
    vi.mocked(createScope).mockResolvedValueOnce(mockScope);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateOidcScope(), { wrapper });

    result.current.mutate({
      name: 'api',
      displayName: 'API access',
      description: 'Grants API access',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createScope).toHaveBeenCalledWith(expect.anything(), '/api/admin', {
      name: 'api',
      displayName: 'API access',
      description: 'Grants API access',
    });
    expect(result.current.data).toEqual(mockScope);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'oidc', 'scopes'],
    });
  });

  it('should handle creation error', async () => {
    vi.mocked(createScope).mockRejectedValueOnce(new Error('Conflict'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateOidcScope(), { wrapper });

    result.current.mutate({ name: 'duplicate' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Conflict');
  });
});

describe('useDeleteOidcScope', () => {
  it('should delete a scope and invalidate scopes query', async () => {
    vi.mocked(deleteScope).mockResolvedValueOnce(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteOidcScope(), { wrapper });

    result.current.mutate('api');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteScope).toHaveBeenCalledWith(expect.anything(), '/api/admin', 'api');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'oidc', 'scopes'],
    });
  });

  it('should handle delete error', async () => {
    vi.mocked(deleteScope).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteOidcScope(), { wrapper });

    result.current.mutate('invalid');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});
