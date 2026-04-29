// ---------------------------------------------------------------------------
// @granit/react-dashboard-editor — public API
// ---------------------------------------------------------------------------

export { EditableDashboard } from './components/editable-dashboard.js';
export type { EditableDashboardProps } from './components/editable-dashboard.js';
export { SortableWidgetCell } from './components/sortable-widget-cell.js';
export type { SortableWidgetCellProps } from './components/sortable-widget-cell.js';

// Pure helpers — exported for tests + custom DnD wrappers
export { reorderWidgets } from './lib/reorder-widgets.js';
