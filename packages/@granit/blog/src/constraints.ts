// INTERIM — hand-authored from the Blog DTO field shapes.
//
// Every other core package derives `*Constraints` from `contracts/openapi/*.json`
// via scripts/generate-front-constraints.mjs (single source of truth). The Blog
// backend has not published `contracts/openapi/blog.json` yet, so these values are
// hand-mirrored from the DTOs. Once the spec lands:
//   1. drop `blog.json` into contracts/openapi/,
//   2. add a TARGETS entry `{ spec: 'blog.json', pkg: 'blog',
//      exportName: 'blogConstraints', schemaPattern: /Request$/ }`,
//   3. delete this file — pre-commit regenerates it with the do-not-edit banner.
// Consumed via createConstraintsResolver from @granit/react-validation.

import type { SchemaConstraints } from '@granit/validation';

export const blogConstraints = {
  BlogPostCreateRequest: {
    slug: { required: true, maxLength: 200, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
    authorId: { required: true, format: 'uuid' },
    coverImageDocumentId: { format: 'uuid' },
  },
  BlogPostUpdateRequest: {
    slug: { required: true, maxLength: 200, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
    authorId: { required: true, format: 'uuid' },
    coverImageDocumentId: { format: 'uuid' },
    concurrencyStamp: { required: true },
  },
  BlogPostDraftContentRequest: {
    culture: { required: true, maxLength: 35 },
    contentJson: { required: true },
    title: { required: true, maxLength: 200 },
    summary: { maxLength: 500 },
    concurrencyStamp: {},
  },
  BlogPostAddAttachmentRequest: {
    documentId: { required: true, format: 'uuid' },
    caption: { maxLength: 300 },
    altText: { maxLength: 300 },
  },
  BlogPostUpdateAttachmentRequest: {
    caption: { maxLength: 300 },
    altText: { maxLength: 300 },
  },
  BlogPostScheduleRequest: {
    localDateTime: { required: true },
    timeZoneId: { required: true, maxLength: 100 },
  },
  BlogAuthorProfileCreateRequest: {
    userId: { required: true, format: 'uuid' },
    displayName: { required: true, maxLength: 200 },
    bio: { maxLength: 2000 },
    avatarDocumentId: { format: 'uuid' },
  },
  BlogAuthorProfileUpdateRequest: {
    displayName: { required: true, maxLength: 200 },
    bio: { maxLength: 2000 },
    avatarDocumentId: { format: 'uuid' },
  },
} satisfies Record<string, SchemaConstraints>;
