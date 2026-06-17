'use client';

import type { AlertBlockProps } from './types';

/** A callout highlighting important information; the slot holds its body (text, link or button). */
export function AlertBlock({ intent = 'Info', title, content: Content }: AlertBlockProps) {
  return (
    <div data-block="alert" data-intent={intent} role="note">
      {title && <strong data-alert-title>{title}</strong>}
      <Content />
    </div>
  );
}
