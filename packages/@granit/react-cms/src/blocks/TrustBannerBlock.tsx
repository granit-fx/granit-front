'use client';

import type { TrustBannerBlockProps } from './types.js';

export function TrustBannerBlock({ title, logos }: TrustBannerBlockProps) {
  return (
    <section data-block="trust-banner">
      {title && <p>{title}</p>}
      <ul>
        {logos.map((logo, idx) => (
          <li key={idx} aria-label={logo.alt} />
        ))}
      </ul>
    </section>
  );
}
