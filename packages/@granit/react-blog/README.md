# @granit/react-blog

React Query hooks, the `blog-latest-posts` Puck block, public-rendering
components and MSW test fixtures for the Granit **Blog** module. The React layer
over [`@granit/blog`](../blog); admin authoring UI lives in
[`@granit/react-ui-blog`](../react-ui-blog).

Source-direct. Wrap your app in `BlogProvider` (and a `DocumentsProvider` for
media resolution); hooks resolve the Axios client, base path and query-key prefix
from it.

```tsx
import { BlogProvider, usePublicPosts } from '@granit/react-blog';

<BlogProvider config={{ client }}>
  <Archive />
</BlogProvider>;

function Archive() {
  const { data } = usePublicPosts({ culture: 'en', take: 10 });
  return <BlogPostList posts={data?.items ?? []} />;
}
```

## What's inside

- **Hooks** — public (`usePublicPosts`, `usePublicPost`, `useBlogLatestPosts`),
  admin posts (`usePosts`, `usePost`, create/update/delete/draft/gallery
  mutations), lifecycle (`usePublishPost`, `useSchedulePost`, …), authors, and
  media (`useResolvedDocuments`). Query keys via the `blogKeys` factory.
- **`blog-latest-posts` block** — presentational `BlogLatestPostsBlock` +
  `registerBlogBlocks(config)`, which augments a Puck config built by
  `@granit/react-cms`'s `catalogToConfig` and wires the `blog.latest-posts` data
  source through Puck's `resolveData`. No second renderer.
- **Rendering components** — `BlogPostBody` (Puck `<Render>` of `contentJson`),
  `BlogPostCard`, `BlogPostList`, `BlogPostCover`, `BlogPostGallery`,
  `BlogAuthorByline`, and `BlogPostSeoHead` (emits `<head>` + JSON-LD from the
  resolved SEO). Document ids are resolved to URLs via `useResolvedDocuments`.
- **`extractBlogConflict` / `isBlogConcurrencyConflict`** — parse RFC 7807 `409`
  bodies to drive reload prompts on stale `concurrencyStamp`.
- **`./testing`** — MSW handler factories (`createBlogPublicHandlers`,
  `createBlogAdminHandlers`, `createBlogAuthorsHandlers`,
  `createBlogBlockDataHandlers`) and fixtures.
- **`./server`** — RSC-safe subset (pure config composition, SEO head,
  presentational components).

## Media & culture

Blog responses carry Document **ids** (`coverImageDocumentId`,
`attachmentDocumentIds`, author `avatarDocumentId`), not URLs — resolve them with
`useResolvedDocuments(ids, 'Web' | 'Thumbnail')` (`@granit/documents`). `culture`
is threaded explicitly into every hook; read the current one from
`useLocale()` (`@granit/react-localization`).
