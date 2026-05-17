import type { EntityId } from '@granit/types';

/** Branded identifier for an invoice. */
export type InvoiceId = EntityId<'Invoice'>;

/** The document type of an invoice. */
export type InvoiceDocumentType = 'Invoice' | 'CreditNote';

/** How payment is collected for an invoice. */
export type CollectionMethod = 'ChargeAutomatically' | 'SendInvoice';

/** The reason an invoice was created. */
export type BillingReason =
  | 'Subscription'
  | 'SubscriptionCreate'
  | 'SubscriptionCycle'
  | 'SubscriptionUpdate'
  | 'Manual'
  | 'Upcoming';

/** Payload for creating a new invoice. */
export interface InvoiceCreateRequest {
  readonly documentType: InvoiceDocumentType;
  readonly currency: string;
  readonly collectionMethod: CollectionMethod;
  readonly billingReason: BillingReason;
  readonly parentInvoiceId: string | null;
  readonly creditNoteReason: string | null;
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
}

/** A single line item within an invoice. */
export interface InvoiceLineItemResponse {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly amount: number;
  readonly taxRate: number | null;
  readonly taxAmount: number;
  readonly sourceType: string;
  readonly sourceId: string | null;
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
}

/** Full invoice response from the API. */
export interface InvoiceResponse {
  readonly id: string;
  readonly documentType: string;
  readonly invoiceNumber: string | null;
  readonly status: string;
  readonly collectionMethod: string;
  readonly billingReason: string;
  readonly currency: string;
  readonly subtotal: number;
  readonly taxTotal: number;
  readonly total: number;
  readonly amountPaid: number;
  readonly amountCredited: number;
  readonly amountRemaining: number;
  readonly parentInvoiceId: string | null;
  readonly creditNoteReason: string | null;
  readonly issuedAt: string | null;
  readonly dueAt: string | null;
  readonly paidAt: string | null;
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
  readonly lineItems: readonly InvoiceLineItemResponse[];
}
