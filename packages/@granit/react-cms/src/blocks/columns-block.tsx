'use client';

import type { ColumnsBlockProps } from './types';

/**
 * The `columns` layout block: two composable cells side by side. Layout ratio and gap are exposed
 * as `data-*` attributes so the renderer's `[data-block="columns"]` theme owns the grid (matching
 * the data-attribute styling convention used across the blocks).
 */
export function ColumnsBlock({
  layout = 'HalfHalf',
  gap = 'Medium',
  leftCol: LeftCol,
  rightCol: RightCol,
}: ColumnsBlockProps) {
  return (
    <section data-block="columns" data-layout={layout} data-gap={gap}>
      {/* Inner grid wrapper: the host's `[data-block] > *` rule width-caps and centers this single
          child, then the theme turns it into the two-column grid. */}
      <div data-columns-grid>
        <div data-column="left">
          <LeftCol />
        </div>
        <div data-column="right">
          <RightCol />
        </div>
      </div>
    </section>
  );
}
