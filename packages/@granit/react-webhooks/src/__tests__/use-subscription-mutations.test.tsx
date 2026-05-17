import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { WebhookSubscriptionStatus } from '@granit/webhooks';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { webhooksKeys } from '../hooks/query-keys.js';
import {
  useCreateSubscription,
  useDeleteSubscription,
  useUpdateSubscription,
} from '../hooks/use-subscription-mutations.js';
import { WebhooksProvider } from '../providers/webhooks-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type {
  WebhookSubscriptionCreatedResponse,
  WebhookSubscriptionResponse,
} from '@granit/webhooks';

function createWrapper(client: AxiosInstance) {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <WebhooksProvider config={{ client }}>{children}</WebhooksProvider>
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
  lastSuccessAt: null,
  createdAt: toISODateString('2026-03-01T08:00:00Z'),
  modifiedAt: null,
};

describe('useCreateSubscription', () => {
  it('should send POST and invalidate subscriptions on success', async () => {
    const client = createMockClient();
    const response: WebhookSubscriptionCreatedResponse = {
      id: toEntityId<'WebhookSubscription'>('sub-002'),
      targetUrl: 'https://example.com/webhook',
      eventType: 'document.uploaded',
      status: WebhookSubscriptionStatus.Active,
      signingSecret: 'whsec_abc123',
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: response });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateSubscription(), { wrapper });

    result.current.mutate({
      targetUrl: 'https://example.com/webhook',
      eventType: 'document.uploaded',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/webhooks/subscriptions', {
      targetUrl: 'https://example.com/webhook',
      eventType: 'document.uploaded',
    });
    expect(result.current.data).toEqual(response);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webhooksKeys.subscriptions(),
    });
  });

  it('should handle creation error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Bad Request'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useCreateSubscription(), { wrapper });

    result.current.mutate({
      targetUrl: 'invalid-url',
      eventType: 'document.uploaded',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Bad Request');
  });
});

describe('useUpdateSubscription', () => {
  it('should send PUT to /{id} and invalidate on success', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValueOnce({ data: mockSubscription });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateSubscription(), { wrapper });

    result.current.mutate({
      id: 'sub-001',
      request: { targetUrl: 'https://example.com/v2/webhook' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.put).toHaveBeenCalledWith('/api/v1/webhooks/subscriptions/sub-001', {
      targetUrl: 'https://example.com/v2/webhook',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webhooksKeys.subscriptions(),
    });
  });
});

describe('useDeleteSubscription', () => {
  it('should send DELETE to /{id} and invalidate on success', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteSubscription(), { wrapper });

    result.current.mutate('sub-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.delete).toHaveBeenCalledWith('/api/v1/webhooks/subscriptions/sub-001');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webhooksKeys.subscriptions(),
    });
  });

  it('should handle delete error', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useDeleteSubscription(), { wrapper });

    result.current.mutate('sub-001');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});
