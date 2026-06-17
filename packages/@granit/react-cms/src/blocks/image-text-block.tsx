'use client';

import type { ImageTextBlockProps } from './types';

export function ImageTextBlock({
  heading,
  body,
  imagePosition = 'Left',
  _resolved_imageId,
}: ImageTextBlockProps) {
  return (
    <section
      data-block="image-text"
      data-image-position={imagePosition === 'Right' ? 'right' : 'left'}
    >
      {_resolved_imageId && (
        <img
          src={_resolved_imageId.url}
          width={_resolved_imageId.width ?? undefined}
          height={_resolved_imageId.height ?? undefined}
          alt={heading}
        />
      )}
      <div>
        <h2>{heading}</h2>
        {body && <p>{body}</p>}
      </div>
    </section>
  );
}
