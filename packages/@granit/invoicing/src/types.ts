import type { CurrencyCode, EntityId, ISODateString } from '@granit/types';

export type InvoiceId = EntityId<'Invoice'>;
export type InvoiceLineItemId = EntityId<'InvoiceLineItem'>;

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
  readonly currency: CurrencyCode;
  readonly collectionMethod: CollectionMethod;
  readonly billingReason: BillingReason;
  readonly parentInvoiceId: InvoiceId | null;
  readonly creditNoteReason: string | null;
  readonly periodStart: ISODateString | null;
  readonly periodEnd: ISODateString | null;
}

/** A single line item within an invoice. */
export interface InvoiceLineItemResponse {
  readonly id: InvoiceLineItemId;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly amount: number;
  readonly taxRate: number | null;
  readonly taxAmount: number;
  readonly sourceType: string;
  readonly sourceId: string | null;
  readonly periodStart: ISODateString | null;
  readonly periodEnd: ISODateString | null;
}

/** Full invoice response from the API. */
export interface InvoiceResponse {
  readonly id: InvoiceId;
  readonly documentType: string;
  readonly invoiceNumber: string | null;
  readonly status: string;
  readonly collectionMethod: string;
  readonly billingReason: string;
  readonly currency: CurrencyCode;
  readonly subtotal: number;
  readonly taxTotal: number;
  readonly total: number;
  readonly amountPaid: number;
  readonly amountCredited: number;
  readonly amountRemaining: number;
  readonly parentInvoiceId: InvoiceId | null;
  readonly creditNoteReason: string | null;
  readonly issuedAt: ISODateString | null;
  readonly dueAt: ISODateString | null;
  readonly paidAt: ISODateString | null;
  readonly periodStart: ISODateString | null;
  readonly periodEnd: ISODateString | null;
  readonly lineItems: readonly InvoiceLineItemResponse[];
}
