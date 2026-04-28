import { useWidgetRegistry } from '../registry/widget-registry-context.js';

import { WidgetCard } from './widget-card.js';

import type { WidgetDefinition } from '@granit/dashboards';

export interface WidgetRendererProps {
  readonly widget: WidgetDefinition;
  /**
   * When `true` (default), the widget body is wrapped in a {@link WidgetCard}
   * with the widget's title rendered above it. Set to `false` to render only
   * the body — useful for image widgets that should bleed to the edges.
   */
  readonly framed?: boolean;
}

/**
 * Dispatches a {@link WidgetDefinition} to the renderer registered for its
 * `type` discriminator. If no renderer is registered, falls back to a small
 * placeholder so the dashboard surfaces missing-renderer issues visibly
 * rather than silently dropping widgets.
 *
 * The dispatcher is intentionally generic — the active registry is read from
 * context, so the same `<WidgetRenderer>` works for framework, analytics, IoT,
 * and app-specific widget types depending on what's been registered upstream.
 */
export function WidgetRenderer({ widget, framed = true }: WidgetRendererProps) {
  const registry = useWidgetRegistry();
  const Renderer = registry[widget.type];

  const body = Renderer ? (
    <Renderer widget={widget} />
  ) : (
    <UnknownWidgetFallback type={widget.type} />
  );

  if (!framed) return body;
  return <WidgetCard title={widget.title}>{body}</WidgetCard>;
}

function UnknownWidgetFallback({ type }: { readonly type: string }) {
  return (
    <div
      data-slot="widget-unknown"
      className="flex h-full items-center justify-center rounded-md border border-dashed border-destructive/40 p-3 text-xs text-destructive"
    >
      Unknown widget type: <code className="ml-1 font-mono">{type}</code>
    </div>
  );
}
