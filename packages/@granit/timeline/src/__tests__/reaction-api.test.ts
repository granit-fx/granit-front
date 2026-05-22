import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toggleReaction } from '../api/reaction-api.js';
import { TimelinePermissions } from '../permissions.js';
import { toReactionEmoji, type ReactionToggleResult } from '../types/reaction.js';

import type { TimelineEntryId } from '../types/stream.js';
import type { AxiosInstance } from 'axios';

const BASE_PATH = '/api/v1/timeline';
const ENTRY_ID: TimelineEntryId = toEntityId<'TimelineEntry'>('e-42');

const THUMBS_UP = toReactionEmoji('👍');
const HEART = toReactionEmoji('❤️');
const ROCKET = toReactionEmoji('🚀');
const ZWJ_FAMILY = toReactionEmoji('👨‍👩‍👧');

const SAMPLE_RESULT: ReactionToggleResult = {
  entryId: ENTRY_ID,
  emoji: THUMBS_UP,
  count: 3,
  currentUserHasReacted: true,
};

describe('toggleReaction', () => {
  let client: AxiosInstance;

  beforeEach(() => {
    client = createMockClient();
  });

  it('POSTs to /entries/{entryId}/reactions/{emoji} with percent-encoded UTF-8 emoji', async () => {
    vi.mocked(client.post).mockResolvedValue(axiosResponse(SAMPLE_RESULT));

    const result = await toggleReaction(client, BASE_PATH, ENTRY_ID, THUMBS_UP);

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/timeline/entries/e-42/reactions/%F0%9F%91%8D'
    );
    expect(result).toEqual(SAMPLE_RESULT);
  });

  it('returns the post-toggle aggregate — caller patches its cache from this payload', async () => {
    const heartResult: ReactionToggleResult = {
      entryId: ENTRY_ID,
      emoji: HEART,
      count: 1,
      currentUserHasReacted: true,
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(heartResult));

    const refreshed = await toggleReaction(client, BASE_PATH, ENTRY_ID, HEART);

    expect(refreshed).toEqual(heartResult);
  });

  it('propagates 403 when the caller lacks Timeline.Reactions.React', async () => {
    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(toggleReaction(client, BASE_PATH, ENTRY_ID, ROCKET)).rejects.toThrow(/403/);
  });

  it('round-trips a ZWJ-joined emoji sequence (family) through encodeURIComponent', async () => {
    vi.mocked(client.post).mockResolvedValue(axiosResponse(SAMPLE_RESULT));

    await toggleReaction(client, BASE_PATH, ENTRY_ID, ZWJ_FAMILY);

    const [url] = vi.mocked(client.post).mock.calls[0]!;
    expect(decodeURIComponent(url.split('/').pop()!)).toBe('👨‍👩‍👧');
  });
});

describe('TimelinePermissions', () => {
  it('exposes the React permission key matching the backend wire string', () => {
    expect(TimelinePermissions.Reactions.React).toBe('Timeline.Reactions.React');
  });
});
