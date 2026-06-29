import type { DashboardTimeWindow } from './dashboard-time-window';
import type { WidgetAction } from './widget-action';
import type { WidgetSize } from './widget-size';

/**
 * Common shape every widget definition shares. Mirrors
 * `Granit.Dashboards.WidgetDefinition` (abstract record). Concrete widget
 * variants extend this with their kind-specific configuration; downstream
 * packages register their own renderers via the `WidgetRegistry`.
 *
 * The `type` discriminator is the JSON polymorphism marker exposed by the
 * backend's `[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]`
 * attribute (P1.1).
 */
export interface WidgetDefinitionBase {
  /**
   * Widget-local identifier (PascalCase, unique within the dashboard).
   * Composes the localization key `Widget:{DashboardName}.{Slug}` for the
   * widget's display content, and stays stable across reorder operations.
   */
  readonly slug: string;
  /** JSON discriminator. Built-ins: `markdown` | `image` | `text`. */
  readonly type: string;
  /**
   * Grid column of the widget's top-left cell (0-based). Optional on
   * hand-authored definitions (catalog previews / fixtures); the editor
   * populates it from the persisted layout or on placement. Round-trips to
   * the wire `x` field.
   */
  readonly x?: number;
  /** Grid row of the widget's top-left cell (0-based). See {@link x}. */
  readonly y?: number;
  /** Width / height in grid cells. */
  readonly size: WidgetSize;
  /**
   * Optional override of the permission gating this widget at render time.
   * When omitted, the runtime resolves the effective permission from the
   * underlying data source (metric / query / IoT topic). Presentation-only
   * widgets ignore this field.
   */
  readonly requiredPermission?: string;
  /**
   * Optional override of the dashboard-wide
   * {@link DashboardDefinition.defaultTimeWindow} for this widget specifically.
   * Useful when (a) the widget is rendered standalone outside a dashboard
   * (e.g. a KPI tile above an invoice list — no surrounding dashboard
   * context), or (b) the widget needs a different range than its peers
   * (e.g. a year-to-date KPI next to last-30-days widgets). P1.3.
   * Presentation-only widgets ignore this field.
   */
  readonly timeWindowOverride?: DashboardTimeWindow;
  /**
   * Declarative click-handler descriptors. Each {@link WidgetAction} binds a
   * trigger to a typed dispatch kind plus an optional param map. The frontend
   * dispatches them — no code injection, no expression evaluation. P1.5.
   * `null` or missing = the widget has no actions wired.
   */
  readonly actions?: readonly WidgetAction[] | null;
  /**
   * The widget's persisted title localization key, carried verbatim from
   * {@link WidgetInstanceResponse.titleLocalizationKey} when a definition is
   * bridged from a stored dashboard. Lets the editor resolve the *actual*
   * title the backend stored (e.g. `Widget:{Dashboard}.{Slug}`) rather than
   * recomposing a convention that may not match. Omitted for hand-authored
   * definitions (catalog previews / fixtures), where the renderer falls back
   * to the composed `Widget:{Dashboard}.{Slug}.Title` convention.
   */
  readonly titleLocalizationKey?: string;
}

/**
 * Renders Markdown content. The content lives behind a localization key
 * resolved at render time via `useTranslation()` — this gives multi-tenant
 * i18n + per-tenant overrides for free.
 */
export interface MarkdownWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'markdown';
  /** Localization key resolving to the Markdown body. */
  readonly contentLocalizationKey: string;
}

/**
 * How an {@link ImageWidgetDefinition} fills its grid cell. Mirrors
 * `Granit.Dashboards.Widgets.ImageFit`. PascalCase wire values — backend's
 * host registers a `JsonStringEnumConverter()` with no naming policy.
 */
export type ImageFit =
  /** Preserve aspect ratio, letterbox to fit. Right for logos. */
  | 'Contain'
  /** Fill the cell, crop to maintain aspect. Right for banner photos. */
  | 'Cover'
  /** Stretch to fill (rarely correct — distorts the image). */
  | 'Fill';

/** Renders a static image — typically a logo or visual divider. */
export interface ImageWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'image';
  /** URL or blob reference (`blob:logo-banner`, `https://cdn...`). */
  readonly source: string;
  /** Localization key for the alt text (accessibility). */
  readonly altLocalizationKey: string;
  /**
   * How the image fills its grid cell. Backend default is `'Contain'`
   * (preserves aspect, letterboxes); fixtures that omit it are accepted.
   */
  readonly fit?: ImageFit;
}

/**
 * Visual style hint for `TextWidgetDefinition`. Mirrors
 * `Granit.Dashboards.Widgets.TextStyle`. PascalCase wire values — the
 * framework's host registers a `JsonStringEnumConverter()` with no naming
 * policy.
 */
export type TextWidgetStyle = 'Body' | 'Heading' | 'Subheading' | 'Caption';

/**
 * Plain text tile — short label or heading without markdown formatting.
 * Lighter alternative to `MarkdownWidgetDefinition` for stable interface
 * labels (page titles, section headers).
 */
export interface TextWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'text';
  readonly contentLocalizationKey: string;
  readonly style: TextWidgetStyle;
}

/**
 * Closed union of every widget type the framework itself knows how to render.
 * Downstream packages add their own variants and feed them through the
 * generic {@link WidgetDefinition} below.
 */
export type FrameworkWidgetDefinition =
  MarkdownWidgetDefinition | ImageWidgetDefinition | TextWidgetDefinition;

/**
 * Open-ended widget definition — accepts any `type` string plus the
 * common base fields. Downstream packages (`@granit/analytics`,
 * `@granit/iot`, …) ship their own `extends WidgetDefinitionBase`
 * interfaces and feed them through this generic alias so the framework
 * treats every widget uniformly until a registered renderer narrows on
 * the `type` discriminator.
 *
 * The fallback alternative is `WidgetDefinitionBase` directly — not
 * `WidgetDefinitionBase & Readonly<Record<string, unknown>>`. The
 * intersection with an index signature was meant to encode "you may
 * have extra fields", but typed interfaces don't structurally satisfy
 * `Record<string, unknown>` (no implicit index signatures), so it
 * rejected every concrete extension. The framework never reads extra
 * fields by index — registered renderers narrow on `type` and access
 * their own typed fields.
 */
export type WidgetDefinition = FrameworkWidgetDefinition | WidgetDefinitionBase;
