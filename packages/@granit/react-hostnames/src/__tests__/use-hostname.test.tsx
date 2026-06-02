import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useCheckAvailability, useHostname } from '../hooks/use-hostname';
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
  lastCheckedAt: '2026-06-01T08:00:00Z',
  conflicts: [],
  failedCheckCount: 0,
  nextCheckAt: '2026-06-02T08:00:00Z',
  certificateStatus: 'Secured',
  certExpiresAt: '2027-06-01T08:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'admin@acme.com',
  modifiedAt: '2026-06-01T08:00:00Z',
  modifiedBy: 'admin@acme.com',
  concurrencyStamp: 'stamp-0001',
};

describe('useHostname', () => {
  it('fetches a single hostname by ID', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockHostname });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useHostname('11111111-0001-4000-a000-000000000001'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/hostnames/11111111-0001-4000-a000-000000000001');
    expect(result.current.data).toEqual(mockHostname);
  });

  it('is disabled when id is empty', () => {
    const client = createMockClient();
    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useHostname(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useCheckAvailability', () => {
  it('checks hostname availability', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { host: 'new.example.com', isAvailable: true },
    });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useCheckAvailability('new.example.com'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/hostnames/availability', {
      params: { host: 'new.example.com' },
    });
    expect(result.current.data?.isAvailable).toBe(true);
  });

  it('returns false for taken hostnames', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { host: 'taken.example.com', isAvailable: false },
    });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useCheckAvailability('taken.example.com'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.isAvailable).toBe(false);
  });

  it('is disabled when host is empty', () => {
    const client = createMockClient();
    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useCheckAvailability(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
