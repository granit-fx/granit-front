export type {
  BffConfig,
  BffCsrfTokenResponse,
  BffHostUser,
  BffSessionId,
  BffSessionInfo,
  BffSessionListResponse,
  BffTenantUser,
  BffUnauthenticated,
  BffUser,
  BffUserResponse,
} from './types/index';

// Re-export the shared session-enrichment contracts so consumers can type the
// `location` / `riskLevel` fields of BffSessionInfo without reaching into the
// owning packages directly.
export type { GeoLocation } from '@granit/ip-geolocation';
export type { UserSessionRiskLevel } from '@granit/identity-abstractions';

export { CsrfManager } from './csrf/index';

export {
  listBffSessions,
  revokeAllOtherBffSessions,
  revokeBffSession,
} from './api/bff-session-api';

export { parseBffSessionList, parseBffSessionResponse } from './validation/index';
export type { ParseResult } from './validation/index';
