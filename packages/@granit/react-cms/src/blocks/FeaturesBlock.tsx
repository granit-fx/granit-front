'use client';

import type { FeaturesBlockProps } from './types.js';

export function FeaturesBlock({ title, features }: FeaturesBlockProps) {
  return (
    <section data-block="features">
      {title && <h2>{title}</h2>}
      <ul>
        {features.map((feature, idx) => (
          <li key={idx}>
            <strong>{feature.heading}</strong>
            {feature.body && <p>{feature.body}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
