// ---------------------------------------------------------------------------
// @granit/react-entities — public API
// ---------------------------------------------------------------------------
//
// React hooks + generic renderers driven by the manifest exposed by
// @granit/entities. Implementation tracked under
// granit-fx/granit-front#298 (hooks) and #299 (renderers).

export { EntityActionButton, resolveAction } from './actions/entity-action-button.js';
export type { EntityActionButtonProps } from './actions/entity-action-button.js';
export {
  EntityActionDrawerContext,
  EntityActionModalContext,
  useEntityActionDrawer,
  useEntityActionModal,
} from './actions/entity-action-overlay-context.js';
export type {
  EntityActionOverlayContextValue,
  EntityActionOverlayState,
} from './actions/entity-action-overlay-context.js';
export {
  resolveActionUrl,
  useEntityActionDispatcher,
} from './actions/use-entity-action-dispatcher.js';
export type {
  EntityActionDispatch,
  EntityActionHandler,
  EntityActionHandlers,
} from './actions/use-entity-action-dispatcher.js';
export { EntityActionDrawerHost } from './components/entity-action-drawer-host.js';
export type { EntityActionDrawerHostProps } from './components/entity-action-drawer-host.js';
export { EntityActionModalHost } from './components/entity-action-modal-host.js';
export type { EntityActionModalHostProps } from './components/entity-action-modal-host.js';
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
export { EntityListPageHeader } from './components/entity-list-page-header.js';
export type { EntityListPageHeaderProps } from './components/entity-list-page-header.js';
export {
  EntitySelectionBar,
  fanOutWithCap,
  SELECTION_FANOUT_CONCURRENCY_CAP,
} from './components/entity-selection-bar.js';
export type {
  BulkDispatchPredicate,
  EntitySelectionBarLabels,
  EntitySelectionBarProps,
  EntitySelectionBarRecap,
} from './components/entity-selection-bar.js';
export { SelectionContext, useSelection } from './selection/selection-context.js';
export type { SelectionContextValue } from './selection/selection-context.js';
export { SelectionProvider } from './selection/selection-provider.js';
export type { SelectionProviderProps } from './selection/selection-provider.js';
export {
  defaultDetailFormat,
  STANDARD_DETAIL_COMPONENTS,
  STANDARD_FORM_COMPONENTS,
} from './field-components/index.js';
export type { SelectComponentOption } from './field-components/index.js';
export { executeBulkAction } from './api/bulk-action.js';

// i18n resource bundles (namespace: 'entities')
export { entitiesTranslationsEn, entitiesTranslationsFr } from './locales/index.js';
export type { EntitiesTranslations } from './locales/index.js';
export { entityCalendarQueryKey, useEntityCalendar } from './api/use-entity-calendar.js';
export { entityDiscoveryQueryKey, useEntityDiscovery } from './api/use-entity-discovery.js';
export {
  entityRelationAggregatesQueryKey,
  useEntityRelationAggregates,
} from './api/use-entity-relation-aggregates.js';
export {
  parseRelationAggregateParentMarker,
  useInvalidateEntityRelationAggregates,
} from './api/use-invalidate-entity-relation-aggregates.js';
export type { RelationAggregateParentRef } from './api/use-invalidate-entity-relation-aggregates.js';
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
