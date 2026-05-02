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

/**
 * Wire representation of {@link PartyRole} flags. Either a single role
 * (`"Customer"`) or a comma-separated list (`"Customer, Supplier"`),
 * matching the JSON serialisation of a `[Flags]` enum. Typed as `string`
 * because `[Flags]` combinations are open-ended (any subset of {@link PartyRole}).
 */
export type PartyRoles = string;

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
 * 409 response body returned by `POST {basePath}` when the server's Tier-1
 * (Deterministic) duplicate detector matches the inbound payload against an
 * existing party. The client typically renders a "potential duplicates"
 * dialog letting the operator pick: use the existing party, retry with
 * `force: true`, or merge into the matched party.
 *
 * `candidates` carries the lightweight summary for each match (max 5 rows).
 * `tier` always equals `'Deterministic'` today — the `Blocking` and `Fuzzy`
 * tiers run asynchronously via the scan job and never short-circuit a create.
 */
export interface PartyCreateConflictResponse {
  readonly title: string;
  readonly detail: string;
  readonly tier: DuplicateMatchTier;
  readonly candidates: readonly PartyListItemResponse[];
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

// ── Merge ────────────────────────────────────────────────────────────────

/**
 * Side that wins a merge conflict. Mirrors the .NET `WinnerSide` enum used
 * by `Granit.Mergeable` and the merge orchestrator.
 */
export type MergeWinner = 'Survivor' | 'Loser';

/**
 * Wire shape of a single field-level conflict. Both values are pre-stringified
 * server-side so the JSON payload stays predictable regardless of the
 * underlying type (`Survivor.ToString()` / `Loser.ToString()`).
 */
export interface FieldConflictResponse {
  /** Dot-separated path; e.g. `"Name"`, `"Metadata.segment"`, `"TaxStatus"`. */
  readonly fieldPath: string;
  /** Survivor's current value, stringified — `null` if unset or empty. */
  readonly survivorValue: string | null;
  /** Loser's current value, stringified — `null` if unset or empty. */
  readonly loserValue: string | null;
  /** Recommended winner pre-populated by the orchestrator. */
  readonly default: MergeWinner;
}

/**
 * Body of `POST /parties/{survivorId}/merge`. Identifies the loser, carries
 * per-field admin overrides keyed by {@link FieldConflictResponse.fieldPath},
 * and an optional reason captured in the audit log.
 */
export interface PartyMergeRequest {
  /** Id of the party to merge into the survivor (will be tombstoned). */
  readonly loserId: PartyId;
  /**
   * Per-field admin overrides. Missing keys fall back to the recommended
   * `default` returned by the preview. Empty / omitted = use defaults.
   */
  readonly choices?: Readonly<Record<string, MergeWinner>>;
  /** Free-form admin justification — captured in the audit log. Max 1 000 chars. */
  readonly reason?: string | null;
  /**
   * When `true`, the orchestrator computes conflicts and rewrite counts without
   * committing — same shape as the preview endpoint. Useful for re-validating
   * just before committing the live merge.
   */
  readonly dryRun?: boolean;
}

/**
 * Response body for both `GET .../merge/preview` and `POST .../merge`. The
 * survivor aggregate itself is NOT included — fetch it via
 * `GET /parties/{survivorId}` after a successful live merge.
 */
export interface PartyMergeResponse {
  readonly survivorId: PartyId;
  readonly loserId: PartyId;
  /** Per-field conflicts with the recommended winner pre-populated. */
  readonly conflicts: readonly FieldConflictResponse[];
  /**
   * For each cross-module rewriter (`"Invoice.PartyId"`, `"Subscription.PartyId"`,
   * `"BalanceAccount.PartyId"`, `"Party.ParentContactId"`, `"Party.Children"`, …),
   * the number of rows that were (or would be) rewritten. Powers the
   * "what will change" preview.
   */
  readonly rewriteCounts: Readonly<Record<string, number>>;
  /** `true` for previews and explicit dry-runs; `false` for committed merges. */
  readonly dryRun: boolean;
}

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
  readonly dismissedAt: string | null;
  /** When the pair was first detected. */
  readonly createdAt: string;
  /** When the pair was last refreshed by a re-scan; `null` on initial detection. */
  readonly updatedAt: string | null;
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
