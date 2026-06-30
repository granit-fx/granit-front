// ─── Types ───────────────────────────────────────────────────────────────────
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
} from './types/index';

// ─── API — Public renderer ────────────────────────────────────────────────────
export { resolveRedirect } from './api/redirects';

// ─── API — Admin ─────────────────────────────────────────────────────────────
export {
  createRedirect,
  deleteRedirect,
  getRedirect,
  getRedirectsGrid,
  getRedirectsGridMeta,
  getRedirectSettings,
  listRedirects,
  previewRedirect,
  updateRedirect,
  updateRedirectSettings,
} from './api/redirects-admin';

// Validation constraints (generated from contracts/openapi/cms-redirects.json)
export { cmsRedirectsConstraints } from './constraints';
