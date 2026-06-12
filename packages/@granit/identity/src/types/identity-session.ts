import type { GeoLocation } from '@granit/ip-geolocation';
import type { EntityId, ISODateString } from '@granit/types';
import type { UserSessionRiskLevel } from '@granit/user-sessions';

/** Branded session identifier for identity provider sessions. */
export type IdentitySessionId = EntityId<'IdentitySession'>;

/** Active session from the identity provider — mirrors Granit.Identity.IdentitySession .NET record. */
export type IdentitySession = {
  readonly sessionId: IdentitySessionId;
  readonly ipAddress: string | null;
  readonly startedAt: ISODateString;
  readonly lastAccess: ISODateString;
  readonly rememberMe: boolean;
  readonly clients: readonly string[];
  /** Approximate geolocation of the session IP, or null when unresolved. */
  readonly location: GeoLocation | null;
  /** Coarse risk level, or null when no verdict was stored for the session. */
  readonly riskLevel: UserSessionRiskLevel | null;
};

/** Device activity from the identity provider — mirrors Granit.Identity.IdentityDeviceActivity .NET record. */
export type IdentityDeviceActivity = {
  readonly ipAddress: string | null;
  readonly lastAccess: ISODateString;
  readonly device: string | null;
  readonly os: string | null;
  readonly osVersion: string | null;
  readonly browser: string | null;
  readonly mobile: boolean;
  readonly current: boolean;
  readonly sessions: readonly IdentitySession[];
  /** Approximate geolocation of the device's last-seen IP, or null when unresolved. */
  readonly location: GeoLocation | null;
};
