import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toggleReactionMap, useToggleReaction } from '../hooks/use-toggle-reaction.js';
import { TimelineProvider } from '../providers/timeline-provider.js';

import type {
  ReactionMap,
  ReactionToggleResult,
  TimelineEntry,
  TimelineEntryId,
  TimelineEntryPage,
} from '@granit/timeline';
import type { ISODateString } from '@granit/types';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const ENTRY_ID = toEntityId<'TimelineEntry'>('e-1') as TimelineEntryId;
const OTHER_ENTRY_ID = toEntityId<'TimelineEntry'>('e-99') as TimelineEntryId;

function makeEntry(id: TimelineEntryId, reactions?: ReactionMap): TimelineEntry {
  return {
    id,
    entryType: 0,
    body: `entry ${id}`,
    authorId: null,
    authorName: null,
    parentEntryId: null,
    occurredAt: '2026-05-09T15:00:00Z' as ISODateString,
    attachments: [],
    reactions,
  };
}

function makePage(items: readonly TimelineEntry[]): TimelineEntryPage {
  return { items, totalCount: items.length, nextCursor: null };
}

function makeToggleResult(
  entryId: string,
  emoji: ReactionToggleResult['emoji'],
  count: number,
  byCurrentUser: boolean
): ReactionToggleResult {
  return { entryId, emoji, count, currentUserHasReacted: byCurrentUser };
}

interface Harness {
  readonly client: AxiosInstance;
  readonly queryClient: QueryClient;
  readonly wrapper: (props: { children: ReactNode }) => React.ReactElement;
}

function createHarness(): Harness {
  const client = createMockClient();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <TimelineProvider config={{ client }}>{children}</TimelineProvider>
    );
  return { client, queryClient, wrapper };
}

describe('toggleReactionMap', () => {
  it('adds a fresh reaction with count=1, byCurrentUser=true', () => {
    expect(toggleReactionMap(undefined, 'thumbs_up')).toEqual({
      thumbs_up: { count: 1, byCurrentUser: true },
    });
  });

  it('increments count + flips byCurrentUser when caller had not reacted', () => {
    const before: ReactionMap = { heart: { count: 5, byCurrentUser: false } };
    expect(toggleReactionMap(before, 'heart')).toEqual({
      heart: { count: 6, byCurrentUser: true },
    });
  });

  it('decrements count + flips byCurrentUser when caller had reacted', () => {
    const before: ReactionMap = { tada: { count: 3, byCurrentUser: true } };
    expect(toggleReactionMap(before, 'tada')).toEqual({
      tada: { count: 2, byCurrentUser: false },
    });
  });

  it('removes the entry entirely when toggling off the last reactor', () => {
    const before: ReactionMap = { eyes: { count: 1, byCurrentUser: true } };
    expect(toggleReactionMap(before, 'eyes')).toBeUndefined();
  });
});

describe('useToggleReaction — optimistic update', () => {
  afterEach(() => vi.restoreAllMocks());

  it('patches every cached page in the surrounding stream before the network resolves', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const initial = makePage([makeEntry(ENTRY_ID), makeEntry(OTHER_ENTRY_ID)]);
    queryClient.setQueryData(['timeline', 'Quote', 'q-1'], initial);

    let resolveNetwork: (value: ReactionToggleResult) => void = () => {};
    const networkPromise = new Promise<ReactionToggleResult>((resolve) => {
      resolveNetwork = resolve;
    });
    vi.mocked(client.post).mockImplementation(
      async () => axiosResponse(await networkPromise) as Awaited<ReturnType<typeof client.post>>
    );

    const { result } = renderHook(() => useToggleReaction(), { wrapper });

    result.current.mutate({
      entityType: 'Quote',
      entityId: 'q-1',
      entryId: ENTRY_ID,
      emoji: 'thumbs_up',
    });

    await waitFor(() => {
      const page = queryClient.getQueryData<TimelineEntryPage>(['timeline', 'Quote', 'q-1']);
      expect(page?.items[0]?.reactions).toEqual({
        thumbs_up: { count: 1, byCurrentUser: true },
      });
    });
    const page = queryClient.getQueryData<TimelineEntryPage>(['timeline', 'Quote', 'q-1']);
    expect(page?.items[1]?.reactions).toBeUndefined();

    resolveNetwork(makeToggleResult(ENTRY_ID, 'thumbs_up', 7, true));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const finalPage = queryClient.getQueryData<TimelineEntryPage>(['timeline', 'Quote', 'q-1']);
    expect(finalPage?.items[0]?.reactions).toEqual({
      thumbs_up: { count: 7, byCurrentUser: true },
    });
  });

  it('rolls back to the snapshot when the mutation rejects', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const initial = makePage([
      makeEntry(ENTRY_ID, { heart: { count: 5, byCurrentUser: false } }),
    ]);
    queryClient.setQueryData(['timeline', 'Quote', 'q-1'], initial);

    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 403'));

    const { result } = renderHook(() => useToggleReaction(), { wrapper });
    result.current.mutate({
      entityType: 'Quote',
      entityId: 'q-1',
      entryId: ENTRY_ID,
      emoji: 'heart',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const page = queryClient.getQueryData<TimelineEntryPage>(['timeline', 'Quote', 'q-1']);
    expect(page?.items[0]?.reactions).toEqual({ heart: { count: 5, byCurrentUser: false } });
  });
});

describe('useToggleReaction — scoped invalidation', () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not touch unrelated streams' caches", async () => {
    const { client, queryClient, wrapper } = createHarness();

    queryClient.setQueryData(['timeline', 'Quote', 'q-1'], makePage([makeEntry(ENTRY_ID)]));
    queryClient.setQueryData(
      ['timeline', 'Quote', 'q-2'],
      makePage([makeEntry(toEntityId<'TimelineEntry'>('e-other-1') as TimelineEntryId)])
    );
    queryClient.setQueryData(
      ['timeline', 'Party', 'p-7'],
      makePage([makeEntry(toEntityId<'TimelineEntry'>('e-other-2') as TimelineEntryId)])
    );
    queryClient.setQueryData(['unrelated'], 'keep-me');

    vi.mocked(client.post).mockResolvedValue(
      axiosResponse(makeToggleResult(ENTRY_ID, 'eyes', 1, true))
    );

    const { result } = renderHook(() => useToggleReaction(), { wrapper });
    result.current.mutate({
      entityType: 'Quote',
      entityId: 'q-1',
      entryId: ENTRY_ID,
      emoji: 'eyes',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const sibling1 = queryClient.getQueryCache().find({
      queryKey: ['timeline', 'Quote', 'q-2'],
    });
    expect(sibling1?.state.isInvalidated).toBe(false);
    const sibling2 = queryClient.getQueryCache().find({
      queryKey: ['timeline', 'Party', 'p-7'],
    });
    expect(sibling2?.state.isInvalidated).toBe(false);
    expect(queryClient.getQueryData(['unrelated'])).toBe('keep-me');
  });
});
