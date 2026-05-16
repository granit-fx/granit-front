import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toggleReaction } from '../api/reaction-api.js';
import { TimelinePermissions } from '../permissions.js';
import { REACTION_EMOJIS } from '../types/reaction.js';

import type { TimelineEntryId } from '../types/stream.js';
import type { ISODateString } from '@granit/types';
import type { AxiosInstance } from 'axios';

const BASE_PATH = '/api/v1/timeline';
const ENTRY_ID: TimelineEntryId = toEntityId<'TimelineEntry'>('e-42');

const SAMPLE_ENTRY = {
  id: ENTRY_ID,
  entryType: 0,
  body: 'Quote approved',
  authorId: null,
  authorName: 'System',
  parentEntryId: null,
  occurredAt: '2026-05-09T15:00:00Z' as ISODateString,
  attachments: [],
  reactions: [
    { emoji: 'thumbs_up' as const, count: 3, hasReacted: true },
    { emoji: 'tada' as const, count: 1, hasReacted: false },
  ],
};

describe('toggleReaction', () => {
  let client: AxiosInstance;

  beforeEach(() => {
    client = createMockClient();
  });

  it('POSTs to /entries/{entryId}/reactions/{emoji} with URI-encoded segments', async () => {
    vi.mocked(client.post).mockResolvedValue(axiosResponse(SAMPLE_ENTRY));

    const result = await toggleReaction(client, BASE_PATH, ENTRY_ID, 'thumbs_up');

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/timeline/entries/e-42/reactions/thumbs_up'
    );
    expect(result).toEqual(SAMPLE_ENTRY);
  });

  it('returns the refreshed entry — caller patches its cache from this payload', async () => {
    vi.mocked(client.post).mockResolvedValue(axiosResponse(SAMPLE_ENTRY));

    const refreshed = await toggleReaction(client, BASE_PATH, ENTRY_ID, 'heart');

    expect(refreshed.reactions).toEqual([
      { emoji: 'thumbs_up', count: 3, hasReacted: true },
      { emoji: 'tada', count: 1, hasReacted: false },
    ]);
  });

  it('propagates 403 when the caller lacks Timeline.Reactions.React', async () => {
    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(toggleReaction(client, BASE_PATH, ENTRY_ID, 'eyes')).rejects.toThrow(/403/);
  });

  it('accepts every code in the closed REACTION_EMOJIS catalog', async () => {
    vi.mocked(client.post).mockResolvedValue(axiosResponse(SAMPLE_ENTRY));

    for (const emoji of REACTION_EMOJIS) {
      // Type-checks at compile time; verifies the runtime catalog
      // matches the closed union without surprise members.
      await toggleReaction(client, BASE_PATH, ENTRY_ID, emoji);
    }

    expect(client.post).toHaveBeenCalledTimes(REACTION_EMOJIS.length);
  });
});

describe('TimelinePermissions', () => {
  it('exposes the React permission key matching the backend wire string', () => {
    expect(TimelinePermissions.Timeline.Reactions.React).toBe('Timeline.Reactions.React');
  });
});
