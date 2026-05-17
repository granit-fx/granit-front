import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useEventTypes } from '../hooks/use-event-types.js';
import { WebhooksProvider } from '../providers/webhooks-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { WebhookEventTypeResponse } from '@granit/webhooks';

vi.mock('@granit/webhooks', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getEventTypes: vi.fn(),
  };
});

const { getEventTypes } = await import('@granit/webhooks');

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

const mockEventTypes: WebhookEventTypeResponse[] = [
  {
    eventType: 'document.uploaded',
    displayName: 'Document Uploaded',
    description: 'Fired when a document is uploaded',
    category: 'Documents',
  },
];

describe('useEventTypes', () => {
  it('should fetch event types with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(getEventTypes).mockResolvedValue(mockEventTypes);

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useEventTypes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getEventTypes).toHaveBeenCalledWith(client, '/api/v1/webhooks');
    expect(result.current.data).toEqual(mockEventTypes);
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(getEventTypes).mockResolvedValue([]);

    const { wrapper } = createWrapper(client, '/custom');
    renderHook(() => useEventTypes(), { wrapper });

    await waitFor(() => expect(getEventTypes).toHaveBeenCalledWith(client, '/custom'));
  });
});
