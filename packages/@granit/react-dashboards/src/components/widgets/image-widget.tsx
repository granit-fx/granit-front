import type { ImageWidgetDefinition } from '@granit/dashboards';

/**
 * Built-in renderer for `ImageWidgetDefinition`.
 *
 * Uses native `<img>` rather than a framework-specific image component so the
 * widget remains usable in environments without a router-aware image loader
 * (Storybook, plain CRA, embed scenarios). `loading="lazy"` keeps off-screen
 * widgets cheap on long dashboards.
 */
export function ImageWidget({ widget }: { readonly widget: ImageWidgetDefinition }) {
  return (
    <div data-slot="image-widget" className="flex h-full w-full items-center justify-center">
      <img
        src={widget.src}
        alt={widget.alt ?? ''}
        loading="lazy"
        style={{ objectFit: widget.fit ?? 'contain' }}
        className="h-full w-full"
      />
    </div>
  );
}
