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

// Validation constraints (generated from contracts/openapi/cms-hostnames.json)
export { cmsHostnamesConstraints } from './constraints';
