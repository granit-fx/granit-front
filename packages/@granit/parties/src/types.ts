import type { EntityId, TenantId, UserId } from '@granit/types';

/** Branded identifier for a Party (Tier / Business Partner). */
export type PartyId = EntityId<'Party'>;

/** Branded identifier for a party address. */
export type PartyAddressId = EntityId<'PartyAddress'>;

/** Branded identifier for a party email. */
export type PartyEmailId = EntityId<'PartyEmail'>;

/** Branded identifier for a party phone. */
export type PartyPhoneId = EntityId<'PartyPhone'>;

/** Branded identifier for an external mapping entry. */
export type PartyExternalMappingId = EntityId<'PartyExternalMapping'>;

/** Branded identifier for an evidence blob attached to a tax status. */
export type EvidenceBlobId = EntityId<'BlobReference'>;

/** Nature of a {@link Party} entity. Mirrors the .NET `PartyKind` enum. */
export type PartyKind = 'Individual' | 'Company' | 'Department';

/** Lifecycle status of a {@link Party}. Mirrors the .NET `PartyStatus` enum. */
export type PartyStatus = 'Active' | 'Suspended' | 'Archived';

/**
 * Set of roles a {@link Party} simultaneously plays. Mirrors the .NET `[Flags] PartyRoles` enum.
 *
 * The wire format is the comma-separated string produced by `System.Text.Json` when
 * serialising a `[Flags]` enum (e.g. `"Customer, Supplier"`). The role itself can also
 * be transmitted as a single value (`"Customer"`) on per-flag endpoints.
 */
export type PartyRole = 'None' | 'Customer' | 'Supplier' | 'Employee' | 'Lead';

/**
 * Wire representation of {@link PartyRole} flags. Either a single role or a
 * comma-separated list (matching the JSON serialisation of a `[Flags]` enum).
 */
export type PartyRoles = PartyRole | string;

/** Functional purpose of a {@link PartyAddressResponse}. Mirrors the .NET `AddressKind` enum. */
export type AddressKind = 'Billing' | 'Shipping' | 'Other';

/** Functional type of a {@link PartyPhoneResponse}. Mirrors the .NET `PhoneKind` enum. */
export type PhoneKind = 'Mobile' | 'Work' | 'Home' | 'Other';

// ── Sub-DTOs ──────────────────────────────────────────────────────────────

/** Address sub-DTO inside {@link PartyResponse}. */
export interface PartyAddressResponse {
  readonly id: PartyAddressId;
  readonly kind: AddressKind;
  readonly isDefault: boolean;
  readonly label: string | null;
  readonly line1: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
  readonly companyName: string | null;
  readonly line2: string | null;
  readonly state: string | null;
}

/** Email sub-DTO inside {@link PartyResponse}. */
export interface PartyEmailResponse {
  readonly id: PartyEmailId;
  readonly address: string;
  readonly isPrimary: boolean;
  readonly label: string | null;
}

/** Phone sub-DTO inside {@link PartyResponse}. */
export interface PartyPhoneResponse {
  readonly id: PartyPhoneId;
  readonly kind: PhoneKind;
  readonly number: string;
  readonly isPrimary: boolean;
  readonly label: string | null;
}

/** External-mapping sub-DTO inside {@link PartyResponse}. */
export interface PartyExternalMappingResponse {
  readonly id: PartyExternalMappingId;
  readonly providerName: string;
  readonly externalId: string;
}

/** Customer-specific tax classification (exempt / reverse-charge / standard). */
export interface PartyTaxStatusResponse {
  readonly isExempt: boolean;
  readonly reverseCharge: boolean;
  readonly vatin: string | null;
  readonly evidenceBlobId: EvidenceBlobId | null;
}

// ── Aggregate responses ──────────────────────────────────────────────────

