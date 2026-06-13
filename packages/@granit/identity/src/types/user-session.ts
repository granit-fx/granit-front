import type { DeviceKind, UserSessionRiskLevel } from '@granit/identity-abstractions';
import type { GeoLocation } from '@granit/ip-geolocation';
import type { EntityId, ISODateString } from '@granit/types';

/** Branded session identifier. */
export type UserSessionId = EntityId<'UserSession'>;

/** Branded device identifier. */
export type UserDeviceId = EntityId<'UserDevice'>;

/**
 * A single session in the canonical session list — mirrors
 * `Granit.Identity.Endpoints.Dtos.UserSessionResponse`.
 *
 * The same shape is served by the self-service endpoint (`GET /sessions`, the
 * caller's own sessions) and the admin endpoint
 * (`GET /identity/provider/users/{userId}/sessions`, another user's sessions).
 */
export type UserSessionResponse = {
  /** Opaque session identifier. */
  readonly sessionId: UserSessionId;
  /** Whether this is the caller's current session. Always `false` in the admin view. */
  readonly isCurrent: boolean;
  /** When the session was established. */
  readonly createdAt: ISODateString;
  /** Last observed activity, or null when not tracked. */
  readonly lastAccessedAt: ISODateString | null;
  /**
   * User-Agent captured at establishment, or null when unavailable.
   *
   * Client-controlled free text — display-only and length-bounded by consumers;
   * never interpolate into HTML.
   */
  readonly userAgent: string | null;
  /**
   * Client IP, masked to its network portion by default (GDPR data
   * minimisation); the raw value only when the deployment opts in via
   * `ExposeRawIpAddress`. Null when not captured.
   */
  readonly ipAddress: string | null;
  /** Approximate geolocation of the session IP, or null when unresolved. */
  readonly location: GeoLocation | null;
  /** Persisted risk classification, or null when no verdict was stored. */
  readonly riskLevel: UserSessionRiskLevel | null;
  /** Machine-readable reason codes behind the risk level, or null when not assessed. */
  readonly riskReasons: readonly string[] | null;
};

/**
 * A device a user has signed in from — mirrors
 * `Granit.Identity.Endpoints.Dtos.UserDeviceResponse`. Served by both the
 * self-service (`GET /devices`) and admin
 * (`GET /identity/provider/users/{userId}/devices`) endpoints.
 */
export type UserDeviceResponse = {
  /** Stable device identifier. */
  readonly deviceId: UserDeviceId;
  /** The client kind, used to compose a localized device label. */
  readonly kind: DeviceKind;
  /** Operating-system family, or null when unknown. */
  readonly operatingSystem: string | null;
  /** Browser family for browser devices; otherwise null. */
  readonly browser: string | null;
  /** Last observed activity from this device, or null when not tracked. */
  readonly lastSeen: ISODateString | null;
  /** Number of active sessions on this device. */
  readonly sessionCount: number;
  /** Approximate geolocation of the most recent activity, or null when unresolved. */
  readonly lastLocation: GeoLocation | null;
};

/**
 * Result of revoking every session except the caller's current one — mirrors
 * `Granit.Identity.Endpoints.Dtos.UserSessionsRevokedResponse`.
 */
export type UserSessionsRevokedResponse = {
  /** Number of sessions revoked. */
  readonly revokedCount: number;
};
