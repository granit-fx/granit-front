'use client';

import DOMPurify from 'isomorphic-dompurify';

import type { TextBlockProps } from './types';

/**
 * A rich-text paragraph. `content` is HTML produced by Puck's WYSIWYG (`richtext`) control and is
 * sanitized here with DOMPurify (isomorphic, so it runs at SSR and on the client editor) before
 * being injected as markup.
 */
export function TextBlock({ content, size = 'Base', color = 'Default' }: TextBlockProps) {
  const html = DOMPurify.sanitize(content ?? '');
  return (
    <div
      data-block="text"
      data-size={size}
      data-color={color}
      // eslint-disable-next-line no-restricted-syntax -- html is DOMPurify-sanitized on the line above
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
