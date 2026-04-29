// ---------------------------------------------------------------------------
// @granit/react-dashboard-editor — public API
// ---------------------------------------------------------------------------

export { EditableDashboard } from './components/editable-dashboard.js';
export type { EditableDashboardProps } from './components/editable-dashboard.js';
export { SortableWidgetCell } from './components/sortable-widget-cell.js';
export type { SortableWidgetCellProps } from './components/sortable-widget-cell.js';
export { WidgetPalette } from './components/widget-palette.js';
export type { WidgetPaletteProps } from './components/widget-palette.js';
export { WidgetConfigDrawer } from './components/widget-config-drawer.js';
export type { WidgetConfigDrawerProps } from './components/widget-config-drawer.js';

// Built-in config forms — re-exported so apps can compose against the
// concrete components (e.g. wrapping MarkdownConfigForm in a Sheet).
export { ImageConfigForm } from './components/forms/image-config-form.js';
export { MarkdownConfigForm } from './components/forms/markdown-config-form.js';
export { TextConfigForm } from './components/forms/text-config-form.js';

// Pure helpers — exported for tests + custom palette / DnD wrappers
export { reorderWidgets } from './lib/reorder-widgets.js';
export { addWidget, composeCatalogs, defaultWidgetCatalog } from './lib/widget-catalog.js';
export type { WidgetCatalogEntry } from './lib/widget-catalog.js';
export { removeWidget, updateWidget } from './lib/update-widget.js';
export { defaultWidgetConfigFormRegistry } from './lib/default-widget-config-form-registry.js';
export { composeWidgetConfigFormRegistries } from './lib/widget-config-form-registry.js';
export type {
  WidgetConfigForm,
  WidgetConfigFormProps,
  WidgetConfigFormRegistry,
} from './lib/widget-config-form-registry.js';
