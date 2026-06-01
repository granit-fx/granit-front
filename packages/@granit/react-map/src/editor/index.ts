// ---------------------------------------------------------------------------
// @granit/react-map/editor — catalog + config form for the dashboard
// composer (B5-C). Imported only by editor-enabled apps; tree-shaken away
// for read-only consumers.
// ---------------------------------------------------------------------------

import { MapConfigForm } from './map-config-form';

import type { WidgetConfigForm, WidgetConfigFormRegistry } from '@granit/react-dashboard-editor';

export { mapWidgetCatalog } from './map-widget-catalog';
export { MapConfigForm } from './map-config-form';

/**
 * Pre-composed config-form registry — the map kind in a single registry
 * shaped to drop straight into
 * `composeWidgetConfigFormRegistries(default, analytics, mapWidgetConfigFormRegistry)`.
 *
 * Cast routes through `unknown` because TypeScript can't relate the
 * narrow `MapWidgetDefinition` to the open `WidgetDefinition` union the
 * registry's value type uses — same pattern as the analytics registry.
 */
export const mapWidgetConfigFormRegistry: WidgetConfigFormRegistry = Object.freeze({
  map: MapConfigForm as unknown as WidgetConfigForm,
});
