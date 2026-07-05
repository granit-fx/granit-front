export interface BlogAuthorBylineProps {
  readonly displayName: string;
  readonly bio?: string | null;
  /** Resolved avatar URL (see `useResolvedDocuments`, `Thumbnail` rendition). */
  readonly avatarUrl?: string;
  /** ISO date string of publication; rendered as a `<time>` when present. */
  readonly publishedAt?: string | null;
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/** Author byline: avatar, display name, optional bio and publication date. */
export function BlogAuthorByline({
  displayName,
  bio,
  avatarUrl,
  publishedAt,
}: BlogAuthorBylineProps) {
  const published = formatDate(publishedAt);
  return (
    <div data-block="blog-author-byline">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          style={{ borderRadius: '50%' }}
        />
      ) : null}
      <div>
        <span data-field="name">{displayName}</span>
        {bio ? <p data-field="bio">{bio}</p> : null}
        {published ? <time dateTime={published}>{published}</time> : null}
      </div>
    </div>
  );
}
