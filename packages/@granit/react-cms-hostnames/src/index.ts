// Provider
export { CmsHostnamesProvider, useCmsHostnamesConfig } from './providers/cms-hostnames-provider';
export type {
  CmsHostnamesConfig,
  CmsHostnamesProviderProps,
  ResolvedCmsHostnamesConfig,
} from './providers/cms-hostnames-provider';

// Query keys
export { cmsHostnamesKeys } from './hooks/query-keys';

// Hooks
export { useSiteHostnameAvailability, useSiteHostnames } from './hooks/use-site-hostnames';
export {
  useAddSiteHostname,
  useClearSiteHostnamePrimary,
  useRemoveSiteHostname,
  useSetSiteHostnamePrimary,
  useVerifySiteHostname,
} from './hooks/use-site-hostname-mutations';

// Re-export status enums and types from core packages
export { CertificateStatus, ManagedHostnameStatus } from '@granit/hostnames';
export type {
  CheckAvailabilityResponse,
  CreateManagedHostnameRequest,
  ManagedHostnameResponse,
} from '@granit/hostnames';
