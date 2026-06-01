'use client';

import type { StatsBlockProps } from './types';

export function StatsBlock({ title, stats }: StatsBlockProps) {
  return (
    <section data-block="stats">
      {title && <h2>{title}</h2>}
      <ul>
        {stats.map((stat, idx) => (
          <li key={idx}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
