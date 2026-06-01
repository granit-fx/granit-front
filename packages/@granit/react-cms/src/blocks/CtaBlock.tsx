'use client';

import type { CtaBlockProps } from './types.js';

export function CtaBlock({ title, description, buttonLabel, buttonHref }: CtaBlockProps) {
  return (
    <section data-block="cta">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {buttonLabel && buttonHref && <a href={buttonHref}>{buttonLabel}</a>}
    </section>
  );
}
