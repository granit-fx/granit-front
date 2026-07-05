// ---------------------------------------------------------------------------
// @granit/react-blog/testing — mock fixtures
// ---------------------------------------------------------------------------

import { toISODateString } from '@granit/types';

import type {
  BlogAuthorProfileResponse,
  BlogLatestPostsData,
  BlogPostGridRow,
  BlogPostListItem,
  BlogPostPublishedResponse,
  BlogPostResponse,
} from '@granit/blog';

/** Site id shared across the blog fixtures. */
export const BLOG_SITE_ID = 'a0b1c2d3-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

const EMPTY_CONTENT = '{"content":[],"root":{"props":{}}}';

export const mockAuthors: BlogAuthorProfileResponse[] = [
  {
    id: 'author-1',
    siteId: BLOG_SITE_ID,
    userId: '11111111-1111-4111-8111-111111111111',
    displayName: 'Ada Lovelace',
    bio: 'Writes about computing history.',
    avatarDocumentId: 'doc-avatar-1',
    createdAt: toISODateString('2026-01-01T00:00:00Z'),
    modifiedAt: null,
  },
  {
    id: 'author-2',
    siteId: BLOG_SITE_ID,
    userId: '22222222-2222-4222-8222-222222222222',
    displayName: 'Alan Turing',
    bio: null,
    avatarDocumentId: null,
    createdAt: toISODateString('2026-01-02T00:00:00Z'),
    modifiedAt: null,
  },
];

export const mockPosts: BlogPostResponse[] = [
  {
    id: 'post-1',
    siteId: BLOG_SITE_ID,
    slug: 'hello-world',
    authorId: 'author-1',
    coverImageDocumentId: 'doc-cover-1',
    scheduledAtUtc: null,
    attachments: [
      { documentId: 'doc-att-1', caption: 'Figure 1', altText: 'A diagram', sortOrder: 0 },
      { documentId: 'doc-att-2', caption: null, altText: null, sortOrder: 1 },
    ],
    concurrencyStamp: 'stamp-post-1',
    createdAt: toISODateString('2026-06-01T00:00:00Z'),
    modifiedAt: null,
  },
  {
    id: 'post-2',
    siteId: BLOG_SITE_ID,
    slug: 'draft-post',
    authorId: 'author-2',
    coverImageDocumentId: null,
    scheduledAtUtc: null,
    attachments: [],
    concurrencyStamp: 'stamp-post-2',
    createdAt: toISODateString('2026-06-02T00:00:00Z'),
    modifiedAt: null,
  },
];

export const mockPostGridRows: BlogPostGridRow[] = [
  {
    id: 'post-1',
    siteId: BLOG_SITE_ID,
    slug: 'hello-world',
    authorId: 'author-1',
    authorDisplayName: 'Ada Lovelace',
    status: 'Published',
    coverImageDocumentId: 'doc-cover-1',
    publishedAt: toISODateString('2026-06-05T10:00:00Z'),
    scheduledAtUtc: null,
    createdAt: toISODateString('2026-06-01T00:00:00Z'),
    modifiedAt: null,
  },
  {
    id: 'post-2',
    siteId: BLOG_SITE_ID,
    slug: 'draft-post',
    authorId: 'author-2',
    authorDisplayName: 'Alan Turing',
    status: 'Draft',
    coverImageDocumentId: null,
    publishedAt: null,
    scheduledAtUtc: null,
    createdAt: toISODateString('2026-06-02T00:00:00Z'),
    modifiedAt: null,
  },
];

export const mockPublicPostItems: BlogPostListItem[] = [
  {
    id: 'post-1',
    slug: 'hello-world',
    authorId: 'author-1',
    culture: 'en',
    title: 'Hello world',
    summary: 'The very first post.',
    publishedAt: toISODateString('2026-06-05T10:00:00Z'),
    coverImageDocumentId: 'doc-cover-1',
  },
];

export const mockPublishedPost: BlogPostPublishedResponse = {
  id: 'post-1',
  slug: 'hello-world',
  authorId: 'author-1',
  culture: 'en',
  title: 'Hello world',
  summary: 'The very first post.',
  contentJson: EMPTY_CONTENT,
  publishedAt: toISODateString('2026-06-05T10:00:00Z'),
  coverImageDocumentId: 'doc-cover-1',
  attachmentDocumentIds: ['doc-att-1', 'doc-att-2'],
};

export const mockLatestPostsData: BlogLatestPostsData = {
  posts: [
    {
      id: 'post-1',
      slug: 'hello-world',
      title: 'Hello world',
      summary: 'The very first post.',
      publishedAt: toISODateString('2026-06-05T10:00:00Z'),
      coverImageDocumentId: 'doc-cover-1',
    },
  ],
};
