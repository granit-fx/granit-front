'use client';

import type { HeadingBlockProps } from './types';

const TAGS = { H1: 'h1', H2: 'h2', H3: 'h3', H4: 'h4' } as const;

/** A title whose semantic level (SEO/a11y) and visual size are chosen independently. */
export function HeadingBlock({
  text,
  level = 'H2',
  size = 'Default',
  align = 'Left',
}: HeadingBlockProps) {
  const Tag = TAGS[level];
  return (
    <Tag data-block="heading" data-size={size} data-align={align}>
      {text}
    </Tag>
  );
}
