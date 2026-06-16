import { toEntityId } from '@granit/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_BASE_PATH } from '../constants';
import { useAnchorEntry, useUpdateEntryBody } from '../hooks/use-entry-mutations';
import { TimelineProvider } from '../providers/timeline-provider';

import { axiosResponse, createMockClient } from './test-utils';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TimelineProvider config={{ client, basePath: DEFAULT_BASE_PATH }}>
        {children}
      </TimelineProvider>
    </QueryClientProvider>
  );
}

describe('useAnchorEntry', () => {
  it('POSTs to the anchor endpoint and returns the entryId', async () => {
    const entryId = toEntityId<'TimelineStreamEntryResponse'>('entry-42');
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse({ entryId }));

    const { result } = renderHook(() => useAnchorEntry(), {
      wrapper: createWrapper(client),
    });

    let returned: unknown;
    await act(async () => {
      returned = await result.current.mutateAsync({
        entityType: 'Invoice',
        entityId: 'inv-1',
        sourceKey: 'email',
        sourceId: 'msg-7',
      });
    });

    expect(returned).toBe(entryId);
    expect(client.post).toHaveBeenCalledWith(expect.stringContaining('/Invoice/inv-1/anchor'), {
      sourceKey: 'email',
      sourceId: 'msg-7',
    });
  });
});

describe('useUpdateEntryBody', () => {
  it('PATCHes the entry body endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.patch).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useUpdateEntryBody(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        entityType: 'Invoice',
        entityId: 'inv-1',
        entryId: toEntityId<'TimelineStreamEntryResponse'>('entry-3'),
        body: 'updated body',
      });
    });

    expect(client.patch).toHaveBeenCalledWith(
      expect.stringContaining('/Invoice/inv-1/entries/entry-3'),
      { body: 'updated body' }
    );
  });
});
