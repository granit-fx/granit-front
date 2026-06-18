'use client';

import type { StepsBlockProps } from './types';

export function StepsBlock({ title, items = [] }: StepsBlockProps) {
  return (
    <section data-block="steps">
      {title && <h2>{title}</h2>}
      <ol>
        {items.map((step) => (
          <li key={`${step.number}-${step.title}`}>
            {step.number && <span data-step-number>{step.number}</span>}
            <strong>{step.title}</strong>
            {step.description && <p>{step.description}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
