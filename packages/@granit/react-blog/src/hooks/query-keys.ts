import type { ListBlogPostsParams, ListPublicPostsParams } from '@granit/blog';

/**
 * Query-key factory for the Blog module. Every builder takes the provider's
 * `queryKeyPrefix` (default `['blog']`) so caches are namespaced per provider
 * instance. Keys are `as const` tuples for precise invalidation.
 */
export const blogKeys = {
  publicPosts: {
    all: (prefix: readonly string[]) => [...prefix, 'public', 'posts'] as const,
    list: (prefix: readonly string[], params?: ListPublicPostsParams) =>
      [...prefix, 'public', 'posts', 'list', params ?? {}] as const,
    detail: (prefix: readonly string[], slug: string, culture?: string) =>
      [...prefix, 'public', 'posts', slug, culture ?? ''] as const,
  },
  posts: {
    all: (prefix: readonly string[]) => [...prefix, 'posts'] as const,
    list: (prefix: readonly string[], params?: ListBlogPostsParams) =>
      [...prefix, 'posts', 'list', params ?? {}] as const,
    queryMeta: (prefix: readonly string[]) => [...prefix, 'posts', 'list', 'meta'] as const,
    detail: (prefix: readonly string[], id: string) => [...prefix, 'posts', id] as const,
  },
  authors: {
    all: (prefix: readonly string[]) => [...prefix, 'authors'] as const,
    list: (prefix: readonly string[], siteId: string) =>
      [...prefix, 'authors', 'list', siteId] as const,
    detail: (prefix: readonly string[], id: string) => [...prefix, 'authors', id] as const,
  },
} as const;
