import {
  createApplication,
  deleteApplication,
  listApplications,
  rotateApplicationSecret,
} from '@granit/openiddict-admin';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  useCreateOidcApplication,
  useDeleteOidcApplication,
  useOidcApplications,
  useRotateApplicationSecret,
} from '../hooks/use-oidc-applications.js';
import { OpenIddictAdminProvider } from '../providers/openiddict-admin-provider.js';

import type {
  AdminOidcApplication,
  AdminOidcApplicationSecretResponse,
} from '@granit/openiddict-admin';

vi.mock('@granit/openiddict-admin', () => ({
  listApplications: vi.fn(),
  createApplication: vi.fn(),
  deleteApplication: vi.fn(),
  rotateApplicationSecret: vi.fn(),
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

const mockApp: AdminOidcApplication = {
  clientId: 'guava-front',
  displayName: 'Guava Frontend',
  type: 'confidential',
  tenantId: null,
};

const mockApps: readonly AdminOidcApplication[] = [mockApp];

describe('useOidcApplications', () => {
  it('should fetch all OIDC applications', async () => {
    vi.mocked(listApplications).mockResolvedValueOnce(mockApps);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useOidcApplications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listApplications).toHaveBeenCalledWith(expect.anything(), '/api/admin');
    expect(result.current.data).toEqual(mockApps);
  });

  it('should handle fetch error', async () => {
    vi.mocked(listApplications).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useOidcApplications(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});

describe('useCreateOidcApplication', () => {
  it('should create an application and invalidate applications query', async () => {
    vi.mocked(createApplication).mockResolvedValueOnce(mockApp);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateOidcApplication(), { wrapper });

    result.current.mutate({
      clientId: 'guava-front',
      displayName: 'Guava Frontend',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createApplication).toHaveBeenCalledWith(expect.anything(), '/api/admin', {
      clientId: 'guava-front',
      displayName: 'Guava Frontend',
    });
    expect(result.current.data).toEqual(mockApp);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'oidc', 'applications'],
    });
  });

  it('should handle creation error', async () => {
    vi.mocked(createApplication).mockRejectedValueOnce(new Error('Conflict'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateOidcApplication(), { wrapper });

    result.current.mutate({ clientId: 'duplicate' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Conflict');
  });
});

describe('useDeleteOidcApplication', () => {
  it('should delete an application and invalidate applications query', async () => {
    vi.mocked(deleteApplication).mockResolvedValueOnce(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteOidcApplication(), { wrapper });

    result.current.mutate('guava-front');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteApplication).toHaveBeenCalledWith(expect.anything(), '/api/admin', 'guava-front');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'oidc', 'applications'],
    });
  });

  it('should handle delete error', async () => {
    vi.mocked(deleteApplication).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteOidcApplication(), { wrapper });

    result.current.mutate('invalid');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});

describe('useRotateApplicationSecret', () => {
  const mockSecretResponse: AdminOidcApplicationSecretResponse = {
    clientId: 'guava-front',
    newSecret: 'generated-secret-value',
  };

  it('should rotate application secret', async () => {
    vi.mocked(rotateApplicationSecret).mockResolvedValueOnce(mockSecretResponse);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRotateApplicationSecret(), { wrapper });

    result.current.mutate('guava-front');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(rotateApplicationSecret).toHaveBeenCalledWith(
      expect.anything(),
      '/api/admin',
      'guava-front'
    );
    expect(result.current.data).toEqual(mockSecretResponse);
  });

  it('should handle rotate error', async () => {
    vi.mocked(rotateApplicationSecret).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRotateApplicationSecret(), { wrapper });

    result.current.mutate('guava-front');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});
