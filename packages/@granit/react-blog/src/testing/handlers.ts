// ---------------------------------------------------------------------------
// @granit/react-blog/testing — MSW handler factories
//
// Each factory takes the collection base URL and returns in-memory handlers
// seeded from the fixtures. Consumers wire the base to their API origin, e.g.
// `createBlogAdminHandlers(`${apiUrl}/api/blog`)`.
// ---------------------------------------------------------------------------

import { toISODateString } from '@granit/types';
import { http, HttpResponse, type RequestHandler } from 'msw';

import {
  BLOG_SITE_ID,
  mockAuthors,
  mockLatestPostsData,
  mockPostListItems,
  mockPosts,
  mockPublicPostItems,
  mockPublishedPost,
} from './data';

import type {
  BlogAuthorProfileCreateRequest,
  BlogAuthorProfileResponse,
  BlogAuthorProfileUpdateRequest,
  BlogPostAttachmentAddRequest,
  BlogPostCreateRequest,
  BlogPostAttachmentReorderRequest,
  BlogPostResponse,
  BlogPostUpdateRequest,
} from '@granit/blog';
import type { PagedResult } from '@granit/query-engine';

const notFound = () => new HttpResponse(null, { status: 404 });
const noContent = () => new HttpResponse(null, { status: 204 });

function paged<T>(items: readonly T[], page: number, pageSize: number): PagedResult<T> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalCount: items.length,
    hasMore: start + pageSize < items.length,
    nextCursor: null,
  };
}

/** Anonymous public feed handlers (`/api/blog/public/...`, `/api/blog/feed.rss`). */
export function createBlogPublicHandlers(baseUrl = '/api/blog'): RequestHandler[] {
  return [
    http.get(`${baseUrl}/public/posts`, ({ request }) => {
      const url = new URL(request.url);
      const skip = Number(url.searchParams.get('skip') ?? '0');
      const take = Number(url.searchParams.get('take') ?? '20');
      const effectiveTake = take > 0 ? take : 20;
      const items = mockPublicPostItems.slice(skip, skip + effectiveTake);
      return HttpResponse.json({
        items,
        total: mockPublicPostItems.length,
        skip,
        take: effectiveTake,
      });
    }),

    http.get(`${baseUrl}/public/posts/:slug`, ({ params }) =>
      params.slug === mockPublishedPost.slug ? HttpResponse.json(mockPublishedPost) : notFound()
    ),

    http.get(`${baseUrl}/feed.rss`, () =>
      HttpResponse.xml(
        '<?xml version="1.0"?><rss version="2.0"><channel><title>Blog</title></channel></rss>'
      )
    ),
  ];
}