/** Full party (Tier / Business Partner) response from the admin API. */
export interface PartyResponse {
  readonly id: PartyId;
  readonly tenantId: TenantId | null;
  readonly kind: PartyKind;
  readonly name: string;
  readonly defaultCurrency: string;
  readonly timezone: string;
  readonly language: string | null;
  readonly website: string | null;
  readonly taxId: string | null;
  readonly registrationNumber: string | null;
  readonly parentContactId: PartyId | null;
  readonly userId: UserId | null;
  readonly avatarBlobId: EvidenceBlobId | null;
  readonly roles: PartyRoles;
  readonly status: PartyStatus;
  readonly addresses: readonly PartyAddressResponse[];
  readonly emails: readonly PartyEmailResponse[];
  readonly phones: readonly PartyPhoneResponse[];
  readonly externalMappings: readonly PartyExternalMappingResponse[];
  readonly taxStatus: PartyTaxStatusResponse;
  /**
   * Stripe-style free-form key/value extensibility. Capped at 50 entries
   * (key ≤ 40 chars, value ≤ 500 chars). Surfaces in audit logs and GDPR
   * exports — NEVER store PII.
   */
  readonly metadata: Readonly<Record<string, string>>;
  /** Admin-only free-form notes (max 8 000 chars). NEVER store PII. */
  readonly internalNotes: string | null;
}

/** Lightweight summary used by list endpoints. */
export interface PartyListItemResponse {
  readonly id: PartyId;
  readonly tenantId: TenantId | null;
  readonly kind: PartyKind;
  readonly name: string;
  readonly roles: PartyRoles;
  readonly status: PartyStatus;
  readonly defaultCurrency: string;
  readonly primaryEmail: string | null;
  readonly primaryPhone: string | null;
}

// ── Request payloads ─────────────────────────────────────────────────────

/** Request payload to create a new party. */
export interface PartyCreateRequest {
  readonly kind: PartyKind;
  readonly name: string;
  readonly defaultCurrency: string;
  readonly roles?: PartyRoles | null;
  readonly website?: string | null;
  readonly language?: string | null;
  readonly timezone?: string | null;
  readonly taxId?: string | null;
  readonly registrationNumber?: string | null;
  /** Admin-only free-form notes (max 8 000 chars). NEVER store PII. */
  readonly internalNotes?: string | null;
}

/** Request payload to update a party's identity fields. */
export interface PartyUpdateRequest {
  readonly name: string;
  readonly website?: string | null;
  readonly language?: string | null;
  readonly timezone?: string | null;
  /** Admin-only free-form notes (max 8 000 chars). NEVER store PII. */
  readonly internalNotes?: string | null;
}

/**
 * Bulk-replace request for a party's free-form metadata dictionary. Pass an
 * empty object to clear all entries.
 */
export interface PartyMetadataRequest {
  readonly metadata: Readonly<Record<string, string>>;
}

/** Request payload to suspend a party. */
export interface PartySuspendRequest {
  readonly reason?: string | null;
}

/** Request payload to add an address to a party. */
export interface PartyAddressRequest {
  readonly kind: AddressKind;
  readonly line1: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
  readonly companyName?: string | null;
  readonly line2?: string | null;
  readonly state?: string | null;
  readonly isDefault?: boolean;
  readonly label?: string | null;
}

/** Request payload to add an email to a party. */
export interface PartyEmailRequest {
  readonly address: string;
  readonly isPrimary?: boolean;
  readonly label?: string | null;
}

/** Request payload to add a phone to a party. */
export interface PartyPhoneRequest {
  readonly kind: PhoneKind;
  readonly number: string;
  readonly isPrimary?: boolean;
  readonly label?: string | null;
}

/** Request payload to register an external provider identifier on a party. */
export interface PartyExternalMappingRequest {
  readonly providerName: string;
  readonly externalId: string;
}

/** Request payload to add or remove a single role flag on a party. */
export interface PartyRoleRequest {
  readonly role: PartyRole;
}

/** Request payload to set a party's customer-specific tax status. */
export interface PartyTaxStatusRequest {
  readonly isExempt: boolean;
  readonly reverseCharge: boolean;
  readonly vatin?: string | null;
  readonly evidenceBlobId?: EvidenceBlobId | null;
}
