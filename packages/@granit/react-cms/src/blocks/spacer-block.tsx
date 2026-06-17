'use client';

import type { SpacerBlockProps } from './types';

/** Pushes content down by a fixed vertical gap. */
export function SpacerBlock({ size = 'Px32' }: SpacerBlockProps) {
  return <div data-block="spacer" data-size={size} aria-hidden />;
}
