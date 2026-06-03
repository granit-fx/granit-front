// Re-export types and enum objects from @granit/hostnames so consumers don't
// need to depend on both packages.
export { CertificateStatus, ManagedHostnameStatus } from '@granit/hostnames';
export type {
  CertificateStatusReportRequest,
  CheckAvailabilityResponse,
  ExpectedDnsRecord,
  ManagedHostnameResponse,
} from '@granit/hostnames';

// ─── API ──────────────────────────────────────────────────────────────────────
export {
  addSiteHostname,
  checkSiteHostnameAvailability,
  clearSiteHostnamePrimary,
  listSiteHostnames,
  removeSiteHostname,
  setSiteHostnamePrimary,
  verifySiteHostname,
} from './api/hostnames';
