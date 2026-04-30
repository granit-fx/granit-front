/**
 * Hypermedia links attached to a discovery entry. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityDiscoveryLinks`.
 */
export interface EntityDiscoveryLinks {
  /** Absolute path to the per-entity manifest (always present). */
  readonly manifest: string;
  /** Absolute path to the list query endpoint, or `null` when no query is registered. */
  readonly list: string | null;
}

/**
 * One entity entry in the discovery tree. Entities the caller cannot read
 * are omitted entirely (defense in depth, ADR-040 §6) — not just hidden via
 * a flag. Mirrors `Granit.Entities.Endpoints.Dtos.EntityDiscoveryItemResponse`.
 */
export interface EntityDiscoveryItem {
  /** Wire identifier (e.g. `"Granit.Parties.Party"`). */
  readonly name: string;
  /** i18n key for the display name (singular). */
  readonly displayKey: string | null;
  /** Icon name from the standard catalog. */
  readonly icon: string | null;
  /** Permission-group prefix (e.g. `"Parties.Parties"`). */
  readonly permissionGroup: string | null;
  readonly links: EntityDiscoveryLinks;
}

/**
 * One module group in the discovery tree. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityModuleGroupResponse`.
 */
export interface EntityModuleGroup {
  /** Module name (PascalCase, derived from the entity's namespace prefix). */
  readonly module: string;
  /** Entities the caller can read, registered under this module. */
  readonly items: readonly EntityDiscoveryItem[];
}

/**
 * Top-level payload returned by `GET /api/entities`. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityDiscoveryResponse`.
 */
export interface EntityDiscoveryResponse {
  /** Manifest schema version (semver-major) — bumps on breaking shape changes. */
  readonly schemaVersion: number;
  /** Module groups, alphabetical by `module`. */
  readonly modules: readonly EntityModuleGroup[];
}
