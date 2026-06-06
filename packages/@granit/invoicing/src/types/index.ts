import type { EntityId } from '@granit/types';

/** Branded identifier for an invoice. */
export type InvoiceId = EntityId<'Invoice'>;

/** The document type of an invoice. */
export type InvoiceDocumentType = 'Invoice' | 'CreditNote';

/** How payment is collected for an invoice. */
export type CollectionMethod = 'ChargeAutomatically' | 'SendInvoice';

/** Lifecycle status of an invoice. */
export type InvoiceStatus = 'Draft' | 'Open' | 'Paid' | 'Cancelled' | 'Uncollectible';

/** The origin type of an invoice (determines template and revenue recognition). */
export type InvoiceSourceType = 'Subscription' | 'Usage' | 'OneShot' | 'Credit';

/** The reason an invoice was created. */
export type BillingReason =
  | 'SubscriptionCreate'
  | 'SubscriptionCycle'
  | 'SubscriptionUpdate'
  | 'Manual';

/** Payload for finalizing a Draft invoice (Draft → Open). */
export interface FinalizeInvoiceRequest {
  /** Timestamp at which the document is issued (ISO 8601). */
  readonly issuedAt: string;
  /** Payment deadline — ignored for credit notes (ISO 8601). */
  readonly dueAt: string | null;
  /** Optional comment persisted on the workflow transition record (ISO 27001). */
  readonly comment?: string | null;
}

/** Payload for cancelling an invoice (Open / Uncollectible → Cancelled). */
export interface CancelInvoiceRequest {
  /** Optional motive persisted on the workflow transition record (ISO 27001 audit trail). */
  readonly reason?: string | null;
}

/** Payload for marking an Open invoice as Uncollectible (bad debt). */
export interface MarkInvoiceUncollectibleRequest {
  /** Optional motive persisted on the workflow transition record (ISO 27001 audit trail). */
  readonly reason?: string | null;
}

/** Payload for creating a new invoice. */
export interface InvoiceCreateRequest {
  readonly partyId: string;
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
