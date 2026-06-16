import { TimelineEntryType } from '@granit/timeline';
import { toEntityId, toISODateString } from '@granit/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTimeline } from '../hooks/use-timeline';

import { axiosResponse, createMockClient, createWrapper } from './test-utils.tsx';

import type { TimelineStreamEntryResponse, TimelineEntryPage } from '@granit/timeline';

function makeEntry(
  overrides: Partial<TimelineStreamEntryResponse> = {}
): TimelineStreamEntryResponse {
  return {
    id: toEntityId<'TimelineStreamEntryResponse'>('e-1'),
    entryType: TimelineEntryType.Comment,
    body: 'Test comment',
    authorId: toEntityId<'User'>('u-1'),
    authorName: 'Dr. Martin',
    parentEntryId: null,
    occurredAt: toISODateString('2026-01-01T00:00:00Z'),
    attachments: [],
    ...overrides,
  };
}

describe('useTimeline', () => {
  it('should load entries on mount', async () => {
    const client = createMockClient();
    const page: TimelineEntryPage = {
      items: [makeEntry()],
      totalCount: 1,
      nextCursor: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const { result } = renderHook(() => useTimeline({ entityType: 'Patient', entityId: 'p-1' }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]!.body).toBe('Test comment');
    expect(result.current.totalCount).toBe(1);
    expect(result.current.hasMore).toBe(false);
  });

  it('should set error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTimeline({ entityType: 'Patient', entityId: 'p-1' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.entries).toHaveLength(0);
  });

  it('should detect hasMore when totalCount > loaded entries', async () => {
    const client = createMockClient();
    const items = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ id: toEntityId<'TimelineStreamEntryResponse'>(`e-${i}`) })
    );
    const page: TimelineEntryPage = { items, totalCount: 50, nextCursor: null };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const { result } = renderHook(
      () => useTimeline({ entityType: 'Patient', entityId: 'p-1', pageSize: 20 }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasMore).toBe(true);
    expect(result.current.entries).toHaveLength(20);
    expect(result.current.totalCount).toBe(50);
  });

  it('should load more entries via loadMore', async () => {
    const client = createMockClient();
    const firstPage: TimelineEntryPage = {
      items: [makeEntry({ id: toEntityId<'TimelineStreamEntryResponse'>('e-1') })],
      totalCount: 2,
      nextCursor: null,
    };
    const secondPage: TimelineEntryPage = {
      items: [makeEntry({ id: toEntityId<'TimelineStreamEntryResponse'>('e-2'), body: 'Second' })],
      totalCount: 2,
      nextCursor: null,
    };
    vi.mocked(client.get)
      .mockResolvedValueOnce(axiosResponse(firstPage))
      .mockResolvedValueOnce(axiosResponse(secondPage));

    const { result } = renderHook(
      () => useTimeline({ entityType: 'Patient', entityId: 'p-1', pageSize: 1 }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);

    result.current.loadMore();

    await waitFor(() => expect(result.current.entries).toHaveLength(2));
    expect(result.current.entries[1]!.body).toBe('Second');
    expect(result.current.hasMore).toBe(false);
  });

  it('should add an optimistic entry at the top', async () => {
    const client = createMockClient();
    const page: TimelineEntryPage = {
      items: [makeEntry({ id: toEntityId<'TimelineStreamEntryResponse'>('e-1') })],
      totalCount: 1,
      nextCursor: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const { result } = renderHook(() => useTimeline({ entityType: 'Patient', entityId: 'p-1' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const optimistic = makeEntry({
      id: toEntityId<'TimelineStreamEntryResponse'>('e-new'),
      body: 'Optimistic',
    });
    result.current.addOptimisticEntry(optimistic);

    await waitFor(() => expect(result.current.entries).toHaveLength(2));
    expect(result.current.entries[0]!.id).toBe('e-new');
    // totalCount reflects server state — optimistic additions don't change it
    expect(result.current.totalCount).toBe(1);
  });

  it('should remove an optimistic entry by id', async () => {
    const client = createMockClient();
    const page: TimelineEntryPage = {
      items: [
        makeEntry({ id: toEntityId<'TimelineStreamEntryResponse'>('e-1') }),
        makeEntry({ id: toEntityId<'TimelineStreamEntryResponse'>('e-2') }),
      ],
      totalCount: 2,
      nextCursor: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const { result } = renderHook(() => useTimeline({ entityType: 'Patient', entityId: 'p-1' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    result.current.removeOptimisticEntry('e-1');

    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(result.current.entries[0]!.id).toBe('e-2');
    // totalCount reflects server state — optimistic removals don't change it
    expect(result.current.totalCount).toBe(2);
  });
});
