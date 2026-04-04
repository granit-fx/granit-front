import type { CurrencyCode, EntityId, ISODateString, TenantId } from '@granit/types';

export type PaymentTransactionId = EntityId<'PaymentTransaction'>;
export type PaymentRefundId = EntityId<'PaymentRefund'>;
export type PaymentDisputeId = EntityId<'PaymentDispute'>;
export type PaymentMethodId = EntityId<'PaymentMethod'>;
type InvoiceId = EntityId<'Invoice'>;

export type PaymentStatus =
  | 'Pending'
  | 'Processing'
  | 'Succeeded'
  | 'Failed'
  | 'Canceled'
  | 'RequiresAction';

export type RefundStatus = 'Pending' | 'Succeeded' | 'Failed';

export type DisputeStatus = 'Open' | 'UnderReview' | 'Won' | 'Lost';

export type PaymentMethodCategory = 'Card' | 'BankTransfer' | 'Wallet' | 'DirectDebit';

export interface PaymentChargeRequest {
  readonly invoiceId: InvoiceId;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly methodType: string;
  readonly idempotencyKey: string;
  readonly providerName: string | null;
}

export interface PaymentRefundRequest {
  readonly transactionId: PaymentTransactionId;
  readonly amount: number;
  readonly reason: string | null;
  readonly idempotencyKey: string;
}

export interface PaymentCheckoutRequest {
  readonly transactionId: PaymentTransactionId;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly methodType: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly providerName: string | null;
}

export interface PaymentAttachMethodRequest {
  readonly providerName: string;
  readonly type: string;
  readonly token: string;
}

export interface PaymentTransactionResponse {
  readonly id: PaymentTransactionId;
  readonly invoiceId: InvoiceId;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly status: PaymentStatus;
  readonly providerName: string;
  readonly providerTransactionId: string | null;
  readonly paymentMethodId: PaymentMethodId | null;
  readonly actionUrl: string | null;
  readonly idempotencyKey: string;
  readonly failureCode: string | null;
  readonly succeededAt: ISODateString | null;
  readonly canceledAt: ISODateString | null;
  readonly refunds: readonly PaymentRefundResponse[];
  readonly disputes: readonly PaymentDisputeResponse[];
  readonly tenantId: TenantId | null;
}

export interface PaymentRefundResponse {
  readonly id: PaymentRefundId;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly status: RefundStatus;
  readonly providerRefundId: string | null;
  readonly reason: string | null;
  readonly createdAt: ISODateString;
  readonly completedAt: ISODateString | null;
}

export interface PaymentDisputeResponse {
  readonly id: PaymentDisputeId;
  readonly providerDisputeId: string;
  readonly status: DisputeStatus;
  readonly reason: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly createdAt: ISODateString;
  readonly resolvedAt: ISODateString | null;
}

export interface PaymentCheckoutSessionResponse {
  readonly url: string;
  readonly sessionId: string;
  readonly expiresAt: ISODateString;
}

export interface PaymentMethodResponse {
  readonly id: PaymentMethodId;
  readonly type: string;
  readonly providerName: string;
  readonly providerMethodId: string;
  readonly displayLabel: string;
  readonly isDefault: boolean;
  readonly expiresAt: ISODateString | null;
  readonly tenantId: TenantId | null;
}

export interface PaymentAvailableMethodResponse {
  readonly methodType: string;
  readonly category: PaymentMethodCategory;
  readonly providerName: string;
  readonly displayLabel: string;
}
