// Provider
export { CmsRedirectsProvider, useCmsRedirectsConfig } from './providers/cms-redirects-provider';
export type {
  CmsRedirectsConfig,
  CmsRedirectsProviderProps,
  ResolvedCmsRedirectsConfig,
} from './providers/cms-redirects-provider';

// Query keys
export { cmsRedirectsKeys } from './hooks/query-keys';

// Query hooks
export {
  useRedirect,
  useRedirectPreview,
  useRedirects,
  useRedirectsGrid,
  useRedirectsGridMeta,
  useRedirectSettings,
} from './hooks/use-redirects';

// Mutation hooks
export {
  useCreateRedirect,
  useDeleteRedirect,
  useUpdateRedirect,
  useUpdateRedirectSettings,
} from './hooks/use-redirect-mutations';

// Re-export types from the core package
export type {
  PagedResult,
  PaginationParams,
  QueryMetadata,
  QueryRequest,
  RedirectCreateRequest,
  RedirectMatchType,
  RedirectMutationResult,
  RedirectOrigin,
  RedirectPreviewResponse,
  RedirectResponse,
  RedirectType,
  RedirectUpdateRequest,
  ResolveResponse,
  SiteRedirectSettingsRequest,
  SiteRedirectSettingsResponse,
} from '@granit/cms-redirects';
