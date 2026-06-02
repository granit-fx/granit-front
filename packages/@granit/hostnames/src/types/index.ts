// ---------------------------------------------------------------------------
// Hostnames types — mirrors Granit.Hostnames .NET contract
// ---------------------------------------------------------------------------

/**
 * DNS verification and propagation status of a managed hostname.
 *
 * Mirrors `Granit.Hostnames.Domain.ManagedHostnameStatus` (.NET).
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

/** DNS record type used for domain ownership verification. */
export type DnsRecordType = 'Cname' | 'Txt' | 'A';

// ── DNS records ─────────────────────────────────────────────────────────────

/** A DNS record that must be present for the hostname to pass verification. */
export interface ExpectedDnsRecord {
  readonly type: DnsRecordType;
  readonly name: string;
  readonly value: string;
}

// ── Conflicts ───────────────────────────────────────────────────────────────

/** A conflict preventing a hostname from becoming active. */
export interface HostnameConflict {
  readonly type: string;
  readonly details: string;
}

// ── Paginated list ───────────────────────────────────────────────────────────

/**
 * Generic pagination envelope used by the hostnames list endpoint.
 * Mirrors the Granit framework's standard `PagedResponse<T>`.
 *
 * `page` is **0-based**, matching the backend convention.
 */
export interface PagedResponse<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
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
  readonly updatedAt: string;
  readonly concurrencyStamp: string;
}

// ── Requests ─────────────────────────────────────────────────────────────────

/** Request body for `POST /`. */
export interface CreateManagedHostnameRequest {
  readonly host: string;
  readonly ownerType: string;
  readonly ownerId: string;
  readonly isPrimary?: boolean;
}

/** Request body for `PATCH /{id}`. */
export interface UpdateManagedHostnameRequest {
  readonly isPrimary: boolean;
}

/** Query params for `GET /`. */
export interface ListHostnamesParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly ownerType?: string;
  readonly ownerId?: string;
  readonly status?: ManagedHostnameStatus;
}

// ── Availability ─────────────────────────────────────────────────────────────

/** Response from `GET /check-availability?host=`. */
export interface CheckAvailabilityResponse {
  readonly isAvailable: boolean;
}

// ── Certificate status webhook ────────────────────────────────────────────────

/** Request body for `POST /{id}/certificate-status` (host-level webhook from certificate provider). */
export interface CertificateStatusReportRequest {
  readonly status: CertificateStatus;
  readonly certExpiresAt?: string | null;
  readonly errorDetails?: string | null;
}
