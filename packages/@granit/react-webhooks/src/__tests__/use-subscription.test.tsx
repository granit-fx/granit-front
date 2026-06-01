import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { WebhookSubscriptionStatus } from '@granit/webhooks';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

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

const mockSubscription: WebhookSubscriptionResponse = {
  id: toEntityId<'WebhookSubscription'>('sub-001'),
  targetUrl: 'https://example.com/webhook',
  eventType: 'document.uploaded',
  status: WebhookSubscriptionStatus.Active,
  consecutiveFailureCount: 0,
  lastSuccessAt: toISODateString('2026-03-20T10:00:00Z'),
  createdAt: toISODateString('2026-03-01T08:00:00Z'),
  modifiedAt: null,
  signingSecretHint: 'whsec_b46a****************5182',
};

describe('useSubscription', () => {
  it('should fetch subscription with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockSubscription });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useSubscription('sub-001'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/webhooks/subscriptions/sub-001');
    expect(result.current.data).toEqual(mockSubscription);
  });

  it('should fetch subscription with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockSubscription });

    const { wrapper } = createWrapper(client, '/api/v2/webhooks');
    const { result } = renderHook(() => useSubscription('sub-001'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v2/webhooks/subscriptions/sub-001');
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
    const { result } = renderHook(() => useSubscription('sub-001'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});
