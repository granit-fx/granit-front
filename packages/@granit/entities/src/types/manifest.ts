import type { EntityActionManifest } from './actions';
import type { EntityCollectionsSection } from './collections';
import type { EntityDetailManifest } from './detail';
import type { EntityFormManifest } from './form';
import type { EntityIdentitySection } from './identity';
import type { EntityPermissionsSection } from './permissions';
import type { EntityRelationManifest } from './relations';

/**
 * Activities configuration for an entity — which activity types are allowed
 * and the optional default assignee rule. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityActivitiesManifest`.
 */
export interface EntityActivitiesManifest {
  /** Closed list of activity type identifiers allowed for this entity. */
  readonly allowedTypes: readonly string[];
  /** Default assignee rule identifier, or `null` when there is no default. */
  readonly defaultAssignee: string | null;
}

/**
 * Selectable facets of the per-entity manifest. Wire form: comma-separated
 * lowercase names in the `?facets=` query parameter (e.g.
 * `?facets=identity,forms`). Default — when the query parameter is absent
 * — returns every facet.
 *
 * Mirrors the `[Flags]` enum `Granit.Entities.Endpoints.Dtos.EntityFacets`.
 * Exposed as a string-literal union here because the wire form is a CSV of
 * tokens, not a bitmask.
 */
export type EntityFacet =
  | 'identity'
  | 'permissions'
  | 'forms'
  | 'details'
  | 'collections'
  | 'dashboards'
  | 'exports'
  | 'views'
  | 'relations'
  | 'actions'
  | 'activities';

/** All facets — handy default value for callers that want everything explicit. */
export const ALL_ENTITY_FACETS: readonly EntityFacet[] = Object.freeze([
  'identity',
  'permissions',
  'forms',
  'details',
  'collections',
  'dashboards',
  'exports',
  'views',
  'relations',
  'actions',
  'activities',
]);

/**
 * Per-entity manifest payload returned by `GET /api/entities/{name}`. Every
 * facet is optional in the wire form — when the caller passes `?facets=` to
 * slim the response, the omitted facets come back as `null`. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityManifestResponse`.
 *
 * The `Granit-Entities-Schema-Version` response header carries the same
 * value as {@link EntityManifestResponse.schemaVersion}.
 */
export interface EntityManifestResponse {
  /** Manifest schema version (semver-major). */
  readonly schemaVersion: number;
  readonly identity: EntityIdentitySection | null;
  readonly permissions: EntityPermissionsSection | null;
  readonly forms: readonly EntityFormManifest[] | null;
  readonly details: readonly EntityDetailManifest[] | null;
  readonly collections: EntityCollectionsSection | null;
  readonly relations: readonly EntityRelationManifest[] | null;
  readonly actions: readonly EntityActionManifest[] | null;
  readonly activities: EntityActivitiesManifest | null;
}

/**
 * Schema version this package was compiled against. Consumers can check
 * `manifest.schemaVersion === MANIFEST_SCHEMA_VERSION` to assert the wire
 * shape matches what they were built for, and surface a friendly error
 * when the backend has been bumped past the renderer.
 */
export const MANIFEST_SCHEMA_VERSION = 1;
