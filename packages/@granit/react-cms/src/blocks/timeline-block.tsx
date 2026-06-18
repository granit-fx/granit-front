'use client';

import type { TimelineBlockProps } from './types';

export function TimelineBlock({ title, events = [] }: TimelineBlockProps) {
  return (
    <section data-block="timeline">
      {title && <h2>{title}</h2>}
      <ol>
        {events.map((event) => (
          <li key={`${event.date}-${event.title}`}>
            <strong>{event.title}</strong>
            {event.date && <time>{event.date}</time>}
            {event.description && <p>{event.description}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
