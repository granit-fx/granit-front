'use client';

import type { FeaturesBlockProps } from './types';

export function FeaturesBlock({ title, items = [] }: FeaturesBlockProps) {
  return (
    <section data-block="features">
      {title && <h2>{title}</h2>}
      <ul>
        {items.map((feature) => (
          <li key={feature.title}>
            <strong>{feature.title}</strong>
            {feature.description && <p>{feature.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
