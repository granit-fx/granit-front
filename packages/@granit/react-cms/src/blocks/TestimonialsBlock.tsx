'use client';

import type { TestimonialsBlockProps } from './types.js';

export function TestimonialsBlock({ title, testimonials }: TestimonialsBlockProps) {
  return (
    <section data-block="testimonials">
      {title && <h2>{title}</h2>}
      <ul>
        {testimonials.map((t, idx) => (
          <li key={idx}>
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
