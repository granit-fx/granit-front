/**
 * Aggregate-agnostic entity-merge contracts. TypeScript mirror of the .NET
 * `Granit.EntityMerge` framework module (formerly `Granit.Mergeable`) — see
 * `granit-dotnet/src/Granit.EntityMerge`. The concrete HTTP wire shape is
 * defined by each consumer's endpoints (e.g. `Granit.Parties.Endpoints`); the
 * shape is identical across aggregates because the merged aggregate itself is
 * never returned in the body.
 *
 * Domain packages (`@granit/parties`, future `@granit/products`, …) re-export
 * these with their own branded id types via the `TId` parameter.
 */

/**
 * Side that wins a per-field merge conflict. Mirrors the .NET `WinnerSide`
 * enum, exposed on the wire as a JSON string (`JsonStringEnumConverter`).
 */
export type WinnerSide = 'Survivor' | 'Loser';

/**
 * A single field-level conflict between the survivor and the loser. Both
 * values are pre-stringified server-side (`object?.ToString()`) so the JSON
 * payload stays predictable regardless of the underlying type. On an
 * idempotency-cache replay the backend omits the values (GDPR minimisation),
 * so both may be `null` even when {@link fieldPath} and {@link default} are set.
 */
export interface FieldConflict {
  /** Dot-separated path; e.g. `"Name"`, `"Metadata.segment"`. */
  readonly fieldPath: string;
  /** Survivor's current value, stringified — `null` if unset, empty or withheld. */
  readonly survivorValue: string | null;
  /** Loser's current value, stringified — `null` if unset, empty or withheld. */
  readonly loserValue: string | null;
  /** Recommended winner, pre-populated by the orchestrator. */
  readonly default: WinnerSide;
}

/**
 * Per-field admin overrides, keyed by {@link FieldConflict.fieldPath}. Missing
 * keys fall back to the recommended {@link FieldConflict.default}.
 */
export type MergeFieldChoices = Readonly<Record<string, WinnerSide>>;

/**
 * Body of `POST {basePath}/{survivorId}/merge`. The survivor id travels in the
 * URL path and the idempotency key in the `Idempotency-Key` header — so
 * neither appears here.
 */
export interface MergeRequest<TId extends string = string> {
  /** Id of the aggregate to merge into the survivor (will be tombstoned). */
  readonly loserId: TId;
  /**
   * Per-field overrides. Empty / omitted = defer to the recommended default
   * for every field.
   */
  readonly choices?: MergeFieldChoices;
  /** Free-form admin justification — captured in the audit log. */
  readonly reason?: string | null;
  /**
   * When `true`, the orchestrator computes conflicts and rewrite counts
   * without committing — same response shape as the preview endpoint.
   */
  readonly dryRun?: boolean;
}

/**
 * Response for both `GET .../merge/preview` and `POST .../merge`. The merged
 * aggregate itself is NOT included — fetch it via the aggregate's own detail
 * endpoint after a successful live merge.
 */
export interface MergeResult<TId extends string = string> {
  /** The aggregate that absorbed the loser. */
  readonly survivorId: TId;
  /** The tombstoned aggregate. */
  readonly loserId: TId;
  /** Per-field conflicts with the recommended winner pre-populated. */
  readonly conflicts: readonly FieldConflict[];
  /**
   * For each registered cross-module rewriter (`"Invoice.PartyId"`,
   * `"Subscription.PartyId"`, …), the number of rows that were (or would be)
   * rewritten. Powers the "what will change" preview.
   */
  readonly rewriteCounts: Readonly<Record<string, number>>;
  /** `true` for previews and explicit dry-runs; `false` for committed merges. */
  readonly dryRun: boolean;
}
