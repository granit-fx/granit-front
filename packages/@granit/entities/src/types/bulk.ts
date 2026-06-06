/**
 * Wire shapes for the bulk-action endpoint shipped by
 * `Granit.Entities.Endpoints`.
 *
 * `POST /entities/{name}/bulk/{action}` fans out a single action across
 * many ids in one round-trip. The backend captures per-id failures without
 * short-circuiting and surfaces them in `failures`; `affected` counts the
 * rows that were successfully processed.
 */
export interface BulkActionRequest {
  /** Ids of the rows the action targets. Must be non-empty. */
  readonly ids: readonly string[];
  /**
   * Action-specific payload — wire-passed verbatim as a JSON value to the
   * action executor. Shape is owned by the action's contract, not this
   * envelope. Mirrors `Granit.Entities.Endpoints.Dtos.BulkActionRequest.Payload`
   * (JsonElement on the .NET side).
   */
  readonly payload: unknown;
}

/** Per-id failure captured by the bulk endpoint when a single row fails. */
export interface BulkActionFailure {
  readonly id: string;
  /** Human-readable reason — backend already localizes when applicable. */
  readonly reason: string;
}

export interface BulkActionResponse {
  /** Number of rows successfully processed. */
  readonly affected: number;
  /** Per-id failures captured without short-circuiting the batch. */
  readonly failures: readonly BulkActionFailure[];
}
