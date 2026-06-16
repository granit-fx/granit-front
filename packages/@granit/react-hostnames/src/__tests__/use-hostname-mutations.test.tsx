import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { hostnamesKeys } from '../hooks/query-keys';
import {
  useClearPrimary,
  useCreateHostname,
  useDeleteHostname,
  useSetPrimary,
  useVerifyNow,
} from '../hooks/use-hostname-mutations';
import { HostnamesProvider } from '../providers/hostnames-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { ManagedHostnameResponse } from '@granit/hostnames';

function createWrapper(client: AxiosInstance) {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <HostnamesProvider config={{ client }}>{children}</HostnamesProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

const mockHostname: ManagedHostnameResponse = {
  id: '11111111-0001-4000-a000-000000000001',
  host: 'app.acme.com',
  ownerType: 'cms.site',
  ownerId: 'aaaaaaaa-0001-4000-a000-000000000001',
  tenantId: 'tttttttt-0001-4000-a000-000000000001',
  isPrimary: true,
  status: 'Active',
  verificationToken: null,
  expectedDnsRecords: [],
  lastCheckedAt: toISODateString('2026-06-01T08:00:00Z'),
  conflicts: [],
  failedCheckCount: 0,
  nextCheckAt: toISODateString('2026-06-02T08:00:00Z'),
  certificateStatus: 'Secured',
  certExpiresAt: toISODateString('2027-06-01T08:00:00Z'),
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  createdBy: 'admin@acme.com',
  modifiedAt: toISODateString('2026-06-01T08:00:00Z'),
  modifiedBy: 'admin@acme.com',
  concurrencyStamp: 'stamp-0001',
};

describe('useCreateHostname', () => {
  it('sends POST and invalidates list on success', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: mockHostname });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateHostname(), { wrapper });

    result.current.mutate({
      host: 'app.acme.com',
      ownerType: 'cms.site',
      ownerId: 'aaaaaaaa-0001-4000-a000-000000000001',
      isPrimary: true,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/hostnames', {
      host: 'app.acme.com',
      ownerType: 'cms.site',
      ownerId: 'aaaaaaaa-0001-4000-a000-000000000001',
      isPrimary: true,
    });
    expect(result.current.data).toEqual(mockHostname);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: hostnamesKeys.lists() });
  });

  it('handles creation error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Conflict'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useCreateHostname(), { wrapper });

    result.current.mutate({
      host: 'taken.example.com',
      ownerType: 'cms.site',
      ownerId: 'owner-1',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Conflict');
  });
});

describe('useSetPrimary', () => {
  it('sends POST to /{id}/primary and invalidates hostname + list on success', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSetPrimary(), { wrapper });

    result.current.mutate('11111111-0001-4000-a000-000000000001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith(
      '/api/hostnames/11111111-0001-4000-a000-000000000001/primary'
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: hostnamesKeys.hostname('11111111-0001-4000-a000-000000000001'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: hostnamesKeys.lists() });
  });
});

describe('useClearPrimary', () => {
  it('sends DELETE to /{id}/primary and invalidates hostname + list on success', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useClearPrimary(), { wrapper });

    result.current.mutate('11111111-0001-4000-a000-000000000001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.delete).toHaveBeenCalledWith(
      '/api/hostnames/11111111-0001-4000-a000-000000000001/primary'
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: hostnamesKeys.hostname('11111111-0001-4000-a000-000000000001'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: hostnamesKeys.lists() });
  });
});

describe('useDeleteHostname', () => {
  it('sends DELETE and invalidates list on success', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteHostname(), { wrapper });

    result.current.mutate('11111111-0001-4000-a000-000000000001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.delete).toHaveBeenCalledWith(
      '/api/hostnames/11111111-0001-4000-a000-000000000001'
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: hostnamesKeys.lists() });
  });

  it('handles delete error', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useDeleteHostname(), { wrapper });

    result.current.mutate('non-existent-id');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not Found');
  });
});

describe('useVerifyNow', () => {
  it('sends POST to /verify-now, returns updated hostname, and invalidates hostname query', async () => {
    const client = createMockClient();
    const verifying = { ...mockHostname, status: 'Verifying' as const };
    vi.mocked(client.post).mockResolvedValueOnce({ data: verifying });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useVerifyNow(), { wrapper });

    result.current.mutate('11111111-0001-4000-a000-000000000001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith(
      '/api/hostnames/11111111-0001-4000-a000-000000000001/verify-now'
    );
    expect(result.current.data).toEqual(verifying);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: hostnamesKeys.hostname('11111111-0001-4000-a000-000000000001'),
    });
  });
});
