// ---------------------------------------------------------------------------
// Bridge: persisted-instance shape ↔ declarative-definition shape
// ---------------------------------------------------------------------------
//
// The framework ships two views of a widget that share fields but diverge
// on shape:
//
// - `WidgetInstanceResponse` (persistence) — id-keyed, structural fields
//   first-class (id / widgetType / position / width / height /
//   titleLocalizationKey + denormalized metricName / queryName), kind-
//   specific fields packed into a `configJson` string.
//
// - `WidgetDefinition` (declaration / editor) — slug-keyed, kind-specific
//   fields surfaced as typed top-level properties (e.g.
//   `MarkdownWidgetDefinition.contentLocalizationKey`,
//   `KpiWidgetDefinition.datasource`).
//
// The editor primitives (`<EditableDashboard>`, `<WidgetConfigDrawer>`,
// `addWidget` / `updateWidget` helpers) all consume `WidgetDefinition`.
// The CRUD endpoints expect `AddWidgetRequest` / `UpdateWidgetRequest`
// shaped against the persistence view. This module is the round-trip
// bridge between the two — pure data transformation, no React deps.

import type { DashboardDetailResponse } from './dashboard-detail-response';
import type { AddWidgetRequest, UpdateWidgetRequest, WidgetInstanceResponse } from './index';
import type { DashboardDefinition, WidgetDefinition, WidgetDefinitionBase } from '../types/index';

/**
 * The five structural fields that live outside `configJson` because the
 * backend either denormalizes them for indexing or lifts them onto
 * persistence-level columns. Everything else inside a {@link WidgetDefinition}
 * is round-tripped through `configJson`.
 *
 * Exported as a constant so consumers building custom serializers stay
 * in sync with the bridge's contract.
 */
export const STRUCTURAL_WIDGET_FIELDS = Object.freeze([
  'slug',
  'type',
  'position',
  'size',
  'requiredPermission',
] as const);

/**
 * Backend convention: `Widget:{DashboardName}.{Slug}`. Used in both
 * directions — read extracts slug from this shape, write composes it.
 */
function composeTitleLocalizationKey(dashboardName: string, slug: string): string {
  return `Widget:${dashboardName}.${slug}`;
}

/**
 * Extracts the slug from a {@link WidgetInstanceResponse.titleLocalizationKey}.
 * Handles the `Widget:{DashboardName}.{Slug}` convention; falls back to
 * the suffix after the last `.` for ad-hoc keys that don't match (which
 * the backend permits but the framework discourages).
 */
export function extractSlugFromTitleKey(
  titleLocalizationKey: string,
  dashboardName: string
): string {
  const prefix = `Widget:${dashboardName}.`;
  if (titleLocalizationKey.startsWith(prefix)) {
    return titleLocalizationKey.slice(prefix.length);
  }
  const lastDot = titleLocalizationKey.lastIndexOf('.');
  return lastDot === -1 ? titleLocalizationKey : titleLocalizationKey.slice(lastDot + 1);
}

/**
 * Pulls the denormalized `metricName` / `queryName` off a {@link WidgetDefinition}
 * for the persistence-level columns. Reads from the kind-specific fields:
 *
 * - KPI: `datasource.metricName` (when `kind === 'metric'`) or
 *   `datasource.queryName` (when `kind === 'query-aggregate'`)
 * - Chart / Table / Pivot / Map: top-level `queryName`
 * - Markdown / Image / Text: both `null`
 *
 * The backend keeps this index even though the same data lives inside
 * `configJson` — letting it filter / sort dashboards by their bound
 * metric / query without parsing every config blob.
 */
function denormalizeReferences(widget: WidgetDefinitionBase): {
  metricName: string | null;
  queryName: string | null;
} {
  const w = widget as unknown as Readonly<Record<string, unknown>>;
  if (widget.type === 'kpi') {
    const datasource = w['datasource'] as
      | { kind?: string; metricName?: string; queryName?: string }
      | undefined;
    if (datasource?.kind === 'metric') {
      return { metricName: datasource.metricName ?? null, queryName: null };
    }
    if (datasource?.kind === 'query-aggregate') {
      return { metricName: null, queryName: datasource.queryName ?? null };
    }
    return { metricName: null, queryName: null };
  }
  // Chart / Table / Pivot / Map all expose `queryName` at the top level.
  const queryName = typeof w['queryName'] === 'string' ? w['queryName'] : null;
  return { metricName: null, queryName };
}

/**
 * Strips the structural fields from a widget definition and serializes
 * the remainder to JSON. Round-trip-safe: `configJsonToWidgetFields`
 * undoes this exactly when paired with the same structural fields.
 *
 * KPI is special-cased: its `configJson` is the *bare* polymorphic
 * {@link Datasource} (matching the backend's `JsonSerializer.Serialize<Datasource>`),
 * not the generic strip-structural-fields blob. KPI `actions` are intentionally
 * not persisted — there's no server-side Actions column for KPI and the bare
 * datasource has no room for them, so they don't round-trip. If KPI action
 * persistence is wanted, that's a separate story.
 */
