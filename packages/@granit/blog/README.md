# @granit/blog

Framework-agnostic types and Axios API client for the Granit **Blog** module
(`Granit.Blog.*`, exposed under `/api/blog`). The JS/TS counterpart of the
backend contracts: published-post feed, admin post lifecycle, media gallery, and
author profiles.

Source-direct package — no build step. Consumed through the workspace via Vite
aliases; the React layer lives in [`@granit/react-blog`](../react-blog) and the
admin UI in [`@granit/react-ui-blog`](../react-ui-blog).

## Usage

Every API function is a free function taking the shared Axios client and base
path — the client (with CSRF / auth / tenant interceptors) is injected by the
caller, never instantiated here.

```ts
import { getPublicPosts, publishPost } from '@granit/blog';
import { createApiClient } from '@granit/api-client';

const client = createApiClient(/* … */);

const page = await getPublicPosts(client, '/api/blog', { culture: 'en', take: 10 });
await publishPost(client, '/api/blog', postId);
```

## Surface

| Area          | Functions                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------- |
| Public        | `getPublicPosts`, `getPublicPostBySlug`, `buildBlogFeedUrl`                                   |
| Posts (admin) | `createPost`, `getPost`, `updatePost`, `deletePost`, `saveDraftContent`                       |
| Gallery       | `addPostAttachment`, `updatePostAttachment`, `removePostAttachment`, `reorderPostAttachments` |
| List          | `listPosts`, `getPostsQueryMeta`                                                              |
| Lifecycle     | `publishPost`, `unpublishPost`, `schedulePost`, `cancelPostSchedule`                          |
| Authors       | `listAuthors`, `getAuthor`, `createAuthor`, `updateAuthor`, `deleteAuthor`                    |

`BlogPermissions` and `blogConstraints` are also exported.

## Conventions

- `contentJson` is the opaque Puck block-tree — rendered with the shared CMS
  block catalog (see `@granit/react-blog`), never parsed here.
- Timestamps are branded `ISODateString` (UTC). `BlogPostScheduleRequest.localDateTime`
  is deliberately **not** branded — it is civil (wall-clock) time resolved against
  `timeZoneId` (IANA) server-side.
- Optionality follows the OpenAPI `required` array, not nullability.

## Validation constraints (interim)

`src/constraints.ts` is hand-authored from the DTO field shapes because the Blog
backend has not yet published `contracts/openapi/blog.json`. Once it does, add a
`TARGETS` entry to `scripts/generate-front-constraints.mjs` and delete the file —
pre-commit regenerates it from the spec (the single source of truth).
