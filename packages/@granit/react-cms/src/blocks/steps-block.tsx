'use client';

import type { StepsBlockProps } from './types';

export function StepsBlock({ title, steps }: StepsBlockProps) {
  return (
    <section data-block="steps">
      {title && <h2>{title}</h2>}
      <ol>
        {steps.map((step) => (
          <li key={step.heading}>
            <strong>{step.heading}</strong>
            {step.body && <p>{step.body}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
