'use client';

import { safeLinkHref } from '../lib/safe-href';

import type { PricingBlockProps } from './types';

export function PricingBlock({ title, plans = [] }: PricingBlockProps) {
  return (
    <section data-block="pricing">
      {title && <h2>{title}</h2>}
      <ul>
        {plans.map((plan, i) => {
          const ctaSafeHref = safeLinkHref(plan.ctaHref);
          return (
            <li key={i} data-highlighted={plan.highlighted ? 'true' : undefined}>
              <strong>{plan.name}</strong>
              <span>{plan.price}</span>
              {plan.period && <p>{plan.period}</p>}
              <ul>
                {(plan.features ?? []).map((f, fi) => (
                  <li key={fi}>{f.value}</li>
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
