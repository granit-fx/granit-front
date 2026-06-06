import { axiosResponse, createMockClient } from '@granit/testing';
import { TimelineEntryType, toReactionEmoji } from '@granit/timeline';
import { toEntityId } from '@granit/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toggleReactionMap, useToggleReaction } from '../hooks/use-toggle-reaction';
import { TimelineProvider } from '../providers/timeline-provider';

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

const THUMBS_UP = toReactionEmoji('👍');
const HEART = toReactionEmoji('❤️');
const TADA = toReactionEmoji('🎉');
const EYES = toReactionEmoji('👀');

function makeEntry(id: TimelineEntryId, reactions?: ReactionMap): TimelineEntry {
  return {
    id,
    entryType: TimelineEntryType.Comment,
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
    expect(toggleReactionMap(undefined, THUMBS_UP)).toEqual({
      [THUMBS_UP]: { count: 1, byCurrentUser: true, displayEmoji: THUMBS_UP },
    });
  });

  it('increments count + flips byCurrentUser when caller had not reacted', () => {
    const before: ReactionMap = {
      [HEART]: { count: 5, byCurrentUser: false, displayEmoji: HEART },
    };
    expect(toggleReactionMap(before, HEART)).toEqual({
      [HEART]: { count: 6, byCurrentUser: true, displayEmoji: HEART },
    });
  });

  it('decrements count + flips byCurrentUser when caller had reacted', () => {
    const before: ReactionMap = {
      [TADA]: { count: 3, byCurrentUser: true, displayEmoji: TADA },
    };
    expect(toggleReactionMap(before, TADA)).toEqual({
      [TADA]: { count: 2, byCurrentUser: false, displayEmoji: TADA },
    });
  });

  it('removes only the toggled-off emoji when other emojis remain in the map', () => {
    const before: ReactionMap = {
      [THUMBS_UP]: { count: 1, byCurrentUser: true, displayEmoji: THUMBS_UP },
      [HEART]: { count: 3, byCurrentUser: false, displayEmoji: HEART },
    };
    expect(toggleReactionMap(before, THUMBS_UP)).toEqual({
      [HEART]: { count: 3, byCurrentUser: false, displayEmoji: HEART },
    });
  });

  it('removes the entry entirely when toggling off the last reactor', () => {
    const before: ReactionMap = { [EYES]: { count: 1, byCurrentUser: true, displayEmoji: EYES } };
    expect(toggleReactionMap(before, EYES)).toBeUndefined();
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
      emoji: THUMBS_UP,
    });

    await waitFor(() => {
      const page = queryClient.getQueryData<TimelineEntryPage>(['timeline', 'Quote', 'q-1']);
      expect(page?.items[0]?.reactions).toEqual({
        [THUMBS_UP]: { count: 1, byCurrentUser: true, displayEmoji: THUMBS_UP },
      });
    });
    const page = queryClient.getQueryData<TimelineEntryPage>(['timeline', 'Quote', 'q-1']);
    expect(page?.items[1]?.reactions).toBeUndefined();

    resolveNetwork(makeToggleResult(ENTRY_ID, THUMBS_UP, 7, true));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const finalPage = queryClient.getQueryData<TimelineEntryPage>(['timeline', 'Quote', 'q-1']);
    expect(finalPage?.items[0]?.reactions).toEqual({
      [THUMBS_UP]: { count: 7, byCurrentUser: true, displayEmoji: THUMBS_UP },
    });
  });

  it('rolls back to the snapshot when the mutation rejects', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const initial = makePage([
      makeEntry(ENTRY_ID, { [HEART]: { count: 5, byCurrentUser: false, displayEmoji: HEART } }),
    ]);
    queryClient.setQueryData(['timeline', 'Quote', 'q-1'], initial);

    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 403'));

    const { result } = renderHook(() => useToggleReaction(), { wrapper });
    result.current.mutate({
      entityType: 'Quote',
      entityId: 'q-1',
      entryId: ENTRY_ID,
      emoji: HEART,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const page = queryClient.getQueryData<TimelineEntryPage>(['timeline', 'Quote', 'q-1']);
    expect(page?.items[0]?.reactions).toEqual({
      [HEART]: { count: 5, byCurrentUser: false, displayEmoji: HEART },
    });
  });
});

describe('useToggleReaction — bare TimelineEntry in cache', () => {
  afterEach(() => vi.restoreAllMocks());

  it('patches a bare TimelineEntry (not wrapped in a page) when its id matches', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const bareEntry = makeEntry(ENTRY_ID);
    queryClient.setQueryData(['timeline', 'Quote', 'q-1'], bareEntry);

    vi.mocked(client.post).mockResolvedValue(
      axiosResponse(makeToggleResult(ENTRY_ID, THUMBS_UP, 7, true))
    );

    const { result } = renderHook(() => useToggleReaction(), { wrapper });
    result.current.mutate({
      entityType: 'Quote',
      entityId: 'q-1',
      entryId: ENTRY_ID,
      emoji: THUMBS_UP,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const entry = queryClient.getQueryData<TimelineEntry>(['timeline', 'Quote', 'q-1']);
    expect(entry?.reactions?.[THUMBS_UP]).toBeDefined();
  });

  it('leaves a bare TimelineEntry unchanged when its id does not match', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const otherEntry = makeEntry(OTHER_ENTRY_ID);
    queryClient.setQueryData(['timeline', 'Quote', 'q-1'], otherEntry);

    vi.mocked(client.post).mockResolvedValue(
      axiosResponse(makeToggleResult(ENTRY_ID, HEART, 1, true))
    );

    const { result } = renderHook(() => useToggleReaction(), { wrapper });
    result.current.mutate({
      entityType: 'Quote',
      entityId: 'q-1',
      entryId: ENTRY_ID,
      emoji: HEART,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const entry = queryClient.getQueryData<TimelineEntry>(['timeline', 'Quote', 'q-1']);
    expect(entry?.reactions).toBeUndefined();
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
      axiosResponse(makeToggleResult(ENTRY_ID, EYES, 1, true))
    );

    const { result } = renderHook(() => useToggleReaction(), { wrapper });
    result.current.mutate({
      entityType: 'Quote',
      entityId: 'q-1',
      entryId: ENTRY_ID,
      emoji: EYES,
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
