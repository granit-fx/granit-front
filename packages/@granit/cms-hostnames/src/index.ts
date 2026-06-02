// Re-export underlying types from @granit/hostnames so consumers don't need to
// depend on both packages.
export type {
  CertificateStatusReportRequest,
  CheckAvailabilityResponse,
  ManagedHostnameResponse,
  ManagedHostnameStatus,
  CertificateStatus,
  ExpectedDnsRecord,
} from '@granit/hostnames';
export { ManagedHostnameStatus, CertificateStatus } from '@granit/hostnames';

// ─── API ──────────────────────────────────────────────────────────────────────
export {
  addSiteHostname,
  checkSiteHostnameAvailability,
  clearSiteHostnamePrimary,
  listSiteHostnames,
  removeSiteHostname,
  setSiteHostnamePrimary,
  verifySiteHostname,
} from './api/hostnames.js';
