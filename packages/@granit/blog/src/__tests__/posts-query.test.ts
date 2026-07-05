import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getPostsQueryMeta, listPosts } from '../api/posts-query';

import type { BlogPostListItemResponse } from '../types/index';
import type { PagedResult } from '@granit/query-engine';

const BASE = 'https://blog.example.com/api/blog';

describe('listPosts', () => {
  it('GET /posts with no params', async () => {
    const client = createMockClient();
    const paged: PagedResult<BlogPostListItemResponse> = {
      items: [],
      totalCount: 0,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(paged));

    const result = await listPosts(client, BASE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/posts`, undefined);
    expect(result).toEqual(paged);
  });

  it('serializes the QueryEngine request into the query string', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
    );

    await listPosts(client, BASE, { page: 1, pageSize: 10 });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/posts?page=1&pageSize=10`, undefined);
  });
});

describe('getPostsQueryMeta', () => {
  it('GET /posts/meta', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ columns: [], filters: [], defaultSort: null })
    );

    await getPostsQueryMeta(client, BASE);

    expect(client.get).toHaveBeenCalled();
  });
});
