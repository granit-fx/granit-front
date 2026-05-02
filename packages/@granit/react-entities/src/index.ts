// ---------------------------------------------------------------------------
// @granit/react-entities — public API
// ---------------------------------------------------------------------------
//
// React hooks + generic renderers driven by the manifest exposed by
// @granit/entities. Implementation tracked under
// granit-fx/granit-front#298 (hooks) and #299 (renderers).

export { EntityCalendar } from './components/entity-calendar.js';
export type { EntityCalendarProps } from './components/entity-calendar.js';
export { EntityDetail } from './components/entity-detail.js';
export type { EntityDetailProps } from './components/entity-detail.js';
export { EntityForm } from './components/entity-form.js';
export type { EntityFormProps } from './components/entity-form.js';
export { EntityGallery } from './components/entity-gallery.js';
export type { EntityGalleryProps } from './components/entity-gallery.js';
export { EntityKanban } from './components/entity-kanban.js';
export type { EntityKanbanProps } from './components/entity-kanban.js';
export { EntityList } from './components/entity-list.js';
export type { EntityListProps } from './components/entity-list.js';
export {
  defaultDetailFormat,
  STANDARD_DETAIL_COMPONENTS,
  STANDARD_FORM_COMPONENTS,
} from './field-components/index.js';
export type { SelectComponentOption } from './field-components/index.js';
export { entityCalendarQueryKey, useEntityCalendar } from './api/use-entity-calendar.js';
export { entityDiscoveryQueryKey, useEntityDiscovery } from './api/use-entity-discovery.js';
export {
  entityRelationAggregatesQueryKey,
  useEntityRelationAggregates,
} from './api/use-entity-relation-aggregates.js';
export { entityManifestQueryKey, useEntityMetadata } from './api/use-entity-metadata.js';
export { useEntityForm } from './hooks/index.js';
export type { UseEntityFormOptions, UseEntityFormReturn } from './hooks/index.js';
export {
  EMPTY_COMPONENT_CATALOG,
  EntityRendererProvider,
  useEntityRenderer,
} from './provider/index.js';
export type {
  EntityComponentCatalog,
  EntityDetailComponent,
  EntityDetailComponentProps,
  EntityFormComponent,
  EntityFormComponentProps,
  EntityRendererContextValue,
  EntityRendererProviderProps,
  EntitySidePanel,
  EntitySidePanelProps,
  ResolveLabel,
} from './provider/index.js';
