/**
 * Pagination envelope for the dashboards list endpoint. Faithfully mirrors
 * `Granit.Dashboards.Endpoints.Dtos.PagedResponse<T>`
 * (`PagedResponseOfDashboardSummaryResponse` in `contracts/openapi/dashboards.json`,
 * required fields: `items`, `totalCount`, `page`, `pageSize`).
 *
 * `page` is **0-based**, matching the backend convention. `pageSize`
 * defaults to 50 server-side and is capped at 200.
 *
 * NOTE — intentional divergence from `@granit/query-engine`'s `PagedResult<T>`:
 * that canonical envelope is cursor/offset-agnostic (`items` + nullable
 * `totalCount` + optional `hasMore`/`nextCursor`) and echoes neither `page` nor
 * `pageSize`. This shape is a wire-faithful mirror of the dashboards backend DTO,
 * which DOES echo the 0-based `page`/`pageSize`. Do NOT unify onto `PagedResult`
 * or hand-roll a third variant — consume this type directly for dashboards lists.
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
