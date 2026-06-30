import type { FieldConflict, MergeRequest, MergeResult, WinnerSide } from '@granit/entity-merge';
import type { EntityId, TenantId, UserId, ISODateString } from '@granit/types';

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

/** Branded identifier for a row in the duplicate-candidates review table. */
export type PartyDuplicateCandidateId = EntityId<'PartyDuplicateCandidate'>;

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

// Note: the wire representation of {@link PartyRole} flags is a plain `string` —
// either a single role (`"Customer"`) or a comma-separated list
// (`"Customer, Supplier"`), matching the JSON serialisation of a `[Flags]` enum.
// We deliberately do not introduce a `type PartyRoles = string` alias because the
// alias adds no semantic value and Sonar (S6564) flags it as redundant; APIs
// that previously accepted `PartyRoles` now accept `string` directly.

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
  readonly street1: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
  readonly street2: string | null;
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
  readonly parentPartyId: PartyId | null;
  readonly userId: UserId | null;
  readonly avatar: string | null;
  readonly roles: string;
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
  /** UTC instant the party was created (ISO 8601). Always present. */
  readonly createdAt: ISODateString;
  /** Last-modification timestamp; `null` until first modified (coalesce `?? createdAt`). */
  readonly modifiedAt: ISODateString | null;
}

/**
 * Lightweight summary row for the query-engine party grid.
 *
 * This is a denormalized GRID PROJECTION, not a wire DTO: there is no matching
 * schema in `contracts/openapi/parties.json`. In the spec's `Party` projection,
 * `primaryEmail` / `primaryPhone` are full `PartyEmail` / `PartyPhone` objects;
 * here they are flattened to the display string (the email address / phone
 * number) consumed by `party-columns.tsx`. Keep the field set aligned with the
 * columns rendered there, not with the backend `Party` projection.
 */
export interface PartyListItemResponse {
  readonly id: PartyId;
  readonly tenantId: TenantId | null;
  readonly kind: PartyKind;
  readonly name: string;
  readonly roles: string;
  readonly status: PartyStatus;
  readonly defaultCurrency: string;
  /** Flattened from the projection's `primaryEmail.address` (denormalized). */
  readonly primaryEmail: string | null;
  /** Flattened from the projection's `primaryPhone.number` (denormalized). */
  readonly primaryPhone: string | null;
}

// ── Request payloads ─────────────────────────────────────────────────────

/** Request payload to create a new party. */
export interface PartyCreateRequest {
  readonly kind: PartyKind;
  readonly name: string;
  readonly defaultCurrency: string;
  readonly roles?: string | null;
  readonly website?: string | null;
  readonly language?: string | null;
  readonly timezone?: string | null;
  readonly taxId?: string | null;
  readonly registrationNumber?: string | null;
  /** Admin-only free-form notes (max 8 000 chars). NEVER store PII. */
  readonly internalNotes?: string | null;
}

/**
 * Optional knobs on {@link createParty}. Carry the per-call duplicate-check
 * bypass flags surfaced by the admin endpoints.
 *
 * - `force` translates to `?force=true` on the URL — UI flow ("Create anyway"
 *   button on the conflict dialog).
 * - `skipDuplicateCheck` translates to the `X-Skip-Duplicate-Check: true`
 *   header — bulk-import flow where the caller has already de-duplicated
 *   upstream and doesn't want the per-row Tier-1 check to run.
 *
 * Both are independent and can be combined (header wins server-side).
 */
export interface CreatePartyOptions {
  readonly force?: boolean;
  readonly skipDuplicateCheck?: boolean;
}

/**
 * Lightweight match summary included in a 409 create-conflict response. Each
 * entry points to an existing party that the Tier-1 (Deterministic) detector
 * matched against the inbound payload.
 */
export interface PartyCreateDuplicateCandidate {
  readonly candidateId: PartyId;
  readonly score: number;
  readonly tier: DuplicateMatchTier;
  readonly signals: readonly DuplicateMatchSignalResponse[];
}

/**
 * 409 response body returned by `POST {basePath}` when the server's Tier-1
 * (Deterministic) duplicate detector matches the inbound payload against an
 * existing party. The client typically renders a "potential duplicates"
 * dialog letting the operator pick: use the existing party, retry with
 * `force: true`, or merge into the matched party.
 *
 * `candidates` carries the lightweight summary for each match (max 5 rows).
 */
export interface PartyCreateConflictResponse {
  readonly reason: string;
  readonly candidates: readonly PartyCreateDuplicateCandidate[];
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
  readonly street1: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
  readonly street2?: string | null;
  readonly state?: string | null;
  readonly isDefault?: boolean;
  readonly label?: string | null;
}

/**
 * Request payload to record a manual deliverability confirmation for a party
 * address (tier-2 evidence). `evidence` is optional (absent from the spec's
 * `required` set) and nullable; capped at 256 chars server-side.
 */
