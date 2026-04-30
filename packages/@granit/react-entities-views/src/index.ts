// ---------------------------------------------------------------------------
// @granit/react-entities-views — public API
// ---------------------------------------------------------------------------
//
// React hooks for the EntityView CRUD + flag endpoints, plus the view
// tab strip (the visual layer ships in the consuming app per the
// framework / app split). Implementation lands across the stories in
// granit-fx/granit-front#301.

export { defaultEntityViewQueryKey, useDefaultEntityView } from './api/use-default-entity-view.js';
export {
  useCreateEntityView,
  useDeleteEntityView,
  useUpdateEntityView,
} from './api/use-entity-view-crud.js';
export type { UpdateEntityViewVariables } from './api/use-entity-view-crud.js';
export { entityViewQueryKey, useEntityView } from './api/use-entity-view.js';
export { entityViewsQueryKey, useEntityViews } from './api/use-entity-views.js';
