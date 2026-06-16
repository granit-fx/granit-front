import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTenantStorageQuota } from '../hooks/use-quota';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TenantStorageQuotaResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const sampleQuota: TenantStorageQuotaResponse = {
  limitBytes: 10_000_000,
  usageBytes: 1_024,
  percentUsed: 0.01,
  updatedAt: toISODateString('2026-05-01T00:00:00Z'),
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <DocumentsProvider config={{ client }}>{children}</DocumentsProvider>
      </QueryClientProvider>
    );
  };
}

describe('useTenantStorageQuota', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /quota', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleQuota });

    const { result } = renderHook(() => useTenantStorageQuota(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/quota');
    expect(result.current.data).toEqual(sampleQuota);
  });

  it('respects options.enabled = false', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useTenantStorageQuota({ enabled: false }), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
