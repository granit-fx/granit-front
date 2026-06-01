'use client';

import type { HeroBlockProps } from './types.js';

export function HeroBlock({ headline, subline, ctaLabel, ctaHref }: HeroBlockProps) {
  return (
    <section data-block="hero">
      <h1>{headline}</h1>
      {subline && <p>{subline}</p>}
      {ctaLabel && ctaHref && <a href={ctaHref}>{ctaLabel}</a>}
    </section>
  );
}
