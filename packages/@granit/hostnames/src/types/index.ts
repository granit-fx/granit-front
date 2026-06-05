// ---------------------------------------------------------------------------
// Hostnames types — mirrors Granit.Hostnames .NET contract
// ---------------------------------------------------------------------------

/**
 * DNS verification and propagation status of a managed hostname.
 *
 * Mirrors `Granit.Hostnames.Domain.HostnameStatus` (.NET).
 * Serialized as PascalCase strings via the framework's global `JsonStringEnumConverter`.
 */
export type ManagedHostnameStatus = 'Pending' | 'Verifying' | 'Active' | 'Error';

export const ManagedHostnameStatus = {
  Pending: 'Pending',
  Verifying: 'Verifying',
  Active: 'Active',
  Error: 'Error',
} as const satisfies Record<string, ManagedHostnameStatus>;

/**
 * TLS certificate provisioning status of a managed hostname.
 *
 * Mirrors `Granit.Hostnames.Domain.CertificateStatus` (.NET).
 * Serialized as PascalCase strings via the framework's global `JsonStringEnumConverter`.
 */
export type CertificateStatus = 'Unprovisioned' | 'Provisioning' | 'Secured' | 'Error';

export const CertificateStatus = {
  Unprovisioned: 'Unprovisioned',
  Provisioning: 'Provisioning',
  Secured: 'Secured',
  Error: 'Error',
} as const satisfies Record<string, CertificateStatus>;

/**
 * DNS record type used for domain ownership verification.
 *
 * Mirrors `Granit.Hostnames.Domain.DnsRecordType` (.NET).
 */
export type DnsRecordType = 'A' | 'Aaaa' | 'Cname' | 'Txt';

// ── DNS records ─────────────────────────────────────────────────────────────

/** A DNS record that must be present for the hostname to pass verification. */
export interface ExpectedDnsRecord {
  readonly recordType: DnsRecordType;
  readonly name: string;
  readonly value: string;
}

// ── Conflicts ───────────────────────────────────────────────────────────────

/**
 * Category of DNS conflict detected during verification.
 *
 * Mirrors `Granit.Hostnames.Domain.DnsConflictType` (.NET).
 * Serialized as PascalCase strings via the framework's global `JsonStringEnumConverter`.
 */
export type DnsConflictType =
  | 'UnexpectedA'
  | 'UnexpectedAaaa'
  | 'DivergentCname'
  | 'MissingCname'
  | 'MissingTxt'
  | 'ResolutionFailure';

export const DnsConflictType = {
  UnexpectedA: 'UnexpectedA',
  UnexpectedAaaa: 'UnexpectedAaaa',
  DivergentCname: 'DivergentCname',
  MissingCname: 'MissingCname',
  MissingTxt: 'MissingTxt',
  ResolutionFailure: 'ResolutionFailure',
} as const satisfies Record<string, DnsConflictType>;

/** A conflict preventing a hostname from becoming active. Mirrors `DnsConflict` (.NET). */
export interface HostnameConflict {
  readonly conflictType: DnsConflictType;
  readonly details: string;
}

// ── Main DTO ─────────────────────────────────────────────────────────────────

/** Full hostname descriptor. Mirrors `ManagedHostnameResponse` (.NET). */
export interface ManagedHostnameResponse {
  readonly id: string;
  readonly host: string;
  readonly ownerType: string;
  readonly ownerId: string;
  readonly tenantId: string | null;
  readonly isPrimary: boolean;
  readonly status: ManagedHostnameStatus;
  readonly verificationToken: string | null;
  readonly expectedDnsRecords: readonly ExpectedDnsRecord[];
  readonly lastCheckedAt: string | null;
  readonly conflicts: readonly HostnameConflict[];
  readonly failedCheckCount: number;
  readonly nextCheckAt: string | null;
  readonly certificateStatus: CertificateStatus;
  readonly certExpiresAt: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly modifiedAt: string | null;
  readonly modifiedBy: string | null;
  readonly concurrencyStamp: string;
}

// ── Requests ─────────────────────────────────────────────────────────────────

/** Request body for `POST /`. Mirrors `CreateManagedHostnameRequest` (.NET). */
export interface CreateManagedHostnameRequest {
  readonly host: string;
  readonly ownerType: string;
  readonly ownerId: string;
  readonly tenantId?: string | null;
  readonly isPrimary?: boolean;
}

/** Query params for `GET /`. `ownerType` and `ownerId` are required by the backend. */
export interface ListHostnamesParams {
  readonly ownerType: string;
  readonly ownerId: string;
  readonly maxResults?: number;
}

// ── Availability ─────────────────────────────────────────────────────────────

/** Response from `GET /availability?host=`. Mirrors `HostnameAvailabilityResponse` (.NET). */
export interface CheckAvailabilityResponse {
  readonly host: string;
  readonly isAvailable: boolean;
}

// ── Certificate status webhook ────────────────────────────────────────────────

/** Request body for `POST /{id}/certificate-status`. Mirrors `ReportCertificateStatusRequest` (.NET). */
export interface CertificateStatusReportRequest {
  readonly status: CertificateStatus;
  readonly expiresAt?: string | null;
}
