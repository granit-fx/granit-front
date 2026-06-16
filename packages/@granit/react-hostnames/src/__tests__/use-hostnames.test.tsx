import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useHostnames } from '../hooks/use-hostnames';
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

const mockList: readonly ManagedHostnameResponse[] = [
  {
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
  },
];

describe('useHostnames', () => {
  it('fetches the list with required owner params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockList });

    const { wrapper } = createWrapper(client);
    const params = { ownerType: 'cms.site', ownerId: 'aaaaaaaa-0001-4000-a000-000000000001' };
    const { result } = renderHook(() => useHostnames(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/hostnames', { params });
    expect(result.current.data).toEqual(mockList);
  });

  it('passes maxResults param', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: [] });

    const { wrapper } = createWrapper(client);
    const params = { ownerType: 'cms.site', ownerId: 'owner-1', maxResults: 50 };
    const { result } = renderHook(() => useHostnames(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/hostnames', { params });
  });

  it('is disabled when ownerType is empty', () => {
    const client = createMockClient();
    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useHostnames({ ownerType: '', ownerId: 'owner-1' }), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('surfaces query errors', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Unauthorized'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(
      () => useHostnames({ ownerType: 'cms.site', ownerId: 'owner-1' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});
