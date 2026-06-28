import { useTranslation } from 'react-i18next';

import { resolveWidgetTitle } from '../lib/resolve-widget-title';
import { useWidgetRegistry } from '../registry/widget-registry-context';

import { useDashboardContext } from './dashboard-context';
import { WidgetCard } from './widget-card';

import type { WidgetDefinition } from '@granit/dashboards';

export interface WidgetRendererProps {
  readonly widget: WidgetDefinition;
  /**
   * When `true` (default), the widget body is wrapped in a {@link WidgetCard}
   * with the widget's title resolved from
   * `Widget:{dashboardName}.{slug}.Title`. Set to `false` to render only the
   * body — useful for image widgets that should bleed to the edges.
   */
  readonly framed?: boolean;
}

/**
 * Dispatches a {@link WidgetDefinition} to the renderer registered for its
 * `type` discriminator. If no renderer is registered, falls back to a small
 * placeholder so the dashboard surfaces missing-renderer issues visibly
 * rather than silently dropping widgets.
 *
 * Title resolution: composes `Widget:{dashboardName}.{slug}.Title` from the
 * active {@link useDashboardContext} and resolves via `useTranslation()`. When
 * no dashboard context is present (standalone widget), the prefix collapses to
 * `Widget:{slug}.Title`. An empty translation skips the title row entirely —
 * widgets that don't want a frame title just leave the key unset.
 */
export function WidgetRenderer({ widget, framed = true }: WidgetRendererProps) {
  const registry = useWidgetRegistry();
  const { t } = useTranslation();
  const dashboardCtx = useDashboardContext();

  const Renderer = registry[widget.type];
  const body = Renderer ? (
    <Renderer widget={widget} />
  ) : (
    <UnknownWidgetFallback type={widget.type} />
  );

  if (!framed) return body;

  // Prefer the widget's persisted title key (carried through the
  // definition bridge from a stored dashboard); fall back to the composed
  // `Widget:{Dashboard}.{Slug}.Title` convention for hand-authored
  // definitions (catalog previews / fixtures) that don't carry one.
  // A free-text title typed in the editor renders verbatim (resolveWidgetTitle).
  const titleKey =
    widget.titleLocalizationKey ??
    (dashboardCtx
      ? `Widget:${dashboardCtx.dashboardName}.${widget.slug}.Title`
      : `Widget:${widget.slug}.Title`);
  const title = resolveWidgetTitle(t, titleKey);

  return <WidgetCard title={title || undefined}>{body}</WidgetCard>;
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
