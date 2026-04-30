/**
 * Closed enum of visibility levels an `EntityView` may carry — see
 * ADR-047 §4. Mirrors `Granit.Entities.Views.EntityViewVisibility`.
 *
 * - `Personal` — owner-only; created by any user with `Entities.Views.Create`
 * - `Shared` — visible to specific roles + users; promoted from Personal
 *   by a user with `Entities.Views.Share`
 * - `Tenant` — visible to the entire tenant; promoted by an admin with
 *   `Entities.Views.Manage`
 */
export type EntityViewVisibility = 'Personal' | 'Shared' | 'Tenant';

/**
 * Audience for `Shared` views. Mirrors
 * `Granit.Entities.Views.Endpoints.Dtos.EntityViewSharedWithDto`.
 *
 * Both lists may be empty for a `Shared` view that has been narrowed to
 * just the owner; however a `Personal` or `Tenant` view always carries
 * `null` here (see {@link EntityViewResponse.sharedWith}).
 */
export interface EntityViewSharedWith {
  readonly roles: readonly string[];
  readonly users: readonly string[];
}

/**
 * Wire-shape projection of an `EntityView` aggregate. Mirrors
 * `Granit.Entities.Views.Endpoints.Dtos.EntityViewResponse`.
 *
 * `state` is the JSON delta payload over the compiled collection
 * identified by `basedOn` (filters / sort / columns / group / per-layout
 * config); the framework treats it as opaque and lets the renderer apply
 * it to the underlying `QueryRequest`.
 */
export interface EntityViewResponse {
  readonly id: string;
  /** Wire identifier of the entity this view targets. */
  readonly entityName: string;
  /** Compiled-collection name this view deltas over (immutable post-creation). */
  readonly basedOn: string;
  /** View kind inherited from `basedOn` (e.g. `"list"`, `"kanban"`). */
  readonly kind: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon: string | null;
  /** JSONB delta payload — opaque to the framework, applied by the renderer. */
  readonly state: Readonly<Record<string, unknown>>;
  readonly visibility: EntityViewVisibility;
  /** Owner id — `null` only for Tenant views. */
  readonly ownerId: string | null;
  /** Audience for `Shared` views; `null` for Personal / Tenant. */
  readonly sharedWith: EntityViewSharedWith | null;
  /** Pinned as a tab in the workspace tab strip (admin-promoted). */
  readonly isPinned: boolean;
  /** Replaces the compiled default for the tenant (admin-promoted). */
  readonly isDefault: boolean;
  /** User's landing view for this entity (per-user); at most one per (user, entity). */
  readonly isPersonalDefault: boolean;
  /** Display order among views (lower first). */
  readonly sortOrder: number;
}
