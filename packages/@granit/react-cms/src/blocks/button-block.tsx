'use client';

import type { ButtonBlockProps } from './types';

/** A standalone call-to-action link. */
export function ButtonBlock({
  label,
  href,
  variant = 'Primary',
  size = 'Default',
  target = 'Self',
}: ButtonBlockProps) {
  const newTab = target === 'Blank';
  return (
    <a
      data-block="button"
      data-variant={variant}
      data-size={size}
      href={href}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
    >
      {label}
    </a>
  );
}
