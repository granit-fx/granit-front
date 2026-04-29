import { useTranslation } from 'react-i18next';

import { useWidgetTriggerHandler } from '../../hooks/use-widget-trigger-handler.js';

import type { ImageFit, ImageWidgetDefinition } from '@granit/dashboards';
import type { CSSProperties } from 'react';

const OBJECT_FIT_CLASS: Readonly<Record<ImageFit, NonNullable<CSSProperties['objectFit']>>> = {
  Contain: 'contain',
  Cover: 'cover',
  Fill: 'fill',
};

/**
 * Built-in renderer for `ImageWidgetDefinition`.
 *
 * Uses native `<img>` rather than a framework-specific image
 * component so the widget remains usable in environments without a
 * router-aware image loader (Storybook, plain CRA, embed scenarios).
 * `loading="lazy"` keeps off-screen widgets cheap on long dashboards.
 *
 * The `source` field accepts either a plain URL or a `blob:<id>`
 * reference resolved by the host's blob storage adapter — apps that
 * ship blob support register a richer renderer overriding this
 * default. The `fit` field maps 1-to-1 to CSS `object-fit` (default
 * `'Contain'` matches the backend default for logo-style imagery).
 *
 * `Click` actions on `widget.actions` fire on body click via
 * {@link useWidgetTriggerHandler}. The wrapper element receives
 * `role="button"` + keyboard activation only when at least one Click
 * action is wired — non-actionable images stay keyboard-inert.
 */
export function ImageWidget({ widget }: { readonly widget: ImageWidgetDefinition }) {
  const { t } = useTranslation();
  const alt = t(widget.altLocalizationKey);
  const objectFit = OBJECT_FIT_CLASS[widget.fit ?? 'Contain'];
  const onClick = useWidgetTriggerHandler('Click', widget.actions);

  return (
    <div
      data-slot="image-widget"
      data-interactive={onClick ? '' : undefined}
      onClick={onClick ? () => onClick() : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`flex h-full w-full items-center justify-center${
        onClick ? ' cursor-pointer' : ''
      }`}
    >
      <img
        src={widget.source}
        alt={alt}
        loading="lazy"
        style={{ objectFit }}
        className="h-full w-full"
      />
    </div>
  );
}
