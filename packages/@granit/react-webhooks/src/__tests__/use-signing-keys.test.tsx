import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { WebhookSigningKeyStatus } from '@granit/webhooks';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { webhooksKeys } from '../hooks/query-keys';
import {
  useCreateSigningKey,
  useDeleteSigningKey,
  useSigningKeys,
} from '../hooks/use-signing-keys';
import { WebhooksProvider } from '../providers/webhooks-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { WebhookSigningKeyCreatedResponse, WebhookSigningKeyResponse } from '@granit/webhooks';

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

const mockKeys: WebhookSigningKeyResponse[] = [
  {
    id: toEntityId<'WebhookSigningKey'>('wsk-001'),
    subscriptionId: toEntityId<'WebhookSubscription'>('sub-001'),
    createdAt: toISODateString('2026-03-01T08:00:00Z'),
    expiresAt: null,
    revokedAt: null,
    lastRotationNotificationAt: null,
    status: WebhookSigningKeyStatus.Active,
  },
];

describe('useSigningKeys', () => {
  it('should GET /{id}/keys for a subscription', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockKeys });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useSigningKeys('sub-001'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/webhooks/subscriptions/sub-001/keys');
    expect(result.current.data).toEqual(mockKeys);
  });

  it('should be disabled when subscriptionId is empty', () => {
    const client = createMockClient();

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useSigningKeys(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useCreateSigningKey', () => {
  it('should POST /{id}/keys and invalidate keys + subscription', async () => {
    const client = createMockClient();
    const response: WebhookSigningKeyCreatedResponse = {
      id: toEntityId<'WebhookSigningKey'>('wsk-002'),
      subscriptionId: toEntityId<'WebhookSubscription'>('sub-001'),
      createdAt: toISODateString('2026-03-21T10:00:00Z'),
      plainSecret: 'whsec_new456',
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: response });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateSigningKey(), { wrapper });
    result.current.mutate('sub-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/webhooks/subscriptions/sub-001/keys');
    expect(result.current.data).toEqual(response);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webhooksKeys.signingKeys('sub-001'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webhooksKeys.subscription('sub-001'),
    });
  });

  it('should handle rotation error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useCreateSigningKey(), { wrapper });
    result.current.mutate('sub-001');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Forbidden');
  });
});

describe('useDeleteSigningKey', () => {
  it('should DELETE /{id}/keys/{keyId} and invalidate keys', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteSigningKey(), { wrapper });
    result.current.mutate({ subscriptionId: 'sub-001', keyId: 'wsk-001' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.delete).toHaveBeenCalledWith(
      '/api/v1/webhooks/subscriptions/sub-001/keys/wsk-001'
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webhooksKeys.signingKeys('sub-001'),
    });
  });

  it('should propagate the "last Active key" error', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockRejectedValueOnce(new Error('Bad Request'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useDeleteSigningKey(), { wrapper });
    result.current.mutate({ subscriptionId: 'sub-001', keyId: 'wsk-001' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Bad Request');
  });
});
