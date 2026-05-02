import type {
  DashboardBreakpoint,
  DashboardLayout,
  DashboardLayoutOverride,
  WidgetDefinition,
  WidgetSize,
} from '@granit/dashboards';

/**
 * Applies a {@link DashboardLayoutOverride} on top of a base
 * {@link DashboardLayout}, returning the effective layout for the active
 * viewport. Pure function, no React deps — exported for tests + custom
 * dashboard wrappers.
 *
 * Override semantics (per
 * `Granit.Dashboards.DashboardLayoutOverride` on the backend):
 *
 * - Scalar fields (`columns`, `rowHeight`) — replace the base when set.
 * - `widgetSizes` — shallow merge. Per-widget sizes in the override
 *   replace the base for that slug; un-overridden slugs fall through.
 * - `widgetOrder` — replace the base when set.
 * - `hiddenWidgets` — kept on the result so the renderer can drop
 *   matching slugs from the grid without touching the widget pool
 *   (state survives a viewport flip back).
 *
 * Falsy / `undefined` override fields fall through to the base.
 */
export function applyLayoutOverride(
  base: DashboardLayout,
  override: DashboardLayoutOverride | undefined
): EffectiveDashboardLayout {
  if (!override) {
    return {
      columns: base.columns,
      rowHeight: base.rowHeight,
      widgetSizes: base.widgetSizes ?? {},
      widgetOrder: base.widgetOrder ?? null,
      hiddenWidgets: new Set<string>(),
    };
  }
  return {
    columns: override.columns ?? base.columns,
    rowHeight: override.rowHeight ?? base.rowHeight,
    widgetSizes: { ...base.widgetSizes, ...override.widgetSizes },
    widgetOrder: override.widgetOrder ?? base.widgetOrder ?? null,
    hiddenWidgets: new Set(override.hiddenWidgets ?? []),
  };
}

/**
 * Resolves the effective layout + widget list for the active
 * breakpoint. Composes {@link applyLayoutOverride} with the widget-pool
 * filtering / reordering rules:
 *
 * - `hiddenWidgets` — slugs in the set are dropped from the rendered
 *   list (the widget pool stays intact).
 * - `widgetOrder` — when set, widgets render in that slug order;
 *   widgets not listed are appended in declared `position` order.
 * - `widgetSizes` — per-widget size overrides replace the widget's
 *   declared `size` for the active layout.
 *
 * Returns the original widgets array reference when no overrides apply,
 * so React's `key` semantics + memoization stay stable.
 */
export function resolveEffectiveLayout(
  base: DashboardLayout,
  widgets: readonly WidgetDefinition[],
  breakpoint: DashboardBreakpoint
): { readonly layout: EffectiveDashboardLayout; readonly widgets: readonly WidgetDefinition[] } {
  const override = base.breakpoints?.[breakpoint];
  const layout = applyLayoutOverride(base, override);
  const sized = applyWidgetSizes(widgets, layout.widgetSizes);
  const ordered = applyWidgetOrder(sized, layout.widgetOrder);
  const visible =
    layout.hiddenWidgets.size > 0
      ? ordered.filter((w) => !layout.hiddenWidgets.has(w.slug))
      : ordered;
  return { layout, widgets: visible };
}

/**
 * Effective layout — the resolved combination of base + active-breakpoint
 * override. Differs from {@link DashboardLayout} in two ways:
 *
 * - `widgetSizes` is a non-optional record (empty = no overrides)
 * - `hiddenWidgets` is a Set instead of a list (efficient `.has` lookups)
 * - `breakpoints` is intentionally absent — the effective layout is
 *   already breakpoint-resolved
 */
export interface EffectiveDashboardLayout {
  readonly columns: number;
  readonly rowHeight: number;
  readonly widgetSizes: Readonly<Record<string, WidgetSize>>;
  readonly widgetOrder: readonly string[] | null;
  readonly hiddenWidgets: ReadonlySet<string>;
}

function applyWidgetSizes(
  widgets: readonly WidgetDefinition[],
  sizes: Readonly<Record<string, WidgetSize>>
): readonly WidgetDefinition[] {
  // Avoid allocating a new array when no widget has an override at this
  // breakpoint — preserves React reference equality + memo identity.
  if (Object.keys(sizes).length === 0) return widgets;
  let mutated = false;
  const next = widgets.map((widget) => {
    const override = sizes[widget.slug];
    if (!override) return widget;
    if (override.width === widget.size.width && override.height === widget.size.height) {
      return widget;
    }
    mutated = true;
    return { ...widget, size: override };
  });
  return mutated ? next : widgets;
}

function applyWidgetOrder(
  widgets: readonly WidgetDefinition[],
  order: readonly string[] | null
): readonly WidgetDefinition[] {
  if (!order || order.length === 0) {
    return [...widgets].sort((a, b) => a.position - b.position);
  }
  const bySlug = new Map(widgets.map((w) => [w.slug, w] as const));
  const ordered: WidgetDefinition[] = [];
  for (const slug of order) {
    const widget = bySlug.get(slug);
    if (widget) {
      ordered.push(widget);
      bySlug.delete(slug);
    }
  }
  // Trailing widgets (declared but not in the explicit order) keep their
  // declared `position` order.
  const trailing = [...bySlug.values()].sort((a, b) => a.position - b.position);
  return [...ordered, ...trailing];
}
