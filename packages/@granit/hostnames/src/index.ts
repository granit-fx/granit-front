// Types
export { CertificateStatus, DnsConflictType, ManagedHostnameStatus } from './types/index';

export type {
  CertificateStatusReportRequest,
  CheckAvailabilityResponse,
  CreateManagedHostnameRequest,
  DnsRecordType,
  ExpectedDnsRecord,
  HostnameConflict,
  ListHostnamesParams,
  ManagedHostnameResponse,
} from './types/index';

// API
export {
  checkAvailability,
  clearPrimary,
  createHostname,
  deleteHostname,
  getHostname,
  listHostnames,
  reportCertificateStatus,
  setPrimary,
  verifyNow,
} from './api/hostnames-api';

// Permissions
export { HostnamesPermissions } from './permissions';
