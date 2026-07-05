'use client';

import type { BlogLatestPostsBlockProps } from './types';
import type { BlogLatestPostsItem } from '@granit/blog';

function defaultHref(slug: string): string {
  return `/blog/${slug}`;
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/**
 * Presentational `blog-latest-posts` block. Renders the posts resolved by the
 * `blog.latest-posts` data source as a Grid or List of cards (title, summary,
 * date, optional cover). Editor-agnostic — the semantic fields (`heading`,
 * `count`, `layout`) are configured through the shared Puck catalog.
 */
export function BlogLatestPostsBlock({
  heading,
  count,
  layout = 'Grid',
  posts,
  buildHref = defaultHref,
  resolveDocumentUrl,
}: BlogLatestPostsBlockProps) {
  const items = (posts ?? []).slice(0, count && count > 0 ? count : undefined);

  return (
    <section
      data-block="blog-latest-posts"
      data-layout={layout}
      aria-label={heading ?? 'Latest posts'}
    >
      {heading ? <h2>{heading}</h2> : null}
      {items.length === 0 ? (
        <p data-empty="true">No posts yet.</p>
      ) : (
        <ul data-layout={layout} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((item) => (
            <PostCard
              key={item.id}
              item={item}
              href={buildHref(item.slug)}
              coverUrl={
                item.coverImageDocumentId
                  ? resolveDocumentUrl?.(item.coverImageDocumentId)
                  : undefined
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PostCard({
  item,
  href,
  coverUrl,
}: {
  readonly item: BlogLatestPostsItem;
  readonly href: string;
  readonly coverUrl: string | undefined;
}) {
  const published = formatDate(item.publishedAt);
  return (
    <li data-block="blog-latest-posts-card">
      <article>
        {coverUrl ? (
          <a href={href} tabIndex={-1} aria-hidden="true">
            <img src={coverUrl} alt="" loading="lazy" style={{ maxWidth: '100%' }} />
          </a>
        ) : null}
        <h3>
          <a href={href}>{item.title}</a>
        </h3>
        {item.summary ? <p>{item.summary}</p> : null}
        {published ? <time dateTime={published}>{published}</time> : null}
      </article>
    </li>
  );
}
