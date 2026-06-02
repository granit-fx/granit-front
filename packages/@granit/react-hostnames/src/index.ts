// Provider
export { HostnamesProvider, useHostnamesConfig } from './providers/hostnames-provider';
export type {
  HostnamesConfig,
  HostnamesProviderProps,
  ResolvedHostnamesConfig,
} from './providers/hostnames-provider';

// Hooks — queries
export { useHostnames } from './hooks/use-hostnames';
export { useCheckAvailability, useHostname } from './hooks/use-hostname';

// Hooks — mutations
export {
  useClearPrimary,
  useCreateHostname,
  useDeleteHostname,
  useReportCertificateStatus,
  useSetPrimary,
  useVerifyNow,
} from './hooks/use-hostname-mutations';

// Query keys
export { hostnamesKeys } from './hooks/query-keys';
