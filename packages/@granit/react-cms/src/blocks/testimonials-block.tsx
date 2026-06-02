'use client';

import type { TestimonialsBlockProps } from './types';

export function TestimonialsBlock({ title, testimonials }: TestimonialsBlockProps) {
  return (
    <section data-block="testimonials">
      {title && <h2>{title}</h2>}
      <ul>
        {testimonials.map((t) => (
          <li key={t.quote}>
            <blockquote>{t.quote}</blockquote>
            {t.author && (
              <cite>
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
