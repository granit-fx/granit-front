'use client';

import type { LogosBlockProps } from './types';

export function LogosBlock({ title, logos }: LogosBlockProps) {
  return (
    <section data-block="logos">
      {title && <p>{title}</p>}
      <ul>
        {logos.map((logo) => (
          <li key={`${String(logo.imageId)}-${logo.alt ?? ''}`}>
            {logo._resolved_imageId ? (
              <img
                src={logo._resolved_imageId.url}
                width={logo._resolved_imageId.width ?? undefined}
                height={logo._resolved_imageId.height ?? undefined}
                alt={logo.alt ?? ''}
              />
            ) : (
              <span aria-label={logo.alt} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
