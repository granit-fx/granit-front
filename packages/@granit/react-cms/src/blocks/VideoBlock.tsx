'use client';

import type { VideoBlockProps } from './types.js';

export function VideoBlock({ title, videoUrl }: VideoBlockProps) {
  return (
    <section data-block="video">
      {title && <h2>{title}</h2>}
      <video src={videoUrl} controls />
    </section>
  );
}
