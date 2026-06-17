'use client';

import type { ButtonGroupBlockProps } from './types';

/** Aligns several buttons in a row. The slot is restricted to `button` blocks by the catalog. */
export function ButtonGroupBlock({ alignment = 'Left', buttons: Buttons }: ButtonGroupBlockProps) {
  return (
    <div data-block="button-group" data-align={alignment}>
      <Buttons />
    </div>
  );
}
