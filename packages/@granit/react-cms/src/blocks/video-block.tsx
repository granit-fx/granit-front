'use client';

import { safeMediaSrc } from '../lib/safe-href';

import type { VideoBlockProps } from './types';

export function VideoBlock({ title, videoUrl, _resolved_thumbnailId }: VideoBlockProps) {
  const safeSrc = safeMediaSrc(videoUrl);
  return (
    <section data-block="video">
      {title && <h2>{title}</h2>}
      {safeSrc && (
        <video src={safeSrc} controls poster={_resolved_thumbnailId?.url ?? undefined}>
          <track kind="captions" />
        </video>
      )}
    </section>
  );
}
