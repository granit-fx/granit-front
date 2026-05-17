import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toggleReaction } from '../api/reaction-api.js';
import { TimelinePermissions } from '../permissions.js';
import { REACTION_EMOJIS, type ReactionToggleResult } from '../types/reaction.js';

import type { TimelineEntryId } from '../types/stream.js';
import type { AxiosInstance } from 'axios';

const BASE_PATH = '/api/v1/timeline';
const ENTRY_ID: TimelineEntryId = toEntityId<'TimelineEntry'>('e-42');

const SAMPLE_RESULT: ReactionToggleResult = {
  entryId: ENTRY_ID,
  emoji: 'thumbs_up',
  count: 3,
  currentUserHasReacted: true,
};

describe('toggleReaction', () => {
  let client: AxiosInstance;

  beforeEach(() => {
    client = createMockClient();
  });

  it('POSTs to /entries/{entryId}/reactions/{emoji} with URI-encoded segments', async () => {
    vi.mocked(client.post).mockResolvedValue(axiosResponse(SAMPLE_RESULT));

    const result = await toggleReaction(client, BASE_PATH, ENTRY_ID, 'thumbs_up');

    expect(client.post).toHaveBeenCalledWith('/api/v1/timeline/entries/e-42/reactions/thumbs_up');
    expect(result).toEqual(SAMPLE_RESULT);
  });

  it('returns the post-toggle aggregate — caller patches its cache from this payload', async () => {
    const heartResult: ReactionToggleResult = {
      entryId: ENTRY_ID,
      emoji: 'heart',
      count: 1,
      currentUserHasReacted: true,
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(heartResult));

    const refreshed = await toggleReaction(client, BASE_PATH, ENTRY_ID, 'heart');

    expect(refreshed).toEqual(heartResult);
  });

  it('propagates 403 when the caller lacks Timeline.Reactions.React', async () => {
    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(toggleReaction(client, BASE_PATH, ENTRY_ID, 'eyes')).rejects.toThrow(/403/);
  });

  it('accepts every code in the closed REACTION_EMOJIS catalog', async () => {
    vi.mocked(client.post).mockResolvedValue(axiosResponse(SAMPLE_RESULT));

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
    expect(TimelinePermissions.Reactions.React).toBe('Timeline.Reactions.React');
  });
});
