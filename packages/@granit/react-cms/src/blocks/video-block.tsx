'use client';

import { safeMediaSrc } from '../lib/safe-href';

import type { VideoBlockProps } from './types';

export function VideoBlock({ url, caption, autoplay = false, loop = false }: VideoBlockProps) {
  const safeSrc = safeMediaSrc(url);
  return (
    <section data-block="video">
      {caption && <h2>{caption}</h2>}
      {safeSrc && (
        <video src={safeSrc} controls autoPlay={autoplay} loop={loop} muted={autoplay}>
          <track kind="captions" />
        </video>
      )}
    </section>
  );
}
