/** Request payload for adding an administrative credit to a customer balance. */
export interface AdminCreditRequest {
  readonly partyId: string;
  readonly amount: number;
  readonly currency: string;
  readonly source: 'Promotional' | 'ManualAdjustment';
  readonly reason: string;
  readonly expiresAt: string | null;
}

/** Request payload for applying a manual debit to a customer balance (admin tooling). */
export interface AdminDebitRequest {
  readonly partyId: string;
  readonly amount: number;
  readonly currency: string;
  readonly reason: string;
  readonly referenceId?: string | null;
  readonly referenceType?: string | null;
}

/** Query parameters for the list balance transactions endpoint. */
export interface ListBalanceTransactionsParams {
  readonly currency: string;
  readonly page: number;
  readonly pageSize: number;
}

/** The current state of a customer's balance account. */
export interface CustomerBalanceResponse {
  readonly balanceAccountId: string;
  readonly currency: string;
  readonly balance: number;
  /** Optimistic-concurrency token; echo back on edit to detect conflicts (409). */
  readonly concurrencyStamp: string;
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
