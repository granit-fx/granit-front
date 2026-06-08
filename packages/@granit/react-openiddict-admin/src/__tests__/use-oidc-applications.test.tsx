import {
  createApplication,
  deleteApplication,
  listApplications,
  rotateApplicationSecret,
  updateApplication,
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
  useUpdateOidcApplication,
} from '../hooks/use-oidc-applications';
import { OpenIddictAdminProvider } from '../providers/openiddict-admin-provider';

import type {
  AdminOidcApplication,
  AdminOidcApplicationSecretResponse,
} from '@granit/openiddict-admin';

vi.mock('@granit/openiddict-admin', () => ({
  listApplications: vi.fn(),
  createApplication: vi.fn(),
  deleteApplication: vi.fn(),
  rotateApplicationSecret: vi.fn(),
  updateApplication: vi.fn(),
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
  permissions: ['ept:token', 'gt:authorization_code'],
  redirectUris: ['https://guava.local/callback'],
  postLogoutRedirectUris: ['https://guava.local/signout-callback'],
  consentType: 'implicit',
  clientSide: 3,
  hasSigningKey: false,
};

const mockApps: readonly AdminOidcApplication[] = [mockApp];

describe('useOidcApplications', () => {
  it('should fetch all OIDC applications', async () => {
    vi.mocked(listApplications).mockResolvedValueOnce(mockApps);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useOidcApplications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listApplications).toHaveBeenCalledWith(expect.anything(), '/api/v1/admin');
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

    expect(createApplication).toHaveBeenCalledWith(expect.anything(), '/api/v1/admin', {
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

    expect(deleteApplication).toHaveBeenCalledWith(
      expect.anything(),
      '/api/v1/admin',
      'guava-front'
    );
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

describe('useUpdateOidcApplication', () => {
  it('should update an application and invalidate applications query', async () => {
    const updated: AdminOidcApplication = { ...mockApp, displayName: 'Guava Frontend v2' };
    vi.mocked(updateApplication).mockResolvedValueOnce(updated);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateOidcApplication(), { wrapper });

    result.current.mutate({ clientId: 'guava-front', request: { displayName: 'Guava Frontend v2' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateApplication).toHaveBeenCalledWith(expect.anything(), '/api/v1/admin', 'guava-front', {
      displayName: 'Guava Frontend v2',
    });
    expect(result.current.data).toEqual(updated);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['openiddict-admin', 'oidc', 'applications'],
    });
  });

  it('should handle update error', async () => {
    vi.mocked(updateApplication).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateOidcApplication(), { wrapper });

    result.current.mutate({ clientId: 'unknown', request: { displayName: 'X' } });

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
      '/api/v1/admin',
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
