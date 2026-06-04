'use client';

import { safeLinkHref } from '../lib/safe-href';

import type { HeroBlockProps } from './types';

export function HeroBlock({
  headline,
  subline,
  ctaLabel,
  ctaHref,
  _resolved_imageId,
}: HeroBlockProps) {
  const ctaSafeHref = safeLinkHref(ctaHref);
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
      {ctaLabel && ctaSafeHref && <a href={ctaSafeHref}>{ctaLabel}</a>}
    </section>
  );
}
