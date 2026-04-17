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
  readonly providerName: string | null;
}

export interface PaymentRefundRequest {
  readonly transactionId: string;
  readonly amount: number;
  readonly reason: string | null;
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
  /**
   * Provider-advertised capability for this method at snapshot time.
   * `null` on legacy records activated before capability snapshotting landed —
   * runtime filtering treats `null` as wildcard.
   */
  readonly capability: PaymentMethodCapabilityResponse | null;
}

/** Transaction sequence type — matches the backend `PaymentMethodSequenceType` enum. */
export type PaymentMethodSequenceTypeName = 'oneoff' | 'first' | 'recurring';

/**
 * Per-currency amount bounds. `null` on either side means unbounded on that side.
 * Backend contract: `minAmount` / `maxAmount` are both nullable and may coexist
 * (a floor without a ceiling, or vice-versa).
 */
export interface PaymentMethodAmountBoundResponse {
  readonly currencyCode: string;
  readonly minAmount: number | null;
  readonly maxAmount: number | null;
}

/**
 * Provider-advertised capability for a payment method.
 *
 * An empty set on any of the first three axes means "wildcard" (no restriction
 * on that axis) — UIs should render "Global" / "All currencies" / all sequence
 * types rather than "none".
 */
export interface PaymentMethodCapabilityResponse {
  /** ISO-3166 alpha-2 country codes (upper-case). Empty = global. */
  readonly supportedCountries: readonly string[];
  /** ISO-4217 alpha-3 currency codes (upper-case). Empty = all currencies. */
  readonly supportedCurrencies: readonly string[];
  /** Supported transaction sequence types. Empty = all sequence types. */
  readonly supportedSequenceTypes: readonly PaymentMethodSequenceTypeName[];
  /** Per-currency amount bounds. Missing entry for a currency = unbounded. */
  readonly amountBounds: readonly PaymentMethodAmountBoundResponse[];
}

/** A single payment method declared by a provider with its activation state. */
export interface PaymentMethodConfigurationItem {
  readonly methodType: string;
  readonly displayLabel: string;
  /** Backend enum value (0=Card, 1=BankRedirect, 2=BankTransfer, 3=BankDebit, 4=Wallet, 5=BuyNowPayLater, 6=Voucher, 7=PointOfSale). */
  readonly category: number;
  readonly isActive: boolean;
  /**
   * Capability snapshot captured at activation (or last resync).
   * `null` on legacy records predating snapshotting — UI should flag these as
   * "pending refresh" and suggest a resync.
   */
  readonly capabilitySnapshot: PaymentMethodCapabilityResponse | null;
}

/** All methods declared by a single provider, with activation state. */
export interface PaymentProviderConfiguration {
  readonly providerName: string;
  readonly methods: readonly PaymentMethodConfigurationItem[];
}

/**
 * A method entry in the live provider catalog (fetched on-demand from the
 * provider via `GET /configuration/catalog`). Unlike `PaymentMethodConfigurationItem`,
 * `capability` is always present — the catalog is a live read from the provider,
 * not a stored snapshot.
 */
export interface PaymentCatalogMethod {
  readonly methodType: string;
  readonly category: number;
  readonly displayLabel: string;
  readonly capability: PaymentMethodCapabilityResponse;
  readonly isActive: boolean;
  /** `true` iff the activation record carries a persisted capability snapshot. */
  readonly hasSnapshot: boolean;
}

/** Catalog response for a single provider. */
export interface PaymentProviderCatalogResponse {
  readonly providerName: string;
  readonly methods: readonly PaymentCatalogMethod[];
}

/**
 * Optional runtime filter context for `GET /methods/available`.
 *
 * Every axis is independently optional — omitting an axis leaves it unfiltered.
 * The backend defaults `sequenceType` to `"oneoff"` when `amount` is provided;
 * the SDK intentionally does not re-apply that default client-side.
 */
export interface PaymentAvailabilityContext {
  /** ISO-3166 alpha-2 country code (case-insensitive on the wire). */
  readonly country?: string;
  /** ISO-4217 alpha-3 currency code (case-insensitive on the wire). */
  readonly currency?: string;
  /** Transaction amount in minor units (matches the currency). */
  readonly amount?: number;
  readonly sequenceType?: PaymentMethodSequenceTypeName;
}
