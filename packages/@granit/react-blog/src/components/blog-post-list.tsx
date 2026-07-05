import { BlogPostCard } from './blog-post-card';

import type { BlogPostListItem } from '@granit/blog';

export interface BlogPostListProps {
  readonly posts: readonly BlogPostListItem[];
  /** Builds the reader href for a post slug. Defaults to `/blog/{slug}`. */
  readonly buildHref?: (slug: string) => string;
  /** Resolved cover URLs keyed by `coverImageDocumentId`. Optional. */
  readonly coverUrls?: ReadonlyMap<string, string>;
  /** Author display names keyed by `authorId`. Optional. */
  readonly authorNames?: ReadonlyMap<string, string>;
  readonly emptyLabel?: string;
}

function defaultHref(slug: string): string {
  return `/blog/${slug}`;
}

/** A post archive/list — a responsive collection of {@link BlogPostCard}. */
export function BlogPostList({
  posts,
  buildHref = defaultHref,
  coverUrls,
  authorNames,
  emptyLabel = 'No posts yet.',
}: BlogPostListProps) {
  if (posts.length === 0) {
    return (
      <p data-block="blog-post-list" data-empty="true">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div data-block="blog-post-list">
      {posts.map((post) => (
        <BlogPostCard
          key={post.id}
          post={post}
          href={buildHref(post.slug)}
          coverUrl={
            post.coverImageDocumentId ? coverUrls?.get(post.coverImageDocumentId) : undefined
          }
          authorName={authorNames?.get(post.authorId)}
        />
      ))}
    </div>
  );
}
