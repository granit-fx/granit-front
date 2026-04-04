import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useDeliveries } from '../hooks/use-deliveries.js';

import type { WebhookDeliveryAttemptResponse } from '@granit/webhooks';

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

const mockDeliveries: WebhookDeliveryAttemptResponse[] = [
  {
    deliveryId: toEntityId<'WebhookDelivery'>('del-001'),
    subscriptionId: toEntityId<'WebhookSubscription'>('sub-001'),
    tenantId: null,
    eventType: 'document.uploaded',
    targetUrl: 'https://example.com/webhook',
    httpStatusCode: 200,
    payloadHash: 'a'.repeat(64),
    occurredAt: toISODateString('2026-03-20T10:00:00Z'),
    durationMs: 142,
    errorMessage: null,
    isSuccess: true,
    payload: null,
  },
  {
    deliveryId: toEntityId<'WebhookDelivery'>('del-002'),
    subscriptionId: toEntityId<'WebhookSubscription'>('sub-001'),
    tenantId: null,
    eventType: 'document.uploaded',
    targetUrl: 'https://example.com/webhook',
    httpStatusCode: 500,
    payloadHash: 'b'.repeat(64),
    occurredAt: toISODateString('2026-03-20T10:05:00Z'),
    durationMs: 3021,
    errorMessage: 'Internal Server Error',
    isSuccess: false,
    payload: null,
  },
];

describe('useDeliveries', () => {
  it('should fetch deliveries for a subscription', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockDeliveries });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeliveries('sub-001', { client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/webhooks/deliveries/query', {
      params: { subscriptionId: 'sub-001' },
    });
    expect(result.current.data).toEqual(mockDeliveries);
  });

  it('should be disabled when subscriptionId is empty', () => {
    const client = createMockClient();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeliveries('', { client }), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: [] });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useDeliveries('sub-001', { client, basePath: '/api/v2/webhooks' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v2/webhooks/deliveries/query', {
      params: { subscriptionId: 'sub-001' },
    });
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeliveries('sub-001', { client }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});
