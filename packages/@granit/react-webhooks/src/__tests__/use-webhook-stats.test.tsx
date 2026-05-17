import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useWebhookStats } from '../hooks/use-webhook-stats.js';
import { WebhooksProvider } from '../providers/webhooks-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { WebhookSubscriptionStatsResponse } from '@granit/webhooks';

function createWrapper(client: AxiosInstance, basePath?: string) {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <WebhooksProvider config={{ client, basePath }}>{children}</WebhooksProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

const mockStats: WebhookSubscriptionStatsResponse = {
  totalSubscriptions: 10,
  activeCount: 7,
  suspendedCount: 2,
  deactivatedCount: 1,
  deliveriesLast24h: 523,
  successRateLast24h: 99.2,
  avgResponseTimeMsLast24h: 85,
};

describe('useWebhookStats', () => {
  it('should fetch webhook stats with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockStats });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useWebhookStats(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/webhooks/stats');
    expect(result.current.data).toEqual(mockStats);
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockStats });

    const { wrapper } = createWrapper(client, '/api/v2/webhooks');
    const { result } = renderHook(() => useWebhookStats(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v2/webhooks/stats');
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useWebhookStats(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});
