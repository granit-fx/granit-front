/** Request payload for adding an administrative credit to a customer balance. */
export interface AdminCreditRequest {
  readonly amount: number;
  readonly currency: string;
  readonly source: 'Promotional' | 'ManualAdjustment';
  readonly reason: string;
  readonly expiresAt: string | null;
}

/**
 * Request payload to debit a tenant's `BalanceAccount` manually — admin
 * tooling for corrections, scheduled drawdowns, and non-invoice adjustments.
 *
 * When `referenceId` is set, a previous debit with the same
 * `(referenceId, source = ManualAdjustment)` short-circuits the call —
 * admin retries are safe.
 */
export interface AdminDebitRequest {
  readonly amount: number;
  readonly currency: string;
  /** Free-text justification (audit trail; ≤ 500 chars; no PII per GDPR). */
  readonly reason: string;
  /** Optional external document reference (idempotency key). */
  readonly referenceId?: string | null;
  /** Type of the referenced document (e.g. `"AdminAdjustment"`). */
  readonly referenceType?: string | null;
}

/** The current state of a customer's balance account. */
export interface CustomerBalanceResponse {
  readonly balanceAccountId: string;
  readonly currency: string;
  readonly balance: number;
  readonly updatedAt: string | null;
}

/** A single transaction entry on a customer's balance. */
export interface BalanceTransactionResponse {
  readonly id: string;
  readonly type: string;
  readonly amount: number;
  readonly source: string;
  readonly reason: string;
  readonly referenceId: string | null;
  readonly referenceType: string | null;
  readonly expiresAt: string | null;
  readonly createdAt: string;
}
