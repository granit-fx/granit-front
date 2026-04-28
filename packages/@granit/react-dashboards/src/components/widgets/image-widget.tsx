import { useTranslation } from 'react-i18next';

import type { ImageWidgetDefinition } from '@granit/dashboards';

/**
 * Built-in renderer for `ImageWidgetDefinition`.
 *
 * Uses native `<img>` rather than a framework-specific image component so the
 * widget remains usable in environments without a router-aware image loader
 * (Storybook, plain CRA, embed scenarios). `loading="lazy"` keeps off-screen
 * widgets cheap on long dashboards.
 *
 * The `source` field accepts either a plain URL or a `blob:<id>` reference
 * resolved by the host's blob storage adapter — apps that ship blob support
 * register a richer renderer overriding this default.
 */
export function ImageWidget({ widget }: { readonly widget: ImageWidgetDefinition }) {
  const { t } = useTranslation();
  const alt = t(widget.altLocalizationKey);
  return (
    <div data-slot="image-widget" className="flex h-full w-full items-center justify-center">
      <img
        src={widget.source}
        alt={alt}
        loading="lazy"
        style={{ objectFit: 'contain' }}
        className="h-full w-full"
      />
    </div>
  );
}
