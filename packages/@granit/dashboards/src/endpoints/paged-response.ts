/**
 * Generic pagination envelope used by every Granit list endpoint.
 * Mirrors `Granit.Dashboards.Endpoints.Dtos.PagedResponse<T>`.
 *
 * `page` is **0-based**, matching the backend convention. `pageSize`
 * defaults to 50 server-side and is capped at 200.
 */
export interface PagedResponse<T> {
  /** Page slice — at most {@link pageSize} items. */
  readonly items: readonly T[];
  /** Total number of items across all pages. */
  readonly totalCount: number;
  /** Zero-based current page index. */
  readonly page: number;
  /** Number of items requested per page. */
  readonly pageSize: number;
}
