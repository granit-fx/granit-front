import type { CurrencyCode, EntityId, ISODateString } from '@granit/types';

export type BalanceAccountId = EntityId<'BalanceAccount'>;
export type BalanceTransactionId = EntityId<'BalanceTransaction'>;

/** Request payload for adding an administrative credit to a customer balance. */
export interface AdminCreditRequest {
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly source: 'Promotional' | 'ManualAdjustment';
  readonly reason: string;
  readonly expiresAt: ISODateString | null;
}

/** The current state of a customer's balance account. */
export interface CustomerBalanceResponse {
  readonly balanceAccountId: BalanceAccountId;
  readonly currency: CurrencyCode;
  readonly balance: number;
  readonly updatedAt: ISODateString | null;
}

/** A single transaction entry on a customer's balance. */
export interface BalanceTransactionResponse {
  readonly id: BalanceTransactionId;
  readonly type: string;
  readonly amount: number;
  readonly source: string;
  readonly reason: string;
  readonly referenceId: string | null;
  readonly referenceType: string | null;
  readonly expiresAt: ISODateString | null;
  readonly createdAt: ISODateString;
}
