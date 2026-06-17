'use client';

import type { ImageBlockProps } from './types';

/** A single image resolved from the media library (`_resolved_imageId` injected at publish time). */
export function ImageBlock({
  _resolved_imageId,
  alt = '',
  aspectRatio = 'Auto',
  objectFit = 'Cover',
}: ImageBlockProps) {
  if (!_resolved_imageId) return null;
  return (
    <img
      data-block="image"
      data-aspect={aspectRatio}
      data-fit={objectFit}
      src={_resolved_imageId.url}
      width={_resolved_imageId.width ?? undefined}
      height={_resolved_imageId.height ?? undefined}
      alt={alt}
    />
  );
}
