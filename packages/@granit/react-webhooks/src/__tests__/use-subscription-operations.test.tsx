import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useTestPing } from '../hooks/use-subscription-operations';
import { WebhooksProvider } from '../providers/webhooks-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { WebhookSubscriptionTestPingResponse } from '@granit/webhooks';

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

describe('useTestPing', () => {
  it('should send POST to /{id}/test-ping', async () => {
    const client = createMockClient();
    const response: WebhookSubscriptionTestPingResponse = {
      success: true,
      httpStatusCode: 200,
      durationMs: 142,
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: response });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useTestPing(), { wrapper });

    result.current.mutate('sub-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/webhooks/subscriptions/sub-001/test-ping');
    expect(result.current.data).toEqual(response);
  });

  it('should report failed ping', async () => {
    const client = createMockClient();
    const response: WebhookSubscriptionTestPingResponse = {
      success: false,
      httpStatusCode: 503,
      durationMs: 5012,
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: response });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useTestPing(), { wrapper });

    result.current.mutate('sub-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.success).toBe(false);
  });
});
