import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { mockWebhookSubscriptions } from '@granit/react-webhooks/testing';

import { useSubscription } from '../hooks/use-subscription';
import { WebhooksProvider } from '../providers/webhooks-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { WebhookSubscriptionResponse } from '@granit/webhooks';

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

const mockSubscription: WebhookSubscriptionResponse = mockWebhookSubscriptions[0]!;
const subscriptionId = mockSubscription.id;

describe('useSubscription', () => {
  it('should fetch subscription with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockSubscription });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useSubscription(subscriptionId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith(`/api/v1/webhooks/subscriptions/${subscriptionId}`);
    expect(result.current.data).toEqual(mockSubscription);
  });

  it('should fetch subscription with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockSubscription });

    const { wrapper } = createWrapper(client, '/api/v2/webhooks');
    const { result } = renderHook(() => useSubscription(subscriptionId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith(`/api/v2/webhooks/subscriptions/${subscriptionId}`);
  });

  it('should be disabled when id is empty', () => {
    const client = createMockClient();

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useSubscription(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useSubscription(subscriptionId), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});
