// Types
export {
  CertificateStatus,
  ManagedHostnameStatus,
} from './types/index';

export type {
  CertificateStatusReportRequest,
  CheckAvailabilityResponse,
  CreateManagedHostnameRequest,
  DnsRecordType,
  ExpectedDnsRecord,
  HostnameConflict,
  ListHostnamesParams,
  ManagedHostnameResponse,
  PagedResponse,
  UpdateManagedHostnameRequest,
} from './types/index';

// API
export {
  checkAvailability,
  createHostname,
  deleteHostname,
  getHostname,
  listHostnames,
  reportCertificateStatus,
  updateHostname,
  verifyNow,
} from './api/hostnames-api';

// Permissions
export { HostnamesPermissions } from './permissions';
