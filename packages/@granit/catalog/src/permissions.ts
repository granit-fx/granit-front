/** Permission constants for the catalog module. Mirrors `Granit.Catalog.Endpoints.Permissions.CatalogPermissions`. */
export const CatalogPermissions = {
  Products: {
    /** Read access to products (list, get-by-id, get-by-sku). */
    Read: 'Catalog.Products.Read',
    /** Write access — create, update, publish, archive, external-mappings. */
    Manage: 'Catalog.Products.Manage',
  },
} as const;
