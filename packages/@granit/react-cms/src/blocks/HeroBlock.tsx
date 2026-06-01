'use client';

import type { HeroBlockProps } from './types';

export function HeroBlock({
  headline,
  subline,
  ctaLabel,
  ctaHref,
  _resolved_imageId,
}: HeroBlockProps) {
  return (
    <section data-block="hero">
      {_resolved_imageId && (
        <img
          src={_resolved_imageId.url}
          width={_resolved_imageId.width ?? undefined}
          height={_resolved_imageId.height ?? undefined}
          alt={headline}
        />
      )}
      <h1>{headline}</h1>
      {subline && <p>{subline}</p>}
      {ctaLabel && ctaHref && <a href={ctaHref}>{ctaLabel}</a>}
    </section>
  );
}
