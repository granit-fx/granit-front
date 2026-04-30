/**
 * Permissions facet — boolean snapshot of the actions the requesting user
 * is allowed to perform on this entity. Computed server-side from the
 * granted permissions and the entity's permission group; the renderer
 * trusts these flags to gate UI affordances (the server still enforces
 * permissions on every individual call — defense in depth).
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityPermissionsSection`.
 */
export interface EntityPermissionsSection {
  /** User has `{permissionGroup}.Read`. */
  readonly canRead: boolean;
  /** User has `{permissionGroup}.Create`. */
  readonly canCreate: boolean;
  /** User has `{permissionGroup}.Update`. */
  readonly canUpdate: boolean;
  /** User has `{permissionGroup}.Delete`. */
  readonly canDelete: boolean;
  /** User has `{permissionGroup}.Manage`. */
  readonly canManage: boolean;
  /** User has `{permissionGroup}.Execute`. */
  readonly canExecute: boolean;
}
