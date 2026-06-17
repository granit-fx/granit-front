'use client';

import type { CardBlockProps } from './types';

/** A bordered, optionally elevated surface holding a composable slot. */
export function CardBlock({ shadow = 'Sm', content: Content }: CardBlockProps) {
  return (
    <div data-block="card" data-shadow={shadow}>
      <Content />
    </div>
  );
}
