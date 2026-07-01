// ---------------------------------------------------------------------------
// @granit/react-analytics/editor — headless editor building blocks for the
// dashboard composer (B5-C): the widget catalog, the query-field metadata hook
// and required-field validation. Imported only by editor-enabled apps;
// tree-shaken away for read-only consumers.
//
// The shadcn-styled config forms and query-binding controls live in
// @granit/react-ui-analytics (the react-ui tier) — this package stays
// react-ui-free.
// ---------------------------------------------------------------------------

export { analyticsWidgetCatalog } from './analytics-widget-catalog';
// Headless query-field metadata — the catalogue + column-metadata resolution the
// config forms (in @granit/react-ui-analytics) and the map widget form render.
export { useQueryFieldMetadata } from './use-query-field-metadata';
export type { FieldOption, QueryFieldMetadata } from './use-query-field-metadata';
// Required-field validation so a host can gate Save on a complete config.
export { isWidgetConfigComplete, validateWidgetConfig } from './validate-widget';
export type { WidgetConfigError } from './validate-widget';
