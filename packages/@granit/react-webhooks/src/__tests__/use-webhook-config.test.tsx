import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useWebhookConfig } from '../hooks/use-webhook-config.js';
import { WebhooksProvider } from '../providers/webhooks-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { WebhookModuleConfig } from '@granit/webhooks';

vi.mock('@granit/webhooks', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getConfig: vi.fn(),
  };
});

const { getConfig } = await import('@granit/webhooks');

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

afterEach(() => {
  vi.clearAllMocks();
});

const mockConfig: WebhookModuleConfig = {
  storePayload: true,
};

describe('useWebhookConfig', () => {
  it('should fetch webhook config with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(getConfig).mockResolvedValue(mockConfig);

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useWebhookConfig(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getConfig).toHaveBeenCalledWith(client, '/api/v1/webhooks');
    expect(result.current.data).toEqual(mockConfig);
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(getConfig).mockResolvedValue(mockConfig);

    const { wrapper } = createWrapper(client, '/custom');
    renderHook(() => useWebhookConfig(), { wrapper });

    await waitFor(() => expect(getConfig).toHaveBeenCalledWith(client, '/custom'));
  });
});
