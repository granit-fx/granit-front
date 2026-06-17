'use client';

import { safeLinkHref } from '../lib/safe-href';

import type { HeroBlockProps } from './types';

export function HeroBlock({
  headline,
  subheadline,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  alignment = 'Center',
  _resolved_imageId,
}: HeroBlockProps) {
  const primaryHref = safeLinkHref(primaryCtaHref);
  const secondaryHref = safeLinkHref(secondaryCtaHref);
  return (
    <section data-block="hero" data-alignment={(alignment ?? 'Center').toLowerCase()}>
      {_resolved_imageId && (
        <img
          src={_resolved_imageId.url}
          width={_resolved_imageId.width ?? undefined}
          height={_resolved_imageId.height ?? undefined}
          alt={headline}
        />
      )}
      <h1>{headline}</h1>
      {subheadline && <p>{subheadline}</p>}
      {primaryCtaLabel && primaryHref && <a href={primaryHref}>{primaryCtaLabel}</a>}
      {secondaryCtaLabel && secondaryHref && <a href={secondaryHref}>{secondaryCtaLabel}</a>}
    </section>
  );
}
