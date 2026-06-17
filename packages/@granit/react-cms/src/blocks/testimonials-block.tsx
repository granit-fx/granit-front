'use client';

import type { TestimonialsBlockProps } from './types';

export function TestimonialsBlock({ title, items = [] }: TestimonialsBlockProps) {
  return (
    <section data-block="testimonials">
      {title && <h2>{title}</h2>}
      <ul>
        {items.map((t, i) => (
          <li key={i}>
            <blockquote>{t.quote}</blockquote>
            {t.author && (
              <cite>
                {t._resolved_avatarId && (
                  <img src={t._resolved_avatarId.url} alt={t.author} width={40} height={40} />
                )}
                {t.author}
                {t.role && `, ${t.role}`}
              </cite>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
