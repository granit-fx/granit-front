import { resolveBlockData } from '@granit/cms';
import { createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BLOG_SITE_ID, mockLatestPostsData } from '@granit/react-blog/testing';

import { useBlogLatestPosts } from '../hooks/use-latest-posts';

import { createWrapper } from './test-utils';

vi.mock('@granit/cms', () => ({
  resolveBlockData: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());

describe('useBlogLatestPosts', () => {
  it('resolves the blog.latest-posts data source via the CMS block-data endpoint', async () => {
    const client = createMockClient();
    vi.mocked(resolveBlockData).mockResolvedValue({
      data: mockLatestPostsData,
      consumedContentKeys: [],
    });

    const { result } = renderHook(
      () => useBlogLatestPosts({ siteId: BLOG_SITE_ID, culture: 'en' }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(resolveBlockData).toHaveBeenCalledWith(client, '/api/cms', {
      dataSourceKey: 'blog.latest-posts',
      query: null,
      siteId: BLOG_SITE_ID,
      culture: 'en',
    });
    expect(result.current.data).toEqual(mockLatestPostsData);
  });

  it('is disabled without a site or culture', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useBlogLatestPosts({ siteId: '', culture: '' }), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
