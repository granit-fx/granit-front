'use client';

import type { ImageTextBlockProps } from './types.js';

export function ImageTextBlock({ title, body, imagePosition = 'left' }: ImageTextBlockProps) {
  return (
    <section data-block="image-text" data-image-position={imagePosition}>
      <div>
        <h2>{title}</h2>
        {body && <p>{body}</p>}
      </div>
    </section>
  );
}
