// ---------------------------------------------------------------------------
// Lifecycle / persistence DTOs (B4-write — Granit.Dashboards.Endpoints).
// Distinct from `../rendering/` which carries the bundle envelope shapes
// for the render pipeline.
// ---------------------------------------------------------------------------

export type { DashboardCatalogEntryResponse } from './dashboard-catalog-entry-response.js';
export type { DashboardDetailResponse } from './dashboard-detail-response.js';
export type { DashboardImportResponse } from './dashboard-import-response.js';
export type { DashboardMetadataUpdateRequest } from './dashboard-metadata-update-request.js';
export type { DashboardStatus } from './dashboard-status.js';
export type { DashboardSummaryResponse } from './dashboard-summary-response.js';
export type { PagedResponse } from './paged-response.js';
export type { WidgetInstanceResponse } from './widget-instance-response.js';
export type { AddWidgetRequest, UpdateWidgetRequest } from './widget-requests.js';

// Bridge: persistence ↔ definition
export {
  STRUCTURAL_WIDGET_FIELDS,
  dashboardDetailToDefinition,
  diffDashboardWidgets,
  extractSlugFromTitleKey,
  widgetDefinitionToAddRequest,
  widgetDefinitionToUpdateRequest,
  widgetInstanceToDefinition,
} from './widget-bridge.js';
export type { DashboardWidgetDiff } from './widget-bridge.js';

// Drift detection (ADR-038) — compares persisted instance's source
// version against the catalog's current version.
export { detectVersionDrift } from './detect-version-drift.js';
export type { DashboardVersionDrift } from './detect-version-drift.js';
