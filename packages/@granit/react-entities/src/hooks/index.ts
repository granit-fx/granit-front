// ---------------------------------------------------------------------------
// @granit/react-entities — hooks barrel
// ---------------------------------------------------------------------------
//
// Single entry point for every React Query hook + query-key factory in the
// package. `src/index.ts` re-exports from here so nothing bypasses this
// barrel.

export {
  entityCalendarQueryKey,
  entityDiscoveryQueryKey,
  entityGalleryGroupedQueryKey,
  entityManifestQueryKey,
  entityRelationAggregatesQueryKey,
  entityRowQueryKey,
  entityRowsQueryKey,
} from './query-keys';

export { useEntity } from './use-entity';
export type { EntityRow, UseEntityOptions } from './use-entity';

export { useCreateEntity, useUpdateEntity } from './use-entity-mutations';
export type {
  OptimisticListPatch,
  UseCreateEntityOptions,
  UseUpdateEntityOptions,
  UseUpdateEntityVariables,
} from './use-entity-mutations';

export { useEntityCalendar } from './use-entity-calendar';
export { useEntityDiscovery } from './use-entity-discovery';
export { useEntityMetadata } from './use-entity-metadata';
export { useEntityRelationAggregates } from './use-entity-relation-aggregates';
export {
  parseRelationAggregateParentMarker,
  useInvalidateEntityRelationAggregates,
} from './use-invalidate-entity-relation-aggregates';
export type { RelationAggregateParentRef } from './use-invalidate-entity-relation-aggregates';

export { useEntityForm } from './use-entity-form';
export type { UseEntityFormOptions, UseEntityFormReturn } from './use-entity-form';
