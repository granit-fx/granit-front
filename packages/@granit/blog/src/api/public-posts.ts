import type {
  BlogPostListResponse,
  BlogPostPublishedResponse,
  ListPublicPostsParams,
} from '../types/index';
import type { AxiosInstance, RequestFetchOptions } from '@granit/api-client';

/**
 * Lists published posts for the current site (resolved from the request host).
 * `GET {basePath}/public/posts?culture&skip&take&authorId`
 *
 * `culture` is optional (server default when omitted); `take <= 0` selects the
 * server default page size. Anonymous — no auth required.
 *
 * `fetchOptions` is forwarded verbatim to the fetch adapter (SSR caching hints).
 */
export async function getPublicPosts(
  client: AxiosInstance,
  basePath: string,
  params?: ListPublicPostsParams,
  fetchOptions?: RequestFetchOptions
): Promise<BlogPostListResponse> {
  const response = await client.get<BlogPostListResponse>(`${basePath}/public/posts`, {
    params: params ?? {},
    ...(fetchOptions ? { fetchOptions } : {}),
  });
  return response.data;
}

/**
 * Resolves a published post by slug for the current site.
 * `GET {basePath}/public/posts/{slug}?culture`
 *
 * Returns `null` on 404 (unpublished, missing, or absent in the requested culture).
 */
export async function getPublicPostBySlug(
  client: AxiosInstance,
  basePath: string,
  slug: string,
  culture?: string,
  fetchOptions?: RequestFetchOptions
): Promise<BlogPostPublishedResponse | null> {
  try {
    const response = await client.get<BlogPostPublishedResponse>(
      `${basePath}/public/posts/${encodeURIComponent(slug)}`,
      {
        ...(culture ? { params: { culture } } : {}),
        ...(fetchOptions ? { fetchOptions } : {}),
      }
    );
    return response.data;
  } catch (err: unknown) {
    if (isAxios404(err)) return null;
    throw err;
  }
}

/**
 * Builds the absolute-or-relative RSS 2.0 feed URL for the current site.
 * `{basePath}/feed.rss` (`application/rss+xml`). Anonymous.
 */
export function buildBlogFeedUrl(basePath: string): string {
  return `${basePath}/feed.rss`;
}

function isAxios404(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === 404
  );
}
