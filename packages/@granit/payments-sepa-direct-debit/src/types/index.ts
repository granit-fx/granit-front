/** Lifecycle status of a SEPA Direct Debit mandate. */
export type MandateStatus = 'Pending' | 'Active' | 'Suspended' | 'Cancelled' | 'Failed' | 'Expired';

/** SEPA Direct Debit scheme. `Core` for consumers, `B2B` for businesses. */
export type SddScheme = 'Core' | 'B2B';

/** How a mandate's consent was captured. */
export type ConsentSource = 'AdminConfirm' | 'ProviderWebhook' | 'CustomerSelfService';

/** Settlement status of a single direct-debit collection. */
export type CollectionStatus =
  | 'Pending'
  | 'Submitted'
  | 'Processing'
  | 'Succeeded'
  | 'Failed'
  | 'Refunded';

/**
 * Set up a new mandate for a debtor. The debtor IBAN is validated server-side
 * and never echoed back unmasked.
 */
export interface CreateMandateRequest {
  readonly debtorPartyId: string;
  readonly debtorName: string;
  readonly debtorIban: string;
  readonly debtorBic?: string | null;
  /** Override the tenant's default scheme for this mandate. */
  readonly scheme?: SddScheme | null;
  /** Override the tenant's default provider for this mandate. */
  readonly providerName?: string | null;
  /** Where the provider redirects after a hosted signature flow. */
  readonly redirectUrl?: string | null;
}

/** Confirm (activate) a pending mandate after the debtor's signature. */
export interface ConfirmMandateRequest {
  /** When the debtor signed (ISO 8601). */
  readonly signedAt: string;
  /** Reference to the stored signed document, when activation is overridden. */
  readonly documentReference?: string | null;
}

/**
 * Result of {@link CreateMandateRequest}. `redirectUrl` is present when the
 * provider hosts the signature flow; `null` for in-house confirmation.
 */
export interface MandateSetupResponse {
  readonly id: string;
  readonly mandateReference: string;
  readonly status: MandateStatus;
  readonly redirectUrl: string | null;
}

/** A mandate, with the debtor IBAN masked. */
export interface MandateResponse {
  readonly id: string;
  readonly mandateReference: string;
  readonly status: MandateStatus;
  readonly scheme: SddScheme;
  readonly debtorName: string;
  readonly debtorIbanMasked: string;
  readonly creditorId: string;
  readonly providerName: string | null;
  readonly providerMandateId: string | null;
  readonly signedAt: string | null;
  readonly activatedAt: string | null;
  readonly cancelledAt: string | null;
  readonly tenantId: string | null;
  readonly concurrencyStamp: string;
}

/** Create or update the tenant's SEPA Direct Debit configuration. */
export interface SepaConfigurationRequest {
  /** Creditor Identifier (SCI). Locked once the tenant has mandates. */
  readonly creditorId: string;
  readonly defaultScheme: SddScheme;
  readonly creditorName?: string | null;
  readonly defaultProviderName?: string | null;
  readonly isActive?: boolean;
  readonly companyPartyId?: string | null;
  readonly creditorIban?: string | null;
  readonly creditorBic?: string | null;
}

/** The tenant's SEPA Direct Debit configuration, with the creditor IBAN masked. */
export interface SepaConfigurationResponse {
  readonly creditorId: string;
  readonly creditorName: string | null;
  readonly defaultScheme: SddScheme;
  readonly defaultProviderName: string | null;
  readonly isActive: boolean;
  readonly companyPartyId: string | null;
  readonly creditorIbanMasked: string | null;
  readonly creditorBic: string | null;
  readonly tenantId: string | null;
  readonly concurrencyStamp: string;
}

/** Verifiable consent evidence captured when a mandate is activated. */
export interface ConsentEvidence {
  readonly signedAt?: string;
  readonly source?: ConsentSource;
  readonly sourceIpMasked?: string | null;
  readonly actor?: string | null;
  readonly actorKind?: string | null;
  readonly documentReference?: string | null;
  readonly userAgent?: string | null;
}

/** A single collection (debit) executed against a mandate. */
export interface DirectDebitPayment {
  readonly id?: string;
  readonly invoiceId?: string;
  readonly amount?: number;
  readonly currency?: string;
  readonly status?: CollectionStatus;
  readonly scheduledDate?: string;
  readonly submittedAt?: string | null;
  readonly settledAt?: string | null;
  readonly failureCode?: string | null;
  readonly failureReason?: string | null;
  readonly providerCollectionId?: string | null;
}

/**
 * Mandate row as returned by the query-engine admin grid
 * (`GET /sepa-direct-debit/mandates`). Richer than {@link MandateResponse}:
 * carries consent evidence, activation source, and the collection history.
 */
export interface Mandate {
  readonly id?: string;
  readonly mandateReference?: string;
  readonly status?: MandateStatus;
  readonly scheme?: SddScheme;
  readonly debtorName?: string;
  readonly debtorIban?: string;
  readonly debtorBic?: string | null;
  readonly creditorId?: string;
  readonly debtorPartyId?: string;
  readonly debtorBankAccountId?: string | null;
  readonly signedAt?: string | null;
  readonly activatedAt?: string | null;
  readonly cancelledAt?: string | null;
  readonly lastCollectionAt?: string | null;
  readonly providerName?: string | null;
  readonly providerMandateId?: string | null;
  readonly consent?: ConsentEvidence | null;
  readonly activationSource?: ConsentSource | null;
  readonly collections?: readonly DirectDebitPayment[] | null;
  readonly tenantId?: string | null;
  readonly concurrencyStamp?: string;
  readonly modifiedAt?: string | null;
  readonly modifiedBy?: string | null;
  readonly createdAt?: string;
  readonly createdBy?: string;
}
