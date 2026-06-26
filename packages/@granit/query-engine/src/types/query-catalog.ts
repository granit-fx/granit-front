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
  /** Wire identifier of the query (e.g. `Granit.Invoicing.InvoiceQuery`). */
  readonly name: string;
  /**
   * Resolved base path of the query's list endpoint (e.g. `/api/v1/invoices`),
   * or `null` when the query is registered without a mapped route. Append
   * `/meta` to fetch its {@link QueryMetadata}.
   */
  readonly basePath: string | null;
  /** Human-readable label (falls back to {@link QueryCatalogEntryResponse.name} backend-side). */
  readonly label: string;
}
