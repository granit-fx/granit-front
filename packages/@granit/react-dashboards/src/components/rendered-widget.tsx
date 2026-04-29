import { useSnapshotWidgetRegistry } from '../registry/snapshot-widget-registry-context.js';

import type { DashboardRenderedWidget } from '@granit/dashboards';

/**
 * Per-widget dispatcher for the bundle response. Switches on
 * {@link DashboardRenderedWidget.widgetType} to pick the registered renderer,
 * surfaces the framework's three runtime states inline, and falls back to a
 * safe placeholder when no renderer is registered for the kind.
 *
 * Per ADR-039 §3 the dashboard renderer guarantees per-widget error
 * isolation: the bundle response stays 200 even when a widget's renderer
 * throws server-side, so the frontend always has *something* to dispatch on.
 * This dispatcher honours the same contract — `'Unavailable'` and `'Error'`
 * statuses render their localized reason key without invoking the typed
 * renderer at all.
 *
 * Wrap the parent tree with {@link SnapshotWidgetRegistryProvider} composing
 * `defaultSnapshotWidgetRegistry` plus any per-domain registries (analytics,
 * IoT, app-specific) the host needs.
 */
export interface RenderedWidgetProps {
  readonly widget: DashboardRenderedWidget;
}

export function RenderedWidget({ widget }: RenderedWidgetProps) {
  const registry = useSnapshotWidgetRegistry();

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

  const Renderer = registry[widget.widgetType];
  if (!Renderer) {
    return <UnknownKindSlot widgetType={widget.widgetType} />;
  }

  return (
    <div data-slot="rendered-widget" data-widget-type={widget.widgetType}>
      <Renderer widget={widget} />
    </div>
  );
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
