import type { BlogPostPublishedListItemResponse } from '@granit/blog';

export interface BlogPostCardProps {
  readonly post: BlogPostPublishedListItemResponse;
  /** Reader href for this post. */
  readonly href: string;
  /** Resolved cover URL (see `useResolvedDocuments`). Optional. */
  readonly coverUrl?: string;
  readonly authorName?: string;
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/** A post summary card for archive/list surfaces. */
export function BlogPostCard({ post, href, coverUrl, authorName }: BlogPostCardProps) {
  const published = formatDate(post.publishedAt);
  return (
    <article data-block="blog-post-card">
      {coverUrl ? (
        <a href={href} tabIndex={-1} aria-hidden="true">
          <img src={coverUrl} alt="" loading="lazy" style={{ maxWidth: '100%', height: 'auto' }} />
        </a>
      ) : null}
      <h3>
        <a href={href}>{post.title}</a>
      </h3>
      {post.summary ? <p>{post.summary}</p> : null}
      <div data-field="meta">
        {authorName ? <span data-field="author">{authorName}</span> : null}
        {published ? <time dateTime={published}>{published}</time> : null}
      </div>
    </article>
  );
}
