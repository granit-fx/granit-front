'use client';

import type { VideoBlockProps } from './types';

export function VideoBlock({ title, videoUrl, _resolved_thumbnailId }: VideoBlockProps) {
  return (
    <section data-block="video">
      {title && <h2>{title}</h2>}
      <video src={videoUrl} controls poster={_resolved_thumbnailId?.url ?? undefined} />
    </section>
  );
}
