import type { DashboardTimeWindow } from './dashboard-time-window.js';
import type { WidgetAction } from './widget-action.js';
import type { WidgetSize } from './widget-size.js';

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
  /** Dense-ranked grid order — 0-based, contiguous within the dashboard. */
  readonly position: number;
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
  | MarkdownWidgetDefinition
  | ImageWidgetDefinition
  | TextWidgetDefinition;

/**
 * Open-ended widget definition — accepts any `type` string plus arbitrary
 * extra fields. This is what dashboard payloads are typed as on the wire
 * (a host can persist Analytics widgets, IoT widgets, etc., and the framework
 * treats them uniformly until a registered renderer is found for the `type`).
 */
export type WidgetDefinition =
  | FrameworkWidgetDefinition
  | (WidgetDefinitionBase & Readonly<Record<string, unknown>>);
