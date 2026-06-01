import { useTranslation } from 'react-i18next';

import { useWidgetTriggerHandler } from '../hooks/use-widget-trigger-handler';
import { useSnapshotWidgetRegistry } from '../registry/snapshot-widget-registry-context';

import { WidgetCard } from './widget-card';

import type { DashboardRenderedWidget } from '@granit/dashboards';
import type { ReactElement } from 'react';

/**
 * Per-widget dispatcher for the bundle response. Switches on
 * {@link DashboardRenderedWidget.widgetType} to pick the registered
 * renderer, surfaces the framework's three runtime states inline, and
 * falls back to a safe placeholder when no renderer is registered for
 * the kind.
 *
 * Per ADR-039 §3 the dashboard renderer guarantees per-widget error
 * isolation: the bundle response stays 200 even when a widget's
 * renderer throws server-side, so the frontend always has *something*
 * to dispatch on. This dispatcher honours the same contract —
 * `'Unavailable'` and `'Error'` statuses render their localized reason
 * key without invoking the typed renderer at all.
 *
 * Title resolution: reads `widget.titleLocalizationKey` (backend P1
 * envelope extension), resolved via `useTranslation()` and forwarded
 * to {@link WidgetCard}. Falls back to no title when the key isn't
 * registered in the i18n bundle (an empty translation collapses the
 * card header).
 *
 * Action dispatch: when the envelope carries `widget.actions` (backend
 * P1), the body wrapper fires `Click` actions through the framework's
 * {@link useWidgetTriggerHandler}. The dispatcher relies on the
 * surrounding {@link WidgetActionProvider} (or framework defaults).
 */
export interface RenderedWidgetProps {
  readonly widget: DashboardRenderedWidget;
  /**
   * When `true` (default), the widget body is wrapped in a {@link WidgetCard}
   * for chrome consistency with the definition path's `<WidgetRenderer>`.
   * Set to `false` when the snapshot renderer ships its own chrome
   * (e.g. an Image widget that bleeds to the cell edges).
   */
  readonly framed?: boolean;
}

export function RenderedWidget({ widget, framed = true }: RenderedWidgetProps) {
  const registry = useSnapshotWidgetRegistry();
  const { t } = useTranslation();
  const onClick = useWidgetTriggerHandler('Click', widget.actions);

  const fallback = renderFallbackForStatus(widget);
  if (fallback) return fallback;

  const Renderer = registry[widget.widgetType];
  if (!Renderer) {
    return <UnknownKindSlot widgetType={widget.widgetType} />;
  }

  const renderedBody = <Renderer widget={widget} />;
  const body = onClick ? (
    <button
      type="button"
      data-slot="rendered-widget"
      data-widget-type={widget.widgetType}
      data-widget-slug={widget.slug}
      data-interactive=""
      onClick={() => onClick()}
      className="h-full w-full cursor-pointer text-left bg-transparent border-0 p-0"
    >
      {renderedBody}
    </button>
  ) : (
    <div
      data-slot="rendered-widget"
      data-widget-type={widget.widgetType}
      data-widget-slug={widget.slug}
      className="h-full"
    >
      {renderedBody}
    </div>
  );

  if (!framed) return body;

  // Empty translation = no header (i18n returns the key by default
  // when a `defaultValue` is supplied; we explicitly request '' so a
  // missing key collapses cleanly).
  const title = t(widget.titleLocalizationKey, { defaultValue: '' });
  return <WidgetCard title={title || undefined}>{body}</WidgetCard>;
}

function renderFallbackForStatus(widget: DashboardRenderedWidget): ReactElement | null {
  if (widget.status === 'Unavailable') {
    return (
      <UnavailableSlot
        reasonKey={widget.reasonLocalizationKey ?? 'Widget:Unavailable'}
        widgetType={widget.widgetType}
      />
    );
  }
  if (widget.status === 'Error') {
    return (
      <ErrorSlot
        reasonKey={widget.reasonLocalizationKey ?? 'Widget:Error'}
        widgetType={widget.widgetType}
      />
    );
  }
  return null;
}

function UnavailableSlot({
  reasonKey,
  widgetType,
}: {
  readonly reasonKey: string;
  readonly widgetType: string;
}) {
  return (
    <div
      data-slot="rendered-widget"
      data-widget-type={widgetType}
      data-widget-status="unavailable"
      className="flex h-full items-center justify-center rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground"
    >
      {/* Reason key is the wire identifier; consumers translate via i18n. */}
      <span data-slot="rendered-widget-reason">{reasonKey}</span>
    </div>
  );
}

function ErrorSlot({
  reasonKey,
  widgetType,
}: {
  readonly reasonKey: string;
  readonly widgetType: string;
}) {
  return (
    <div
      data-slot="rendered-widget"
      data-widget-type={widgetType}
      data-widget-status="error"
      className="flex h-full items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
    >
      <span data-slot="rendered-widget-reason">{reasonKey}</span>
    </div>
  );
}

function UnknownKindSlot({ widgetType }: { readonly widgetType: string }) {
  // No registered renderer — typically means the host forgot to compose
  // the relevant registry (analytics / IoT / app-specific). We log nothing
  // here on purpose; the host wiring is the bug, not the bundle response.
  return (
    <div
      data-slot="rendered-widget"
      data-widget-type={widgetType}
      data-widget-status="unknown-kind"
      className="flex h-full items-center justify-center rounded-md border border-dashed border-amber-400/60 bg-amber-50/40 p-3 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-300"
    >
      <span>Unknown widget kind: {widgetType}</span>
    </div>
  );
}
