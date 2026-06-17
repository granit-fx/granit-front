'use client';

import { safeLinkHref } from '../lib/safe-href';

import type { CtaBlockProps } from './types';

export function CtaBlock({
  headline,
  body,
  buttonLabel,
  buttonHref,
  style = 'Primary',
}: CtaBlockProps) {
  const buttonSafeHref = safeLinkHref(buttonHref);
  return (
    <section data-block="cta" data-style={(style ?? 'Primary').toLowerCase()}>
      <h2>{headline}</h2>
      {body && <p>{body}</p>}
      {buttonLabel && buttonSafeHref && <a href={buttonSafeHref}>{buttonLabel}</a>}
    </section>
  );
}
