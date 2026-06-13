// ---------------------------------------------------------------------------
// "Was this you?" session review — anonymous, token-protected contract behind
// the security-alert email CTA. Mirrors Granit.Identity.Endpoints SessionReview
// DTOs (granit-dotnet #2669). The caller is unauthenticated: the token from the
// email link is the only credential.
// ---------------------------------------------------------------------------

/**
 * The reviewer's verdict on a flagged sign-in. Serialized by the backend as the
 * PascalCase strings `"Confirmed"` (it was me) / `"Denied"` (it wasn't me).
 */
export type SessionReviewDecision = 'Confirmed' | 'Denied';

/**
 * Side-effect-free review context — mirrors
 * `Granit.Identity.Endpoints.Dtos.SessionReviewContextResponse`. Fetched on page
 * load (`GET /sessions/review?token=…`).
 */
export type SessionReviewContextResponse = {
  /** Approximate country of the flagged sign-in, or null when unresolved. */
  readonly country: string | null;
  /**
   * The recorded verdict, or null when the sign-in has not been reviewed yet.
   * Null → show the Yes/No prompt; non-null → show the recorded outcome.
   */
  readonly decision: SessionReviewDecision | null;
};

/**
 * Request body for `POST /sessions/review` — mirrors
 * `Granit.Identity.Endpoints.Dtos.SessionReviewDecisionRequest`. Single-use.
 */
export type SessionReviewDecisionRequest = {
  /** The opaque token from the email link — the only credential. Never logged. */
  readonly token: string;
  /** The reviewer's verdict to commit. */
  readonly decision: SessionReviewDecision;
};

/**
 * Result of committing a review — mirrors
 * `Granit.Identity.Endpoints.Dtos.SessionReviewResultResponse`.
 */
export type SessionReviewResultResponse = {
  /** The verdict now on record. */
  readonly decision: SessionReviewDecision;
  /**
   * Whether THIS request performed the action. `false` when the sign-in had
   * already been reviewed earlier — an idempotent no-op that still reports the
   * recorded outcome.
   */
  readonly applied: boolean;
};
