import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { webhooksKeys } from '../hooks/query-keys.js';
import { useRetryDelivery } from '../hooks/use-retry-delivery.js';
import { WebhooksProvider } from '../providers/webhooks-provider.js';

import type { AxiosInstance } from '@granit/api-client';

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

describe('useRetryDelivery', () => {
  it('should send POST to /deliveries/{deliveryId}/retry and invalidate deliveries', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRetryDelivery(), { wrapper });

    result.current.mutate({
      deliveryId: 'del-001',
      subscriptionId: 'sub-001',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/webhooks/deliveries/del-001/retry');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webhooksKeys.deliveries('sub-001'),
    });
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper(client, '/custom/webhooks');
    const { result } = renderHook(() => useRetryDelivery(), { wrapper });

    result.current.mutate({
      deliveryId: 'del-002',
      subscriptionId: 'sub-001',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/custom/webhooks/deliveries/del-002/retry');
  });

  it('should handle retry error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useRetryDelivery(), { wrapper });

    result.current.mutate({
      deliveryId: 'del-999',
      subscriptionId: 'sub-001',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});
