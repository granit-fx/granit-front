// ─── Types ──────────────────────────────────────────────────────────────────
export type {
  SiteHostnameAvailabilityResponse,
  SiteHostnameCreateRequest,
  SiteHostnameDnsRecordResponse,
  SiteHostnameDnsRecordType,
  SiteHostnameResponse,
} from './types/index';

// ─── API ──────────────────────────────────────────────────────────────────────
export {
  addSiteHostname,
  checkSiteHostnameAvailability,
  listSiteHostnames,
  removeSiteHostname,
  verifySiteHostname,
} from './api/hostnames';
