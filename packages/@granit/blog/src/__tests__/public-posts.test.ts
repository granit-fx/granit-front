import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import { buildBlogFeedUrl, getPublicPostBySlug, getPublicPosts } from '../api/public-posts';

import type { BlogPostListResponse, BlogPostPublishedResponse } from '../types/index';

const BASE = 'https://blog.example.com/api/blog';

const listResponse: BlogPostListResponse = {
  items: [
    {
      id: 'post-1',
      slug: 'hello-world',
      authorId: 'author-1',
      culture: 'en',
      title: 'Hello world',
      summary: 'A first post',
      publishedAt: toISODateString('2026-06-01T10:00:00Z'),
      coverImageDocumentId: 'doc-1',
    },
  ],
  total: 1,
  skip: 0,
  take: 20,
};

describe('getPublicPosts', () => {
  it('GET /public/posts with no params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(listResponse));

    const result = await getPublicPosts(client, BASE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/public/posts`, { params: {} });
    expect(result).toEqual(listResponse);
  });

  it('forwards culture/skip/take/authorId as query params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(listResponse));

    await getPublicPosts(client, BASE, { culture: 'fr', skip: 10, take: 5, authorId: 'author-1' });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/public/posts`, {
      params: { culture: 'fr', skip: 10, take: 5, authorId: 'author-1' },
    });
  });

  it('forwards fetchOptions to the adapter', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(listResponse));

    await getPublicPosts(client, BASE, undefined, { cache: 'force-cache' });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/public/posts`, {
      params: {},
      fetchOptions: { cache: 'force-cache' },
    });
  });
});

describe('getPublicPostBySlug', () => {
  const post: BlogPostPublishedResponse = {
    id: 'post-1',
    slug: 'hello-world',
    authorId: 'author-1',
    culture: 'en',
    title: 'Hello world',
    summary: null,
    contentJson: '{"content":[],"root":{}}',
    publishedAt: toISODateString('2026-06-01T10:00:00Z'),
    coverImageDocumentId: null,
    attachmentDocumentIds: [],
  };

  it('GET /public/posts/{slug} with culture', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(post));

    const result = await getPublicPostBySlug(client, BASE, 'hello-world', 'en');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/public/posts/hello-world`, {
      params: { culture: 'en' },
    });
    expect(result).toEqual(post);
  });

  it('omits the culture param when not provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(post));

    await getPublicPostBySlug(client, BASE, 'hello-world');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/public/posts/hello-world`, {});
  });

  it('returns null on 404', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue({ response: { status: 404 } });

    const result = await getPublicPostBySlug(client, BASE, 'missing');

    expect(result).toBeNull();
  });

  it('rethrows non-404 errors', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue({ response: { status: 500 } });

    await expect(getPublicPostBySlug(client, BASE, 'boom')).rejects.toEqual({
      response: { status: 500 },
    });
  });
});

describe('buildBlogFeedUrl', () => {
  it('appends /feed.rss to the base path', () => {
    expect(buildBlogFeedUrl(BASE)).toBe(`${BASE}/feed.rss`);
  });
});
