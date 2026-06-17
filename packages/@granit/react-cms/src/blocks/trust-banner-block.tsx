'use client';

import type { TrustBannerBlockProps } from './types';

export function TrustBannerBlock({ heading, logoIds = [] }: TrustBannerBlockProps) {
  return (
    <section data-block="trust-banner">
      {heading && <p>{heading}</p>}
      <ul>
        {logoIds.map((logo, i) => (
          <li key={i}>
            {logo._resolved_value && (
              <img
                src={logo._resolved_value.url}
                width={logo._resolved_value.width ?? undefined}
                height={logo._resolved_value.height ?? undefined}
                alt=""
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
