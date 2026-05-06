/**
 * Wire shapes for the bulk-action endpoint shipped by
 * `Granit.Entities.Endpoints` (per granit-fx/granit-dotnet#1792 / #1822).
 *
 * `POST /entities/{name}/bulk/{action}` fans out a single action across
 * many ids with **one batched event emitted per parent affected** —
 * avoids the N invalidations a per-row dispatch would trigger.
 *
 * Request: ids of the rows to act on + an optional bag of parameters
 * (passed through to the action executor; shape is action-specific).
 *
 * Response surfaces three lists so the client can:
 * - re-render the rows the action succeeded on (`ok`),
 * - keep the failed rows selected for retry + show their per-id error
 *   (`failed`),
 * - invalidate exactly the affected parents' relation-aggregate caches
 *   for smart-button refresh (`parents`).
 */
export interface BulkActionRequest {
  /** Ids of the rows the action targets. Must be non-empty. */
  readonly ids: readonly string[];
  /**
   * Optional action-specific parameter bag. Wire-passed verbatim to the
   * action executor — the shape is owned by the action's contract, not
   * by this envelope.
   */
  readonly parameters?: Readonly<Record<string, unknown>>;
}

/** Per-id error captured by the bulk endpoint when a single row fails. */
export interface BulkActionFailure {
  readonly id: string;
  /** Human-readable reason — backend already localizes when applicable. */
  readonly error: string;
  /** Optional machine-readable error code. */
  readonly errorCode: string | null;
}

export interface BulkActionResponse {
  /** Ids that succeeded. */
  readonly ok: readonly string[];
  /** Per-id failures captured without short-circuiting the batch. */
  readonly failed: readonly BulkActionFailure[];
  /**
   * Distinct parent entity instances impacted by the batch — the front
   * uses this list to invalidate the right relation-aggregate caches in
   * exactly one step per parent, mirroring the backend's batched-event
   * semantics. Format: `"{ParentEntityName}:{ParentId}"`.
   */
  readonly parents: readonly string[];
}
