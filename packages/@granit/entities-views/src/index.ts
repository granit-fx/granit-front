// ---------------------------------------------------------------------------
// @granit/entities-views — public API (framework-agnostic)
// ---------------------------------------------------------------------------
//
// Mirrors the .NET DTOs from Granit.Entities.Views.Abstractions +
// Granit.Entities.Views.Endpoints.Dtos so any consumer (React renderer,
// mobile app) can read the /entities/{name}/views payloads with full
// type safety.
//
// Wire conventions match @granit/entities: camelCase property names,
// PascalCase string-literal enums, readonly arrays / records.

export type {
  EntityViewCreateBodyRequest,
  EntityViewResponse,
  EntityViewShareBodyRequest,
  EntityViewSharedWith,
  EntityViewToggleFlagRequest,
  EntityViewUpdateBodyRequest,
  EntityViewVisibility,
} from './types/index.js';

export {
  createEntityView,
  deleteEntityView,
  getDefaultEntityView,
  getEntityView,
  listEntityViews,
  setEntityViewPersonalDefault,
  setEntityViewPinned,
  setEntityViewTenantDefault,
  shareEntityView,
  updateEntityView,
} from './api/entity-views-api.js';
