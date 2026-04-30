/**
 * Identity facet of the per-entity manifest. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityIdentitySection`.
 */
export interface EntityIdentitySection {
  /** Wire identifier (e.g. `"Granit.Parties.Party"`). */
  readonly name: string;
  /** Full CLR type name — debugging aid, not security-sensitive. */
  readonly entityClrType: string;
  /** i18n key for the singular display name. */
  readonly displayKey: string | null;
  /** Icon name from the standard catalog. */
  readonly icon: string | null;
  /** Permission-group prefix (e.g. `"Parties.Parties"`). */
  readonly permissionGroup: string | null;
  /** Property used to label references to this entity (e.g. `"Number"`). */
  readonly displayProperty: string | null;
}
