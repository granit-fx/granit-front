// ---------------------------------------------------------------------------
// @granit/react-dashboard-editor — public API
// ---------------------------------------------------------------------------

export { EditableDashboard } from './components/editable-dashboard.js';
export type { EditableDashboardProps } from './components/editable-dashboard.js';
export { SortableWidgetCell } from './components/sortable-widget-cell.js';
export type { SortableWidgetCellProps } from './components/sortable-widget-cell.js';
export { WidgetPalette } from './components/widget-palette.js';
export type { WidgetPaletteProps } from './components/widget-palette.js';

// Pure helpers — exported for tests + custom palette / DnD wrappers
export { reorderWidgets } from './lib/reorder-widgets.js';
export { addWidget, composeCatalogs, defaultWidgetCatalog } from './lib/widget-catalog.js';
export type { WidgetCatalogEntry } from './lib/widget-catalog.js';