function widgetFieldsToConfigJson(widget: WidgetDefinitionBase): string {
  if (widget.type === 'kpi') {
    const datasource = (widget as unknown as { datasource?: unknown }).datasource;
    return JSON.stringify(datasource ?? null);
  }
  const config: Record<string, unknown> = {};
  const w = widget as unknown as Readonly<Record<string, unknown>>;
  for (const key of Object.keys(w)) {
    if ((STRUCTURAL_WIDGET_FIELDS as readonly string[]).includes(key)) continue;
    config[key] = w[key];
  }
  return JSON.stringify(config);
}

/**
 * Inverse of {@link widgetFieldsToConfigJson}. Parses the JSON blob and
 * re-merges with the structural fields the persistence view kept
 * separate. Returns `null` if the JSON is malformed — callers fall back
 * to a placeholder rather than crashing the editor.
 */
function configJsonToWidgetFields(configJson: string): Readonly<Record<string, unknown>> | null {
  try {
    const parsed = JSON.parse(configJson) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Readonly<Record<string, unknown>>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Read direction: persistence → editor
// ---------------------------------------------------------------------------

/**
 * Lifts a single {@link WidgetInstanceResponse} into a {@link WidgetDefinition}
 * suitable for the editor primitives. `dashboardName` is taken from the
 * parent {@link DashboardDetailResponse.name} and used to extract the slug
 * from `titleLocalizationKey`.
 *
 * Robust to malformed `configJson`: returns a minimal widget shape
 * (slug + type + position + size) when the JSON can't be parsed.
 */
export function widgetInstanceToDefinition(
  instance: WidgetInstanceResponse,
  dashboardName: string
): WidgetDefinition {
  const slug = extractSlugFromTitleKey(instance.titleLocalizationKey, dashboardName);
  const parsed = configJsonToWidgetFields(instance.configJson) ?? {};
  // A KPI persists its `configJson` as the *bare* polymorphic `Datasource`
  // (backend: `JsonSerializer.Serialize<Datasource>(k.Datasource)` →
  // `{"kind":"metric","metricName":"…"}`), not a strip-structural-fields blob.
  // Lift it under the `datasource` key the editor's `KpiWidgetDefinition`
  // expects instead of spreading it flat — a flat spread leaves
  // `widget.datasource` undefined and crashes `<KpiTile>`. KPI `actions` are
  // not part of `configJson` (no server-side Actions column for KPI), so they
  // don't round-trip through detail/edit — consistent with the backend.
  const fields = instance.widgetType === 'Kpi' ? { datasource: parsed } : parsed;
  const widget: WidgetDefinitionBase & Readonly<Record<string, unknown>> = {
    ...fields,
    slug,
    // PascalCase widgetType → lowercase definition `type` discriminator.
    type: instance.widgetType.charAt(0).toLowerCase() + instance.widgetType.slice(1),
    position: instance.position,
    size: { width: instance.width, height: instance.height },
    ...(instance.requiredPermission === null
      ? undefined
      : { requiredPermission: instance.requiredPermission }),
  };
  return widget;
}

/**
 * Lifts a full {@link DashboardDetailResponse} into a {@link DashboardDefinition}
 * the editor primitives can consume.
 *
 * `category`, `version` and `isSystem` are copied straight through.
 * Layout reconstructs `columns` / `rowHeight` from the flattened
 * `layoutColumns` / `layoutRowHeight` fields the persistence view
 * exposes — responsive overrides (`widgetSizes`, `breakpoints`, etc.)
 * are not yet round-tripped because the persistence view only carries
 * the base values.
 */
export function dashboardDetailToDefinition(detail: DashboardDetailResponse): DashboardDefinition {
  return {
    name: detail.name,
    category: detail.category,
    isSystem: detail.isSystem,
    version: detail.sourceDefinitionVersion ?? '1.0.0',
    layout: { columns: detail.layoutColumns, rowHeight: detail.layoutRowHeight },
    widgets: detail.widgets.map((w) => widgetInstanceToDefinition(w, detail.name)),
  };
}

// ---------------------------------------------------------------------------
// Write direction: editor → persistence
// ---------------------------------------------------------------------------

/**
 * Serializes a {@link WidgetDefinition} into the {@link AddWidgetRequest}
 * shape expected by `POST /dashboards/{id}/widgets`. The dashboard's
 * name is required so the helper can compose the canonical
 * `titleLocalizationKey`.
 *
 * `widgetType` is the PascalCase form of the definition's lowercase
 * `type` discriminator. `metricName` / `queryName` are pulled off the
 * kind-specific fields per {@link denormalizeReferences}.
 */
export function widgetDefinitionToAddRequest(
  widget: WidgetDefinitionBase,
  dashboardName: string
): AddWidgetRequest {
  const { metricName, queryName } = denormalizeReferences(widget);
  return {
    widgetType: widget.type.charAt(0).toUpperCase() + widget.type.slice(1),
    position: widget.position,
    width: widget.size.width,
    height: widget.size.height,
    titleLocalizationKey: composeTitleLocalizationKey(dashboardName, widget.slug),
    configJson: widgetFieldsToConfigJson(widget),
    metricName,
    queryName,
    requiredPermission: widget.requiredPermission ?? null,
  };
}

/**
 * Serializes a {@link WidgetDefinition} into the {@link UpdateWidgetRequest}
 * shape expected by `PUT /dashboards/{id}/widgets/{widgetId}`.
 *
 * `widgetType` / `metricName` / `queryName` / `requiredPermission` are
 * intentionally absent — the backend treats kind-switching and
 * metric/query rebinding as delete + add, not edit.
 */
export function widgetDefinitionToUpdateRequest(
  widget: WidgetDefinitionBase,
  dashboardName: string
): UpdateWidgetRequest {
  return {
    position: widget.position,
    width: widget.size.width,
    height: widget.size.height,
    titleLocalizationKey: composeTitleLocalizationKey(dashboardName, widget.slug),
    configJson: widgetFieldsToConfigJson(widget),
  };
}

// ---------------------------------------------------------------------------
// Diff: editor state → ordered CRUD operations
// ---------------------------------------------------------------------------

/**
 * Operations a {@link diffDashboardWidgets} run produces. Apply in the
 * order: removed → added → updated. Removing first frees position
 * slots; adding next mints fresh ids; updating last persists the
 * surviving widgets' final state.
 *
 * Slug is the editor's stable identity — server widgets are matched
 * back to their slug via {@link extractSlugFromTitleKey}.
 */
export interface DashboardWidgetDiff {
  /** Widgets present locally but not on the server — emit as `useAddWidget` calls. */
  readonly added: readonly { readonly slug: string; readonly request: AddWidgetRequest }[];
  /** Widgets present on both sides whose persistence shape differs — emit as `useUpdateWidget` calls. */
  readonly updated: readonly {
    readonly slug: string;
    readonly widgetId: string;
    readonly request: UpdateWidgetRequest;
  }[];
  /** Widgets present on the server but missing locally — emit as `useRemoveWidget` calls. */
  readonly removed: readonly { readonly slug: string; readonly widgetId: string }[];
}

/**
 * Diffs the local (editor) and server (persistence) widget pools and
 * produces the ordered set of CRUD operations needed to sync the server
 * with the local state.
 *
 * Matching is by slug. A widget is considered "updated" when any of its
 * `position` / `width` / `height` / `titleLocalizationKey` /
 * `configJson` projections differ from the server snapshot — same five
 * fields the backend's `UpdateWidgetRequest` carries.
 *
 * No-ops are filtered out — a widget whose local + server state match
 * exactly produces zero operations.
 */
export function diffDashboardWidgets(
  serverWidgets: readonly WidgetInstanceResponse[],
  localWidgets: readonly WidgetDefinitionBase[],
  dashboardName: string
): DashboardWidgetDiff {
  const serverBySlug = new Map<string, WidgetInstanceResponse>();
  for (const instance of serverWidgets) {
    serverBySlug.set(
      extractSlugFromTitleKey(instance.titleLocalizationKey, dashboardName),
      instance
    );
  }
  const localSlugs = new Set(localWidgets.map((w) => w.slug));

  const added: { slug: string; request: AddWidgetRequest }[] = [];
  const updated: { slug: string; widgetId: string; request: UpdateWidgetRequest }[] = [];

  for (const local of localWidgets) {
    const server = serverBySlug.get(local.slug);
    if (!server) {
      added.push({ slug: local.slug, request: widgetDefinitionToAddRequest(local, dashboardName) });
      continue;
    }
    const request = widgetDefinitionToUpdateRequest(local, dashboardName);
    if (
      request.position !== server.position ||
      request.width !== server.width ||
      request.height !== server.height ||
      request.titleLocalizationKey !== server.titleLocalizationKey ||
      request.configJson !== server.configJson
    ) {
      updated.push({ slug: local.slug, widgetId: server.id, request });
    }
  }

  const removed: { slug: string; widgetId: string }[] = [];
  for (const [slug, server] of serverBySlug) {
    if (!localSlugs.has(slug)) {
      removed.push({ slug, widgetId: server.id });
    }
  }

  return { added, updated, removed };
}
