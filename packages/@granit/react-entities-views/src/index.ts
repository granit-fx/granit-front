// ---------------------------------------------------------------------------
// @granit/react-entities-views — public API
// ---------------------------------------------------------------------------
//
// React hooks for the EntityView CRUD + flag endpoints, plus the view
// tab strip (the visual layer ships in the consuming app per the
// framework / app split). Implementation lands across the stories in
// granit-fx/granit-front#301.

export { defaultEntityViewQueryKey, useDefaultEntityView } from './hooks/use-default-entity-view.js';
export {
  useCreateEntityView,
  useDeleteEntityView,
  useUpdateEntityView,
} from './hooks/use-entity-view-crud.js';
export type { UpdateEntityViewVariables } from './hooks/use-entity-view-crud.js';
export {
  useSetEntityViewPersonalDefault,
  useSetEntityViewPinned,
  useSetEntityViewTenantDefault,
  useShareEntityView,
} from './hooks/use-entity-view-flags.js';
export type {
  ShareEntityViewVariables,
  ToggleEntityViewFlagVariables,
} from './hooks/use-entity-view-flags.js';
export { entityViewQueryKey, useEntityView } from './hooks/use-entity-view.js';
export { entityViewsQueryKey, useEntityViews } from './hooks/use-entity-views.js';
