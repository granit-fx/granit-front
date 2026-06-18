'use client';

import type { StatsBlockProps } from './types';

export function StatsBlock({ title, items = [] }: StatsBlockProps) {
  return (
    <section data-block="stats">
      {title && <h2>{title}</h2>}
      <ul>
        {items.map((stat) => (
          <li key={`${stat.label}-${stat.value}`}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
