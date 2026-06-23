import { TaxonomyPermissions } from '@granit/taxonomy';

/**
 * Default taxonomy scope wired into the admin pages.
 *
 * The Taxonomy module is per-scope (one set of tags + one category tree per
 * module). The admin UI surfaces a single illustrative scope; real tenants
 * would wire one page per module they own.
 */
export const TAXONOMY_DEFAULT_SCOPE = 'documents';

/**
 * Assembly-qualified target-type → entity label mapping consumed by
 * `<TaxonomySearchBar />` to localise group headings in the cross-entity
 * search dropdown.
 */
export const TAXONOMY_TARGET_TYPES = {
  Document: 'Granit.Documents.Domain.Document',
  Party: 'Granit.Parties.Domain.Party',
} as const;

/**
 * Flat alias over the package-owned {@link TaxonomyPermissions} string table,
 * kept for ergonomic `TAGS_MANAGE`-style access across the admin pages while
 * the permission literals stay single-sourced in `@granit/taxonomy`.
 */
export const TAXONOMY_PERMISSIONS = {
  TAGS_READ: TaxonomyPermissions.Tags.Read,
  TAGS_MANAGE: TaxonomyPermissions.Tags.Manage,
  CATEGORIES_READ: TaxonomyPermissions.Categories.Read,
  CATEGORIES_MANAGE: TaxonomyPermissions.Categories.Manage,
  SEARCH_READ: TaxonomyPermissions.Search.Read,
} as const;
