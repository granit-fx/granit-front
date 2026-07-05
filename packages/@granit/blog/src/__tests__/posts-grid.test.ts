import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getPostsGridMeta, listPostsGrid } from '../api/posts-grid';

import type { BlogPostGridRow } from '../types/index';
import type { PagedResult } from '@granit/query-engine';

const BASE = 'https://blog.example.com/api/blog';

describe('listPostsGrid', () => {
  it('GET /grid with no params', async () => {
    const client = createMockClient();
    const paged: PagedResult<BlogPostGridRow> = {
      items: [],
      totalCount: 0,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(paged));

    const result = await listPostsGrid(client, BASE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/grid`, undefined);
    expect(result).toEqual(paged);
  });

  it('serializes the QueryEngine request into the query string', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
    );

    await listPostsGrid(client, BASE, { page: 1, pageSize: 10 });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/grid?page=1&pageSize=10`, undefined);
  });
});

describe('getPostsGridMeta', () => {
  it('GET /grid/meta', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ columns: [], filters: [], defaultSort: null })
    );

    await getPostsGridMeta(client, BASE);

    expect(client.get).toHaveBeenCalled();
  });
});
