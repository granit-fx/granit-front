// Provider
export { CmsRedirectsProvider, useCmsRedirectsConfig } from './providers/cms-redirects-provider';
export type {
  CmsRedirectsConfig,
  CmsRedirectsProviderProps,
  ResolvedCmsRedirectsConfig,
} from './providers/cms-redirects-provider';

// Query keys
export { cmsRedirectsKeys } from './hooks/query-keys';

// Hooks
export { useRedirects } from './hooks/use-redirects';
export {
  useCreateRedirect,
  useDeleteRedirect,
  useUpdateRedirect,
} from './hooks/use-redirect-mutations';

// Re-export types from core package
export type {
  CreateRedirectRequest,
  ListRedirectsParams,
  PagedResponse,
  RedirectResponse,
  RedirectResolveResponse,
  UpdateRedirectRequest,
} from '@granit/cms-redirects';
