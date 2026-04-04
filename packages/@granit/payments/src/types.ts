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
  readonly invoiceId: string;
  readonly amount: number;
  readonly currency: string;
  readonly methodType: string;
  readonly idempotencyKey: string;
  readonly providerName: string | null;
}

export interface PaymentRefundRequest {
  readonly transactionId: string;
  readonly amount: number;
  readonly reason: string | null;
  readonly idempotencyKey: string;
}

export interface PaymentCheckoutRequest {
  readonly transactionId: string;
  readonly amount: number;
  readonly currency: string;
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
  readonly id: string;
  readonly invoiceId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly providerName: string;
  readonly providerTransactionId: string | null;
  readonly paymentMethodId: string | null;
  readonly actionUrl: string | null;
  readonly idempotencyKey: string;
  readonly failureCode: string | null;
  readonly succeededAt: string | null;
  readonly canceledAt: string | null;
  readonly refunds: readonly PaymentRefundResponse[];
  readonly disputes: readonly PaymentDisputeResponse[];
  readonly tenantId: string | null;
}

export interface PaymentRefundResponse {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: RefundStatus;
  readonly providerRefundId: string | null;
  readonly reason: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface PaymentDisputeResponse {
  readonly id: string;
  readonly providerDisputeId: string;
  readonly status: DisputeStatus;
  readonly reason: string;
  readonly amount: number;
  readonly currency: string;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
}

export interface PaymentCheckoutSessionResponse {
  readonly url: string;
  readonly sessionId: string;
  readonly expiresAt: string;
}

export interface PaymentMethodResponse {
  readonly id: string;
  readonly type: string;
  readonly providerName: string;
  readonly providerMethodId: string;
  readonly displayLabel: string;
  readonly isDefault: boolean;
  readonly expiresAt: string | null;
  readonly tenantId: string | null;
}

export interface PaymentAvailableMethodResponse {
  readonly methodType: string;
  readonly category: PaymentMethodCategory;
  readonly providerName: string;
  readonly displayLabel: string;
}
