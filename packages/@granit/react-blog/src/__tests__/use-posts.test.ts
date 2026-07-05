import { getPost, getPublicPostBySlug, getPublicPosts, listPostsGrid } from '@granit/blog';
import { createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockPublicPostItems, mockPublishedPost } from '@granit/react-blog/testing';

import { usePost, usePostsGrid } from '../hooks/use-posts';
import { usePublicPost, usePublicPosts } from '../hooks/use-public-posts';

import { createWrapper } from './test-utils';

import type { BlogPostListResponse } from '@granit/blog';

vi.mock('@granit/blog', () => ({
  getPublicPosts: vi.fn(),
  getPublicPostBySlug: vi.fn(),
  getPost: vi.fn(),
  listPostsGrid: vi.fn(),
  getPostsGridMeta: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());

describe('usePublicPosts', () => {
  it('fetches the public feed', async () => {
    const client = createMockClient();
    const response: BlogPostListResponse = {
      items: mockPublicPostItems,
      total: 1,
      skip: 0,
      take: 20,
    };
    vi.mocked(getPublicPosts).mockResolvedValue(response);

    const { result } = renderHook(() => usePublicPosts({ culture: 'en' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getPublicPosts).toHaveBeenCalledWith(client, '/api/blog', { culture: 'en' });
    expect(result.current.data).toEqual(response);
  });
});

describe('usePublicPost', () => {
  it('fetches a post by slug', async () => {
    const client = createMockClient();
    vi.mocked(getPublicPostBySlug).mockResolvedValue(mockPublishedPost);

    const { result } = renderHook(() => usePublicPost('hello-world', 'en'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getPublicPostBySlug).toHaveBeenCalledWith(client, '/api/blog', 'hello-world', 'en');
  });

  it('is disabled for an empty slug', () => {
    const client = createMockClient();
    const { result } = renderHook(() => usePublicPost(''), { wrapper: createWrapper(client) });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePostsGrid', () => {
  it('fetches the admin grid with a signal', async () => {
    const client = createMockClient();
    vi.mocked(listPostsGrid).mockResolvedValue({
      items: [],
      totalCount: 0,
      hasMore: false,
      nextCursor: null,
    });

    const { result } = renderHook(() => usePostsGrid({ page: 1, pageSize: 20 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listPostsGrid).toHaveBeenCalledWith(
      client,
      '/api/blog',
      { page: 1, pageSize: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});

describe('usePost', () => {
  it('is disabled for an empty id', () => {
    const client = createMockClient();
    const { result } = renderHook(() => usePost(''), { wrapper: createWrapper(client) });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches a post by id', async () => {
    const client = createMockClient();
    vi.mocked(getPost).mockResolvedValue({
      id: 'post-1',
      siteId: 'site-1',
      slug: 'x',
      authorId: 'a',
      attachments: [],
      concurrencyStamp: 's',
      createdAt: mockPublishedPost.publishedAt!,
    });

    const { result } = renderHook(() => usePost('post-1'), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getPost).toHaveBeenCalledWith(client, '/api/blog', 'post-1');
  });
});
