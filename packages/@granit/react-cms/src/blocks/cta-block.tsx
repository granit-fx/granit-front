'use client';

import { safeLinkHref } from '../lib/safe-href';

import type { CtaBlockProps } from './types';

export function CtaBlock({ title, description, buttonLabel, buttonHref }: CtaBlockProps) {
  const buttonSafeHref = safeLinkHref(buttonHref);
  return (
    <section data-block="cta">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {buttonLabel && buttonSafeHref && <a href={buttonSafeHref}>{buttonLabel}</a>}
    </section>
  );
}
