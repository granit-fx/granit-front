import type { BlogLatestPostsItem } from '@granit/blog';

/** Layout of the latest-posts block. */
export type BlogLatestPostsLayout = 'Grid' | 'List';

/**
 * Props of the `blog-latest-posts` Puck block. `heading`, `count` and `layout`
 * are author-configured; `posts` is injected at render time by `resolveData`
 * (from the `blog.latest-posts` data source). `resolveDocumentUrl` optionally
 * turns a cover Document id into a URL (bound by the host renderer).
 */
export interface BlogLatestPostsBlockProps {
  readonly heading?: string;
  readonly count?: number;
  readonly layout?: BlogLatestPostsLayout;
  /** Injected by the data source at render time. */
  readonly posts?: readonly BlogLatestPostsItem[];
  /** Builds the reader href for a post slug. Defaults to `/blog/{slug}`. */
  readonly buildHref?: (slug: string) => string;
  /** Resolves a cover Document id to a URL. When absent, covers are omitted. */
  readonly resolveDocumentUrl?: (documentId: string) => string | undefined;
}
