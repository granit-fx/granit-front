export interface BlogPostCoverProps {
  /** Resolved cover URL (see `useResolvedDocuments`). When absent, nothing renders. */
  readonly url?: string;
  readonly alt?: string;
  readonly caption?: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

/** A post cover image, resolved from `coverImageDocumentId` upstream. */
export function BlogPostCover({ url, alt = '', caption, width, height }: BlogPostCoverProps) {
  if (!url) return null;
  return (
    <figure data-block="blog-post-cover">
      <img
        src={url}
        alt={alt}
        width={width ?? undefined}
        height={height ?? undefined}
        loading="lazy"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