/** Admin posts handlers (`/api/blog`) — list, CRUD, draft, gallery, lifecycle. */
export function createBlogAdminHandlers(baseUrl = '/api/blog'): RequestHandler[] {
  const posts: BlogPostResponse[] = mockPosts.map((post) => ({
    ...post,
    attachments: post.attachments.map((att) => ({ ...att })),
  }));

  const find = (id: string | readonly string[] | undefined) => posts.find((post) => post.id === id);

  return [
    http.get(`${baseUrl}/posts`, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? '1');
      const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
      return HttpResponse.json(paged(mockPostListItems, page, pageSize));
    }),

    http.post(`${baseUrl}/sites/:siteId/posts`, async ({ params, request }) => {
      const dto = (await request.json()) as BlogPostCreateRequest;
      const created: BlogPostResponse = {
        id: crypto.randomUUID(),
        siteId: String(params.siteId),
        slug: dto.slug,
        authorId: dto.authorId,
        coverImageDocumentId: dto.coverImageDocumentId ?? null,
        scheduledAtUtc: null,
        attachments: [],
        concurrencyStamp: crypto.randomUUID(),
        createdAt: toISODateString('2026-06-01T00:00:00Z'),
        modifiedAt: null,
      };
      posts.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.get(`${baseUrl}/posts/:id`, ({ params }) => {
      const post = find(params.id);
      return post ? HttpResponse.json(post) : notFound();
    }),

    http.put(`${baseUrl}/posts/:id`, async ({ params, request }) => {
      const existing = find(params.id);
      if (!existing) return notFound();
      const dto = (await request.json()) as BlogPostUpdateRequest;
      const updated: BlogPostResponse = {
        ...existing,
        slug: dto.slug,
        authorId: dto.authorId,
        coverImageDocumentId: dto.coverImageDocumentId ?? null,
        concurrencyStamp: crypto.randomUUID(),
      };
      posts[posts.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.delete(`${baseUrl}/posts/:id`, ({ params }) => {
      const existing = find(params.id);
      if (!existing) return notFound();
      posts.splice(posts.indexOf(existing), 1);
      return noContent();
    }),

    http.put(`${baseUrl}/posts/:id/content`, ({ params }) => {
      const existing = find(params.id);
      if (!existing) return notFound();
      return HttpResponse.json({ versionId: crypto.randomUUID() });
    }),

    http.post(`${baseUrl}/posts/:id/attachments`, async ({ params, request }) => {
      const existing = find(params.id);
      if (!existing) return notFound();
      const dto = (await request.json()) as BlogPostAttachmentAddRequest;
      const updated: BlogPostResponse = {
        ...existing,
        attachments: [
          ...existing.attachments,
          {
            documentId: dto.documentId,
            caption: dto.caption ?? null,
            altText: dto.altText ?? null,
            sortOrder: existing.attachments.length,
          },
        ],
      };
      posts[posts.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.delete(`${baseUrl}/posts/:id/attachments/:documentId`, ({ params }) => {
      const existing = find(params.id);
      if (!existing) return notFound();
      const updated: BlogPostResponse = {
        ...existing,
        attachments: existing.attachments.filter((att) => att.documentId !== params.documentId),
      };
      posts[posts.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.put(`${baseUrl}/posts/:id/attachments/order`, async ({ params, request }) => {
      const existing = find(params.id);
      if (!existing) return notFound();
      const dto = (await request.json()) as BlogPostAttachmentReorderRequest;
      const reordered = dto.documentIdsInOrder
        .map((documentId, index) => {
          const att = existing.attachments.find((a) => a.documentId === documentId);
          return att ? { ...att, sortOrder: index } : null;
        })
        .filter((att): att is NonNullable<typeof att> => att !== null);
      const updated: BlogPostResponse = { ...existing, attachments: reordered };
      posts[posts.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.post(`${baseUrl}/posts/:id/publish`, ({ params }) => {
      const existing = find(params.id);
      if (!existing) return notFound();
      return HttpResponse.json({ postId: existing.id, siteId: existing.siteId });
    }),

    http.post(`${baseUrl}/posts/:id/unpublish`, ({ params }) => {
      const existing = find(params.id);
      if (!existing) return notFound();
      return HttpResponse.json({ postId: existing.id, siteId: existing.siteId });
    }),

    http.post(`${baseUrl}/posts/:id/schedule`, ({ params }) =>
      find(params.id) ? noContent() : notFound()
    ),

    http.delete(`${baseUrl}/posts/:id/schedule`, ({ params }) =>
      find(params.id) ? noContent() : notFound()
    ),
  ];
}

/** Author-profile handlers (`/api/blog`). */
export function createBlogAuthorsHandlers(baseUrl = '/api/blog'): RequestHandler[] {
  const authors: BlogAuthorProfileResponse[] = mockAuthors.map((author) => ({ ...author }));

  return [
    http.get(`${baseUrl}/sites/:siteId/authors`, ({ params }) =>
      HttpResponse.json(authors.filter((author) => author.siteId === params.siteId))
    ),

    http.post(`${baseUrl}/sites/:siteId/authors`, async ({ params, request }) => {
      const dto = (await request.json()) as BlogAuthorProfileCreateRequest;
      const created: BlogAuthorProfileResponse = {
        id: crypto.randomUUID(),
        siteId: String(params.siteId),
        userId: dto.userId,
        displayName: dto.displayName,
        bio: dto.bio ?? null,
        avatarDocumentId: dto.avatarDocumentId ?? null,
        createdAt: toISODateString('2026-06-01T00:00:00Z'),
        modifiedAt: null,
      };
      authors.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.get(`${baseUrl}/authors/:id`, ({ params }) => {
      const author = authors.find((candidate) => candidate.id === params.id);
      return author ? HttpResponse.json(author) : notFound();
    }),

    http.put(`${baseUrl}/authors/:id`, async ({ params, request }) => {
      const existing = authors.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      const dto = (await request.json()) as BlogAuthorProfileUpdateRequest;
      const updated: BlogAuthorProfileResponse = {
        ...existing,
        displayName: dto.displayName,
        bio: dto.bio ?? null,
        avatarDocumentId: dto.avatarDocumentId ?? null,
      };
      authors[authors.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.delete(`${baseUrl}/authors/:id`, ({ params }) => {
      const existing = authors.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      authors.splice(authors.indexOf(existing), 1);
      return noContent();
    }),
  ];
}

/**
 * Block-data handler for the blog-latest-posts data source. Wire to the CMS
 * block-data endpoint (`POST {cmsBaseUrl}/blocks/data`).
 */
export function createBlogBlockDataHandlers(cmsBaseUrl = '/api/cms'): RequestHandler[] {
  return [
    http.post(`${cmsBaseUrl}/blocks/data`, async ({ request }) => {
      const dto = (await request.json()) as { dataSourceKey?: string };
      if (dto.dataSourceKey === 'blog.latest-posts') {
        return HttpResponse.json({ data: mockLatestPostsData, consumedContentKeys: [] });
      }
      return HttpResponse.json({ data: {}, consumedContentKeys: [] });
    }),
  ];
}

export { BLOG_SITE_ID };
