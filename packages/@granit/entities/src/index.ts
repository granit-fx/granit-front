// ---------------------------------------------------------------------------
// @granit/entities — public API (framework-agnostic)
// ---------------------------------------------------------------------------
//
// Mirrors the .NET DTOs from Granit.Entities.Abstractions +
// Granit.Entities.Endpoints.Dtos so any consumer (React renderer, mobile
// app, future Vue port) can read the `/api/entities` and
// `/api/entities/{name}` payloads with full type safety.
//
// Wire conventions: camelCase property names (System.Text.Json default),
// PascalCase string-literal enums (Granit registers a
// `JsonStringEnumConverter` without naming policy), `IReadOnlyList<T>` →
// `readonly T[]`, `IReadOnlyDictionary<string, T>` →
// `Readonly<Record<string, T>>`.

export { evaluateVisibility } from './helpers/index';
export { executeBulkAction } from './api/bulk-action-api';
export { ALL_ENTITY_FACETS, MANIFEST_SCHEMA_VERSION } from './types/index';
export type {
  BulkActionFailure,
  BulkActionRequest,
  BulkActionResponse,
  CalendarItemResponse,
  CalendarRangeRequest,
  EntityActionKind,
  EntityActionManifest,
  EntityCalendarLayoutManifest,
  EntityCalendarTileActionManifest,
  EntityCollectionReference,
  EntityCollectionsSection,
  EntityDetailManifest,
  EntityDetailSectionManifest,
  EntityDetailSidePanelManifest,
  EntityDiscoveryItem,
  EntityDiscoveryLinks,
  EntityDiscoveryResponse,
  EntityFacet,
  EntityFormFieldManifest,
  EntityFormManifest,
  EntityFormSectionManifest,
  EntityGalleryCardActionManifest,
  EntityGalleryLayoutManifest,
  EntityHeaderActionManifest,
  EntityIdentitySection,
  EntityKanbanCardActionManifest,
  EntityKanbanCardManifest,
  EntityKanbanCardRelationManifest,
  EntityKanbanColumnManifest,
  EntityKanbanLayoutManifest,
  EntityListLayoutKind,
  EntityListLayoutManifest,
  EntityManifestResponse,
  EntityModuleGroup,
  EntityPermissionsSection,
  EntityRelationAggregateManifest,
  EntityRelationManifest,
  EntitySelectionActionManifest,
  FieldOp,
  GalleryCardSize,
  KanbanColor,
  KanbanColumnState,
  RelationAggregateKind,
  RelationAggregateValue,
  RelationAggregatesRequest,
  RelationAggregatesResponse,
  RelationCardinality,
  RelationDisplay,
  SidePanelKind,
  VisibilityCondition,
} from './types/index';
