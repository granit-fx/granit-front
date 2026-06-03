'use client';

import { safeLinkHref } from '../lib/safe-href';

import type { PricingBlockProps } from './types';

export function PricingBlock({ title, plans }: PricingBlockProps) {
  return (
    <section data-block="pricing">
      <h2>{title}</h2>
      <ul>
        {plans.map((plan) => {
          const ctaSafeHref = safeLinkHref(plan.ctaHref);
          return (
            <li key={plan.name} data-highlighted={plan.highlighted ? 'true' : undefined}>
              <strong>{plan.name}</strong>
              <span>{plan.price}</span>
              {plan.description && <p>{plan.description}</p>}
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {plan.ctaLabel && ctaSafeHref && <a href={ctaSafeHref}>{plan.ctaLabel}</a>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
