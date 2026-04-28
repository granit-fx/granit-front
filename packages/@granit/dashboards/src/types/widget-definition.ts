/**
 * Common shape every widget definition shares — what's needed by the renderer
 * to dispatch and identify the widget regardless of its content.
 *
 * Specific widget definitions extend this with their own payload (a Markdown
 * widget carries `content`, an Image widget carries `src`, an Analytics KPI
 * carries `metric` + `period`, etc.).
 *
 * The `type` discriminator is a string rather than a closed enum so packages
 * downstream of `@granit/dashboards` (analytics, IoT, custom apps) can register
 * their own widget types without modifying the framework's union.
 */
export interface WidgetDefinitionBase {
  /** Stable identifier — referenced by `DashboardLayoutItem.widgetId`. */
  readonly id: string;
  /** Discriminator. Built-ins: `markdown` | `image` | `text`. Extensions add their own. */
  readonly type: string;
  /** Optional title rendered above the widget body by `<WidgetCard>`. */
  readonly title?: string;
}

/**
 * Renders Markdown content. The framework ships a minimal pre-formatted
 * fallback renderer; consuming apps can register a richer renderer (e.g.
 * react-markdown with custom remark plugins) via the {@link WidgetRegistry}.
 */
export interface MarkdownWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'markdown';
  readonly content: string;
}

/** Renders a static image — typically a logo or visual divider. */
export interface ImageWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'image';
  readonly src: string;
  readonly alt?: string;
  /** CSS object-fit value. Defaults to `'contain'`. */
  readonly fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/** Renders a single block of plain text. Whitespace is preserved. */
export interface TextWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'text';
  readonly content: string;
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
 * Open-ended widget definition — accepts any `type` string plus arbitrary extra
 * fields. This is what dashboard payloads are typed as on the wire (a host can
 * persist Analytics widgets, IoT widgets, etc., and the framework treats them
 * uniformly until a registered renderer is found for the `type`).
 */
export type WidgetDefinition =
  | FrameworkWidgetDefinition
  | (WidgetDefinitionBase & Readonly<Record<string, unknown>>);
