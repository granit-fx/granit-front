export interface BlogGalleryImage {
  readonly url: string;
  readonly alt?: string;
  readonly caption?: string;
}

export interface BlogPostGalleryProps {
  readonly images: readonly BlogGalleryImage[];
  readonly label?: string;
}

/** A post's attachment gallery (resolved attachment Document ids → URLs). */
export function BlogPostGallery({ images, label = 'Gallery' }: BlogPostGalleryProps) {
  if (images.length === 0) return null;
  return (
    <ul
      data-block="blog-post-gallery"
      aria-label={label}
      style={{ listStyle: 'none', margin: 0, padding: 0 }}
    >
      {images.map((image, index) => (
        <li key={`${image.url}-${index}`}>
          <figure>
            <img
              src={image.url}
              alt={image.alt ?? ''}
              loading="lazy"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        </li>
      ))}
    </ul>
  );
}
