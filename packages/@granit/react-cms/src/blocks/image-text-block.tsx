'use client';

import type { ImageTextBlockProps } from './types';

export function ImageTextBlock({
  title,
  body,
  imagePosition = 'left',
  _resolved_imageId,
}: ImageTextBlockProps) {
  return (
    <section data-block="image-text" data-image-position={imagePosition}>
      {_resolved_imageId && (
        <img
          src={_resolved_imageId.url}
          width={_resolved_imageId.width ?? undefined}
          height={_resolved_imageId.height ?? undefined}
          alt={title}
        />
      )}
      <div>
        <h2>{title}</h2>
        {body && <p>{body}</p>}
      </div>
    </section>
  );
}
