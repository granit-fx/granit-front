import { WIDGET_SIZE } from '@granit/dashboards';

import type { WidgetDefinition, WidgetDefinitionBase, WidgetSize } from '@granit/dashboards';

/**
 * Descriptor an editor uses to surface "add widget" buttons in a
 * {@link WidgetPalette}. One entry per widget kind the host app exposes —
 * downstream packages contribute their own (analytics ships entries for
 * `kpi` / `chart` / `table` / `pivot` / `map`, etc.).
 *
 * Stays parallel to the read-mode `WidgetRegistry`: the registry maps
 * `type` → renderer, the catalog maps `type` → "how to add a fresh one".
 * Same composition pattern via {@link composeCatalogs}.
 */
export interface WidgetCatalogEntry {
  /** Widget discriminator — must match a renderer registered for the same kind. */
  readonly type: string;
  /**
   * Localization key resolving to the human-facing label shown on the
   * palette button. Apps that ship a label without going through i18n can
   * pass the literal label here — {@link WidgetPalette} renders it
   * verbatim.
   */
  readonly labelLocalizationKey: string;
  /**
   * Optional icon descriptor — opaque to the editor. Apps render their
   * own icon based on this key (e.g. lucide-react names, asset paths).
   * `null` / missing = no icon, label-only button.
   */
  readonly iconKey?: string | null;
  /** Grid size assigned to a freshly added widget. */
  readonly defaultSize: WidgetSize;
  /**
   * Smallest size a user may shrink this widget to via the editor's
   * drag-resize handle. Prevents collapsing a tile below the space its
   * content needs (e.g. a KPI clipping its value in a 1-row cell).
   * Falls back to {@link DEFAULT_MIN_WIDGET_SIZE} when omitted. Must be
   * `<= defaultSize` on both axes so a freshly added widget is never born
   * below its own floor.
   */
  readonly minSize?: WidgetSize;
  /**
   * Factory producing a fresh widget for this kind. Receives the slug +
   * position {@link addWidget} computed for it; the factory fills in the
   * kind-specific fields (content localization key, source URL, query
   * name, etc.).
   *
   * Return type is the open `WidgetDefinitionBase` rather than the closed
   * {@link WidgetDefinition} union so downstream packages can return
   * their concrete definitions (`KpiWidgetDefinition`,
   * `ChartWidgetDefinition`, etc.) without an unchecked cast — those
   * extend the base but don't satisfy the open
   * `Readonly<Record<string, unknown>>` half of the framework union.
   *
   * Factories should NOT pre-generate `slug` / `position` themselves —
   * those two fields are owned by {@link addWidget} so unique-slug
   * generation stays centralized.
   */
  readonly createDefaultWidget: (slug: string, position: number) => WidgetDefinitionBase;
}

/**
 * Floor applied to widgets whose catalog entry (or whose type) declares no
 * explicit {@link WidgetCatalogEntry.minSize}. `1x1` keeps the historical
 * behaviour — only widgets that opt into a larger minimum get a tighter
 * clamp, so existing callers without a catalog see no change.
 */
export const DEFAULT_MIN_WIDGET_SIZE: WidgetSize = Object.freeze({ width: 1, height: 1 });

/**
 * Resolves the minimum resize size for a widget `type` from a catalog.
 * Returns the matching entry's {@link WidgetCatalogEntry.minSize}, else
 * {@link DEFAULT_MIN_WIDGET_SIZE}. Used by `<EditableDashboard>` to clamp
 * drag-resize gestures per widget kind.
 */
export function resolveWidgetMinSize(
  catalog: readonly WidgetCatalogEntry[] | undefined,
  type: string
): WidgetSize {
  const entry = catalog?.find((candidate) => candidate.type === type);
  return entry?.minSize ?? DEFAULT_MIN_WIDGET_SIZE;
}

/**
 * Merges any number of catalog arrays. Later entries override earlier ones
 * on `type` collision — same precedence rule as
 * `composeRegistries(...registries)` for renderers, so an app importing
 * `defaultWidgetCatalog` and adding a custom Markdown variant wins by
 * passing its own catalog last.
 *
 * Returns a frozen array so consumers can safely pass the result through
 * to React props without `useMemo` defensive copies.
 */
export function composeCatalogs(
  ...catalogs: readonly (readonly WidgetCatalogEntry[])[]
): readonly WidgetCatalogEntry[] {
  const byType = new Map<string, WidgetCatalogEntry>();
  for (const catalog of catalogs) {
    for (const entry of catalog) {
      byType.set(entry.type, entry);
    }
  }
  return Object.freeze([...byType.values()]);
}

