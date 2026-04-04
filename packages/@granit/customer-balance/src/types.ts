import type { ISODateString } from '@granit/types';

/** Request payload for adding an administrative credit to a customer balance. */
export interface AdminCreditRequest {
  readonly amount: number;
  readonly currency: string;
  readonly source: 'Promotional' | 'ManualAdjustment';
  readonly reason: string;
  readonly expiresAt: ISODateString | null;
}

/** The current state of a customer's balance account. */
export interface CustomerBalanceResponse {
  readonly balanceAccountId: string;
  readonly currency: string;
  readonly balance: number;
  readonly updatedAt: ISODateString | null;
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
  readonly expiresAt: ISODateString | null;
  readonly createdAt: ISODateString;
}
