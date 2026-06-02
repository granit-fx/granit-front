import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useHostnames } from '../hooks/use-hostnames';
import { HostnamesProvider } from '../providers/hostnames-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { ManagedHostnameResponse, PagedResponse } from '@granit/hostnames';

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

const mockPage: PagedResponse<ManagedHostnameResponse> = {
  items: [
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
      lastCheckedAt: '2026-06-01T08:00:00Z',
      conflicts: [],
      failedCheckCount: 0,
      nextCheckAt: '2026-06-02T08:00:00Z',
      certificateStatus: 'Secured',
      certExpiresAt: '2027-06-01T08:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T08:00:00Z',
      concurrencyStamp: 'stamp-0001',
    },
  ],
  totalCount: 1,
  page: 0,
  pageSize: 20,
};

describe('useHostnames', () => {
  it('fetches the list with no params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockPage });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useHostnames(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/hostnames', { params: undefined });
    expect(result.current.data).toEqual(mockPage);
  });

  it('passes pagination and filter params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { items: [], totalCount: 0, page: 1, pageSize: 10 },
    });

    const { wrapper } = createWrapper(client);
    const params = { page: 1, pageSize: 10, ownerType: 'cms.site' };
    const { result } = renderHook(() => useHostnames(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/hostnames', {
      params: { page: 1, pageSize: 10, ownerType: 'cms.site' },
    });
  });

  it('surfaces query errors', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Unauthorized'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useHostnames(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});
