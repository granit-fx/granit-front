// ---------------------------------------------------------------------------
// @granit/cms-hostnames — site-scoped hostname DTOs
//
// Mirrors Granit.Cms.Hostnames.Endpoints/Dtos/SiteHostnameDtos.cs. These are the
// narrow, site-scoped CMS DTOs — NOT the generic @granit/hostnames contract.
// Field optionality follows the .NET `required`/C#-default rule (see CLAUDE.md):
// a positional-record parameter without a C# default is `required` (key present,
// value possibly null); only parameters with a C# default are TS-optional.
// ---------------------------------------------------------------------------

/**
 * DNS record type the owner must configure for verification.
 *
 * Mirrors the backend `DnsRecordType` enum projected via `RecordType.ToString()`.
 */
export type SiteHostnameDnsRecordType = 'A' | 'Aaaa' | 'Cname' | 'Txt';

/**
 * A DNS record the owner must configure for verification to succeed.
 *
 * Mirrors `SiteHostnameDnsRecordResponse`.
 */
export interface SiteHostnameDnsRecordResponse {
  /** DNS record type (`A`, `Aaaa`, `Cname`, `Txt`). */
  readonly recordType: SiteHostnameDnsRecordType;
  /** Record name (host). */
  readonly name: string;
  /** Expected record value. */
  readonly value: string;
}

/**
 * A managed hostname of a CMS site, projected for the admin surface.
 *
 * Mirrors `SiteHostnameResponse`.
 */
export interface SiteHostnameResponse {
  /** Hostname identifier (Guid). */
  readonly id: string;
  /** The fully-qualified hostname. */
  readonly host: string;
  /** Lifecycle status (`Pending`, `Verifying`, `Active`, `Error`). */
  readonly status: string;
  /** Whether this is the site's canonical hostname. */
  readonly isPrimary: boolean;
  /** DNS records the owner must configure (empty until verification starts). */
  readonly expectedDnsRecords: readonly SiteHostnameDnsRecordResponse[];
  /** When the last DNS check ran; `null` before any check (DateTimeOffset). */
  readonly lastCheckedAt: string | null;
  /** Edge-reported TLS certificate state. */
  readonly certificateStatus: string;
}

/**
 * Result of an availability pre-check for a candidate hostname.
 *
 * Mirrors `SiteHostnameAvailabilityResponse`.
 */
export interface SiteHostnameAvailabilityResponse {
  /** The normalised hostname that was checked. */
  readonly host: string;
  /** `true` when the host is free (globally unique) and can be claimed. */
  readonly available: boolean;
}

/**
 * Request to register a hostname for a CMS site.
 *
 * Mirrors `SiteHostnameCreateRequest` — `IsPrimary` has a C# default (`false`),
 * so it is genuinely optional.
 */
export interface SiteHostnameCreateRequest {
  /** The fully-qualified domain name to register (e.g. `www.acme.com`). */
  readonly host: string;
  /** Whether this should be the site's canonical hostname. Defaults to `false`. */
  readonly isPrimary?: boolean;
}
