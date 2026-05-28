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
  useActivateSubscription,
  useDeactivateSubscription,
  useSuspendSubscription,
} from '../hooks/use-subscription-lifecycle.js';
import { WebhooksProvider } from '../providers/webhooks-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { WebhookSubscriptionResponse } from '@granit/webhooks';

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
  // Legacy subscription created before the hint was introduced — exercises the null path.
  createdAt: toISODateString('2026-03-01T08:00:00Z'),
  modifiedAt: null,
  signingSecretHint: null,
};

describe('useActivateSubscription', () => {
  it('should send POST to /{id}/activate and invalidate on success', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: mockSubscription });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useActivateSubscription(), { wrapper });

    result.current.mutate('sub-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/webhooks/subscriptions/sub-001/activate');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webhooksKeys.subscriptions(),
    });
  });

  it('should handle activation error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Conflict'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useActivateSubscription(), { wrapper });

    result.current.mutate('sub-001');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Conflict');
  });
});

describe('useSuspendSubscription', () => {
  it('should send POST to /{id}/suspend and invalidate on success', async () => {
    const client = createMockClient();
    const suspended = { ...mockSubscription, status: WebhookSubscriptionStatus.Suspended };
    vi.mocked(client.post).mockResolvedValueOnce({ data: suspended });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSuspendSubscription(), { wrapper });

    result.current.mutate('sub-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/webhooks/subscriptions/sub-001/suspend');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webhooksKeys.subscriptions(),
    });
  });
});

describe('useDeactivateSubscription', () => {
  it('should send POST to /{id}/deactivate with reason and invalidate on success', async () => {
    const client = createMockClient();
    const deactivated = { ...mockSubscription, status: WebhookSubscriptionStatus.Deactivated };
    vi.mocked(client.post).mockResolvedValueOnce({ data: deactivated });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeactivateSubscription(), { wrapper });

    result.current.mutate({
      id: 'sub-001',
      request: { reason: 'No longer needed' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/webhooks/subscriptions/sub-001/deactivate', {
      reason: 'No longer needed',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webhooksKeys.subscriptions(),
    });
  });

  it('should handle deactivation error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useDeactivateSubscription(), { wrapper });

    result.current.mutate({
      id: 'sub-001',
      request: { reason: 'Test' },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});
