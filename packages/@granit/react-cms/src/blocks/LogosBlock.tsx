'use client';

import type { LogosBlockProps } from './types.js';

export function LogosBlock({ title, logos }: LogosBlockProps) {
  return (
    <section data-block="logos">
      {title && <p>{title}</p>}
      <ul>
        {logos.map((logo, idx) => (
          <li key={idx} aria-label={logo.alt} />
        ))}
      </ul>
    </section>
  );
}