/**
 * Slug-uniqueness helper. Backend constraint: a dashboard's widgets all
 * carry distinct `slug`s (composes the localization key, primary key in
 * the `WidgetInstance` table). The editor mints one by suffixing the
 * lowest free integer to a PascalCase prefix derived from the catalog
 * entry's `type`.
 *
 * Examples (existing slugs in parens):
 * - `markdown` → `Markdown1` (none) / `Markdown2` (`Markdown1` exists)
 * - `kpi` → `Kpi1`
 */
export function nextUniqueSlug(type: string, existing: ReadonlySet<string>): string {
  const prefix = type.charAt(0).toUpperCase() + type.slice(1);
  for (let i = 1; ; i++) {
    const candidate = `${prefix}${i}`;
    if (!existing.has(candidate)) return candidate;
  }
}

/**
 * Pure helper: returns a new {@link import('@granit/dashboards').DashboardDefinition}
 * with one additional widget produced by `entry.createDefaultWidget`. The
 * new widget gets:
 *
 * - A slug minted via {@link nextUniqueSlug} so it doesn't clash with
 *   existing ones.
 * - `position` = `widgets.length` — appended to the end of the dense rank.
 * - `size` = `entry.defaultSize` (the factory's `size` is overridden so
 *   apps can't accidentally desync it from the catalog default).
 *
 * Stays decoupled from React so tests + custom palette wrappers can
 * compose it without rendering.
 */
export function addWidget<TDefinition extends { readonly widgets: readonly WidgetDefinition[] }>(
  definition: TDefinition,
  entry: WidgetCatalogEntry
): TDefinition {
  const existingSlugs = new Set(definition.widgets.map((w) => w.slug));
  const slug = nextUniqueSlug(entry.type, existingSlugs);
  const position = definition.widgets.length;
  const created = entry.createDefaultWidget(slug, position);
  // Cast to the open `WidgetDefinition` union after stamping the
  // editor-owned fields (slug / position / size). Downstream factories
  // return concrete `WidgetDefinitionBase` extensions which don't satisfy
  // the union's open `Record<string, unknown>` half, but are still valid
  // wire shapes — the runtime contract is enforced by the renderer
  // registry, not the type.
  const widget = {
    ...created,
    slug,
    position,
    size: entry.defaultSize,
  } as WidgetDefinition;
  return { ...definition, widgets: [...definition.widgets, widget] };
}

/**
 * Catalog of every widget kind the framework itself ships (markdown / text
 * / image). Downstream packages compose their own entries on top via
 * {@link composeCatalogs}.
 *
 * Default sizes match the conventional pairings from {@link WIDGET_SIZE}:
 * - markdown → `FULL_WIDTH_ROW` (banners)
 * - text → `SMALL_KPI` proportions (3×1) — tighter than markdown
 * - image → `MEDIA_TILE` (4×4 logo tile)
 *
 * The `*LocalizationKey` defaults follow the convention
 * `Widget:{DashboardName}.{Slug}` — apps fill the actual content via i18n
 * entries keyed off the freshly minted slug.
 */
export const defaultWidgetCatalog: readonly WidgetCatalogEntry[] = Object.freeze([
  {
    type: 'markdown',
    labelLocalizationKey: 'Dashboard:Widget.Markdown.Label',
    iconKey: 'markdown',
    defaultSize: WIDGET_SIZE.FULL_WIDTH_ROW,
    minSize: { width: 2, height: 1 },
    createDefaultWidget: (slug, position) => ({
      slug,
      type: 'markdown',
      position,
      size: WIDGET_SIZE.FULL_WIDTH_ROW,
      contentLocalizationKey: `Widget:${slug}.Content`,
    }),
  },
  {
    type: 'text',
    labelLocalizationKey: 'Dashboard:Widget.Text.Label',
    iconKey: 'text',
    defaultSize: { width: 3, height: 1 },
    minSize: { width: 2, height: 1 },
    createDefaultWidget: (slug, position) => ({
      slug,
      type: 'text',
      position,
      size: { width: 3, height: 1 },
      contentLocalizationKey: `Widget:${slug}.Content`,
      style: 'Body',
    }),
  },
  {
    type: 'image',
    labelLocalizationKey: 'Dashboard:Widget.Image.Label',
    iconKey: 'image',
    defaultSize: WIDGET_SIZE.MEDIA_TILE,
    minSize: { width: 2, height: 2 },
    createDefaultWidget: (slug, position) => ({
      slug,
      type: 'image',
      position,
      size: WIDGET_SIZE.MEDIA_TILE,
      source: '',
      altLocalizationKey: `Widget:${slug}.Alt`,
      fit: 'Contain',
    }),
  },
]);
