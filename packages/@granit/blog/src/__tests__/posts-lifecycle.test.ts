import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  cancelPostSchedule,
  publishPost,
  schedulePost,
  unpublishPost,
} from '../api/posts-lifecycle';

const BASE = 'https://blog.example.com/api/blog';
const publication = { postId: 'post-1', siteId: 'site-1' };

describe('publishPost', () => {
  it('POST /posts/{id}/publish', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(publication));

    const result = await publishPost(client, BASE, 'post-1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/posts/post-1/publish`);
    expect(result).toEqual(publication);
  });
});

describe('unpublishPost', () => {
  it('POST /posts/{id}/unpublish', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(publication));

    await unpublishPost(client, BASE, 'post-1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/posts/post-1/unpublish`);
  });
});

describe('schedulePost', () => {
  it('POST /posts/{id}/schedule with wall-clock + IANA zone', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ status: 204, data: undefined });

    const request = { localDateTime: '2026-08-01T09:00:00', timeZoneId: 'Europe/Brussels' };
    await schedulePost(client, BASE, 'post-1', request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/posts/post-1/schedule`, request);
  });
});

describe('cancelPostSchedule', () => {
  it('DELETE /posts/{id}/schedule', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await cancelPostSchedule(client, BASE, 'post-1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/posts/post-1/schedule`);
  });
});
