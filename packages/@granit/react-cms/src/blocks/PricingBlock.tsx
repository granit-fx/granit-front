'use client';

import type { PricingBlockProps } from './types';

export function PricingBlock({ title, plans }: PricingBlockProps) {
  return (
    <section data-block="pricing">
      <h2>{title}</h2>
      <ul>
        {plans.map((plan, idx) => (
          <li key={idx} data-highlighted={plan.highlighted ? 'true' : undefined}>
            <strong>{plan.name}</strong>
            <span>{plan.price}</span>
            {plan.description && <p>{plan.description}</p>}
            <ul>
              {plan.features.map((f, fi) => (
                <li key={fi}>{f}</li>
              ))}
            </ul>
            {plan.ctaLabel && plan.ctaHref && <a href={plan.ctaHref}>{plan.ctaLabel}</a>}
          </li>
        ))}
      </ul>
    </section>
  );
}
