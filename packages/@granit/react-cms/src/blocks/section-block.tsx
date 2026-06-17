'use client';

import type { SectionBlockProps } from './types';

/** Full-bleed band owning background + vertical rhythm; holds a composable slot. */
export function SectionBlock({
  backgroundColor = 'White',
  paddingY = 'Medium',
  content: Content,
}: SectionBlockProps) {
  return (
    <section data-block="section" data-bg={backgroundColor} data-py={paddingY}>
      <Content />
    </section>
  );
}
