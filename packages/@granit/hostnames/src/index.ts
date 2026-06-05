// Types
export { CertificateStatus, DnsConflictType, HostnameStatus } from './types/index';

export type {
  CreateManagedHostnameRequest,
  DnsConflict,
  DnsRecordType,
  ExpectedDnsRecord,
  HostnameAvailabilityResponse,
  ListHostnamesParams,
  ManagedHostnameResponse,
  ReportCertificateStatusRequest,
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
