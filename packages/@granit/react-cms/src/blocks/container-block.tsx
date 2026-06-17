'use client';

import type { ContainerBlockProps } from './types';

/** Centres its content and caps the width on large screens. */
export function ContainerBlock({ maxWidth = 'Lg', content: Content }: ContainerBlockProps) {
  return (
    <div data-block="container" data-max-width={maxWidth}>
      <Content />
    </div>
  );
}
