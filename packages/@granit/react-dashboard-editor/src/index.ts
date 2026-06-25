// ---------------------------------------------------------------------------
// @granit/react-dashboard-editor — public API
// ---------------------------------------------------------------------------

export { EditableDashboard } from './components/editable-dashboard';
export type { EditableDashboardProps } from './components/editable-dashboard';
export { SortableWidgetCell } from './components/sortable-widget-cell';
export type { SortableWidgetCellProps } from './components/sortable-widget-cell';
export { WidgetPalette } from './components/widget-palette';
export type { WidgetPaletteProps } from './components/widget-palette';
export { WidgetConfigDrawer } from './components/widget-config-drawer';
export type { WidgetConfigDrawerProps } from './components/widget-config-drawer';

// Built-in config forms — re-exported so apps can compose against the
// concrete components (e.g. wrapping MarkdownConfigForm in a Sheet).
export { ImageConfigForm } from './components/forms/image-config-form';
export { MarkdownConfigForm } from './components/forms/markdown-config-form';
export { TextConfigForm } from './components/forms/text-config-form';

// Pure helpers — exported for tests + custom palette / DnD wrappers
export { reorderWidgets } from './lib/reorder-widgets';
export { resizeWidget } from './lib/resize-widget';
export {
  addWidget,
  composeCatalogs,
  defaultWidgetCatalog,
  DEFAULT_MIN_WIDGET_SIZE,
  resolveWidgetMinSize,
} from './lib/widget-catalog';
export type { WidgetCatalogEntry } from './lib/widget-catalog';
export { removeWidget, updateWidget } from './lib/update-widget';
export { defaultWidgetConfigFormRegistry } from './lib/default-widget-config-form-registry';
export { composeWidgetConfigFormRegistries } from './lib/widget-config-form-registry';
export type {
  WidgetConfigForm,
  WidgetConfigFormProps,
  WidgetConfigFormRegistry,
} from './lib/widget-config-form-registry';
