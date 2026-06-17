'use client';

import type { LogosBlockProps } from './types';

export function LogosBlock({ title, logoIds = [] }: LogosBlockProps) {
  return (
    <section data-block="logos">
      {title && <p>{title}</p>}
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
