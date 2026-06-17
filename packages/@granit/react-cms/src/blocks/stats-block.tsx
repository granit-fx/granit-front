'use client';

import type { StatsBlockProps } from './types';

export function StatsBlock({ title, items = [] }: StatsBlockProps) {
  return (
    <section data-block="stats">
      {title && <h2>{title}</h2>}
      <ul>
        {items.map((stat, i) => (
          <li key={i}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
