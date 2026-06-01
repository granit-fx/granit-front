// ---------------------------------------------------------------------------
// @granit/react-entities — public API
// ---------------------------------------------------------------------------
//
// React hooks + generic renderers driven by the manifest exposed by
// @granit/entities. Implementation tracked under
// granit-fx/granit-front#298 (hooks) and #299 (renderers).

export { EntityActionButton, resolveAction } from './actions/entity-action-button';
export type { EntityActionButtonProps } from './actions/entity-action-button';
export {
  EntityActionDrawerContext,
  EntityActionModalContext,
  useEntityActionDrawer,
  useEntityActionModal,
} from './actions/entity-action-overlay-context';
export type {
  EntityActionOverlayContextValue,
  EntityActionOverlayState,
} from './actions/entity-action-overlay-context';
export {
  resolveActionUrl,
  useEntityActionDispatcher,
} from './actions/use-entity-action-dispatcher';
export type {
  EntityActionDispatch,
  EntityActionHandler,
  EntityActionHandlers,
} from './actions/use-entity-action-dispatcher';
export { EntityActionDrawerHost } from './components/entity-action-drawer-host';
export type { EntityActionDrawerHostProps } from './components/entity-action-drawer-host';
export { EntityActionModalHost } from './components/entity-action-modal-host';
export type { EntityActionModalHostProps } from './components/entity-action-modal-host';
export { EntityCalendar } from './components/entity-calendar';
export type { EntityCalendarProps } from './components/entity-calendar';
export { EntityDetail } from './components/entity-detail';
export type { EntityDetailProps } from './components/entity-detail';
export { EntityForm } from './components/entity-form';
export type { EntityFormProps } from './components/entity-form';
export { EntityGallery } from './components/entity-gallery';
export type { EntityGalleryProps } from './components/entity-gallery';
export { EntityKanban } from './components/entity-kanban';
export type { EntityKanbanProps } from './components/entity-kanban';
export { EntityList } from './components/entity-list';
export type { EntityListProps } from './components/entity-list';
export { EntityListPageHeader } from './components/entity-list-page-header';
export type { EntityListPageHeaderProps } from './components/entity-list-page-header';
export {
  EntitySelectionBar,
  fanOutWithCap,
  SELECTION_FANOUT_CONCURRENCY_CAP,
} from './components/entity-selection-bar';
export type {
  BulkDispatchPredicate,
  EntitySelectionBarLabels,
  EntitySelectionBarProps,
  EntitySelectionBarRecap,
} from './components/entity-selection-bar';
export { SelectionContext, useSelection } from './selection/selection-context';
export type { SelectionContextValue } from './selection/selection-context';
export { SelectionProvider } from './selection/selection-provider';
export type { SelectionProviderProps } from './selection/selection-provider';
export {
  defaultDetailFormat,
  STANDARD_DETAIL_COMPONENTS,
  STANDARD_FORM_COMPONENTS,
} from './field-components/index';
export type { SelectComponentOption } from './field-components/index';
export { executeBulkAction } from '@granit/entities';

// i18n resource bundles (namespace: 'entities')
export { entitiesTranslationsEn, entitiesTranslationsFr } from './locales/index';
export type { EntitiesTranslations } from './locales/index';
export { entityCalendarQueryKey, useEntityCalendar } from './hooks/use-entity-calendar';
export { entityDiscoveryQueryKey, useEntityDiscovery } from './hooks/use-entity-discovery';
export {
  entityRelationAggregatesQueryKey,
  useEntityRelationAggregates,
} from './hooks/use-entity-relation-aggregates';
export {
  parseRelationAggregateParentMarker,
  useInvalidateEntityRelationAggregates,
} from './hooks/use-invalidate-entity-relation-aggregates';
export type { RelationAggregateParentRef } from './hooks/use-invalidate-entity-relation-aggregates';
export { entityManifestQueryKey, useEntityMetadata } from './hooks/use-entity-metadata';
export { useEntityForm } from './hooks/index';
export type { UseEntityFormOptions, UseEntityFormReturn } from './hooks/index';
export {
  EMPTY_COMPONENT_CATALOG,
  EntityRendererProvider,
  useEntityRenderer,
} from './providers/index';
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
} from './providers/index';
