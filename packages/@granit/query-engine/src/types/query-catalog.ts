// ---------------------------------------------------------------------------
// Query catalogue — mirrors Granit.QueryEngine.QueryCatalogEntryResponse (.NET)
// Returned by GET {basePath}/catalog
// ---------------------------------------------------------------------------

/**
 * One registered query definition, surfaced by `GET {basePath}/catalog` so a
 * dashboard editor can offer a dropdown of queries instead of a free-text
 * `queryName`.
 */
export interface QueryCatalogEntryResponse {
  /**
   * Owning module of the query (e.g. `Auditing`, `Identity.Local`) — derived
   * backend-side from the query's namespace. A localization KEY for the module
   * group heading (NOT a pre-resolved string): resolve it client-side against the
   * merged i18n bundle (like `labelKey` / `Entity:*`), falling back to the raw
   * value when the key is absent. Sibling queries share it (e.g.
   * `Granit.Auditing.AuditEntryQuery` and `Granit.Auditing.AuditEntityChangeQuery`
   * both yield `Auditing`); the catalogue is returned ordered by `moduleName` then
   * {@link QueryCatalogEntryResponse.name}.
   */
  readonly moduleName: string;
  /** Wire identifier of the query (e.g. `Granit.Invoicing.InvoiceQuery`). */
  readonly name: string;
  /**
   * Resolved base path of the query's list endpoint (e.g. `/api/v1/invoices`),
   * or `null` when the query is registered without a mapped route. Append
   * `/meta` to fetch its {@link QueryMetadata}.
   */
  readonly basePath: string | null;
  /**
   * Localization KEY for the dropdown label (NOT a resolved string) — the target
   * entity's display key (e.g. `Entity:Party`, already translated) when the query
   * targets a registered entity, else `Query:{name}`. Resolve it client-side via
   * the merged i18n bundle (like `Entity:*` / `Permission:*`); fall back to a
   * humanised last segment of {@link QueryCatalogEntryResponse.name} when unresolved.
   */
  readonly labelKey: string;
}