export interface PartyAddressConfirmRequest {
  readonly evidence?: string | null;
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

/**
 * Request payload to set a party's customer-specific tax status.
 *
 * Spec `required` is only `[isExempt, reverseCharge]`; `vatin` and
 * `evidenceBlobId` are optional (absent from the `required` array) yet nullable.
 */
export interface PartyTaxStatusRequest {
  readonly isExempt: boolean;
  readonly reverseCharge: boolean;
  readonly vatin?: string | null;
  readonly evidenceBlobId?: EvidenceBlobId | null;
}

// ── Merge ────────────────────────────────────────────────────────────────
// The merge contracts are aggregate-agnostic and live in `@granit/entity-merge`
// (mirror of the .NET `Granit.EntityMerge` module). Parties re-exports them with
// the branded `PartyId`, preserving the historical names consumers import.

/**
 * Side that wins a merge conflict. Alias of {@link WinnerSide} from
 * `@granit/entity-merge`.
 */
export type MergeWinner = WinnerSide;

/**
 * Wire shape of a single field-level conflict. Alias of {@link FieldConflict}
 * from `@granit/entity-merge` — both values are pre-stringified server-side.
 */
export type FieldConflictResponse = FieldConflict;

/**
 * Body of `POST /parties/{survivorId}/merge`. {@link MergeRequest} specialised
 * with the branded {@link PartyId}.
 */
export type PartyMergeRequest = MergeRequest<PartyId>;

/**
 * Response body for both `GET .../merge/preview` and `POST .../merge`.
 * {@link MergeResult} specialised with the branded {@link PartyId}. The survivor
 * aggregate itself is NOT included — fetch it via `GET /parties/{survivorId}`
 * after a successful live merge. The `rewriteCounts` keys are the cross-module
 * rewriter descriptions (`"Invoice.PartyId"`, `"Subscription.PartyId"`,
 * `"BalanceAccount.PartyId"`, `"Party.ParentContactId"`, `"Party.Children"`, …).
 */
export type PartyMergeResponse = MergeResult<PartyId>;

// ── Duplicate detection (3-tier pipeline) ────────────────────────────────

/**
 * Detection tier reported by the deduplication pipeline. Mirrors the .NET
 * `DuplicateMatchTier` enum.
 *
 * - `Deterministic` — exact match on a discriminating identifier (TaxId, …).
 * - `Blocking` — strong fuzzy match (e.g. same email domain + similar name).
 * - `Fuzzy` — weaker similarity, surfaces only via the recurring scan.
 */
export type DuplicateMatchTier = 'Deterministic' | 'Blocking' | 'Fuzzy';

/** A single weighted contribution surfaced under a candidate's signals list. */
export interface DuplicateMatchSignalResponse {
  /** Signal kind (e.g. `"TaxIdEqual"`, `"NameTrigram"`, `"EmailDomain"`). */
  readonly kind: string;
  /** Per-signal score in `[0, 1]`. */
  readonly score: number;
}

/**
 * Wire view of a row in the `parties_duplicate_candidates` review table.
 * Returned by both `GET /parties/duplicates` (paged via QueryEngine) and
 * `GET /parties/{id}/duplicate-candidates` (flat per-party listing).
 */
export interface PartyDuplicateCandidateResponse {
  /** Stable id of the candidate-pair row — used to dismiss / merge. */
  readonly id: PartyDuplicateCandidateId;
  /** Lower id of the ordered pair. */
  readonly partyId: PartyId;
  /** Higher id of the ordered pair. */
  readonly candidateId: PartyId;
  /** Aggregated confidence in `[0, 1]`. */
  readonly score: number;
  readonly tier: DuplicateMatchTier;
  /** Per-signal contributions, sorted by score descending. */
  readonly signals: readonly DuplicateMatchSignalResponse[];
  /** When an admin marked the pair as "not a duplicate"; `null` while pending. */
  readonly dismissedAt: ISODateString | null;
  /** When the pair was first detected. */
  readonly createdAt: ISODateString;
  /** When the pair was last refreshed by a re-scan; `null` on initial detection. */
  readonly updatedAt: ISODateString | null;
}

/**
 * Body of `POST /parties/duplicates/{id}/merge` — shortcut that resolves the
 * candidate row to its (survivor, loser) pair and forwards to the merge
 * orchestrator. The loser is inferred from the row (the other end of the
 * pair); 422 if `survivorId` is not part of the pair.
 */
export interface PartyDuplicateMergeRequest {
  /** Which end of the candidate pair survives. */
  readonly survivorId: PartyId;
  /** Per-field admin overrides — same semantics as {@link PartyMergeRequest.choices}. */
  readonly choices?: Readonly<Record<string, MergeWinner>>;
  /** Optional admin justification — captured in the audit log. */
  readonly reason?: string | null;
}
