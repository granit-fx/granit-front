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
  useRemoveSiteHostname,
  useVerifySiteHostname,
} from './hooks/use-site-hostname-mutations';

// Re-export the site-scoped CMS hostname types from the core package
export type {
  SiteHostnameAvailabilityResponse,
  SiteHostnameCreateRequest,
  SiteHostnameDnsRecordResponse,
  SiteHostnameDnsRecordType,
  SiteHostnameResponse,
} from '@granit/cms-hostnames';
