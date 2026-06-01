'use client';

import type { TimelineBlockProps } from './types';

export function TimelineBlock({ title, items }: TimelineBlockProps) {
  return (
    <section data-block="timeline">
      {title && <h2>{title}</h2>}
      <ol>
        {items.map((item, idx) => (
          <li key={idx}>
            <strong>{item.heading}</strong>
            {item.date && <time>{item.date}</time>}
            {item.body && <p>{item.body}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
