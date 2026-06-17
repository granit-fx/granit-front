'use client';

import type { DividerBlockProps } from './types';

/** A horizontal rule with configurable vertical margins. */
export function DividerBlock({ margins = 'Md' }: DividerBlockProps) {
  return <hr data-block="divider" data-margins={margins} />;
}
