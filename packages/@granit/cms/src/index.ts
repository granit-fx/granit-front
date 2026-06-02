// ─── Types — Public renderer ─────────────────────────────────────────────────
export type {
  BatchResolveDocumentsRequest,
  BlockCatalogEntry,
  BlockCatalogResponse,
  BlockCategoryGroup,
  BlockDataResponse,
  BlockDataResolveRequest,
  BlockFieldDescriptor,
  BlockFieldKind,
  BlockFieldOption,
  BlockRenderSide,
  DraftPagePreviewResponse,
  EffectiveSeoResponse,
  Hreflang,
  MintPreviewTokenRequest,
  MintPreviewTokenResponse,
  MenuTargetKind,
  OgImage,
  OpenGraph,
  OpenGraphArticle,
  PublishedPageResponse,
  RedirectResolveResponse,
  ResolveDocumentItem,
  ResolvedDocumentResponse,
  ResolvedMenu,
  ResolvedMenuItem,
  RobotsDirective,
  TwitterCard,
} from './types/index.js';

// ─── Types — Admin ────────────────────────────────────────────────────────────
export type {
  // Shared
  PagedResponse,
  // Sites
  CreateSiteRequest,
  SiteResponse,
  UpdateSiteRequest,
  // Pages admin
  CreatePageRequest,
  MovePageRequest,
  PageDraftConflictResponse,
  PageResponse,
  PageTranslation,
  PageTreeNodeResponse,
  PageVersionSummaryResponse,
  SaveDraftRequest,
  UpdatePageRequest,
  UpdatePageTranslationRequest,
  // Menus admin
  CreateMenuRequest,
  MenuItemRequest,
  MenuItemResponse,
  MenuResponse,
  UpdateMenuRequest,
  // Releases
  AddReleaseActionRequest,
  CreateReleaseRequest,
  ReleaseActionResponse,
  ReleaseActionStatus,
  ReleaseActionType,
  ReleaseResponse,
  ReleaseSchedule,
  ReleaseStatus,
  ScheduleReleaseRequest,
  UpdateReleaseRequest,
  // SEO admin
  OgCardPreviewResponse,
  SeoAuditIssueResponse,
  SeoAuditIssueType,
  SeoHreflangRequest,
  SeoMetadataRequest,
  SeoMetadataResponse,
  SeoRobotsRequest,
  SerpPreviewResponse,
  SiteSeoDefaultsRequest,
  SiteSeoDefaultsResponse,
  // SEO-AI
  ApplySeoAiRequest,
  RejectSeoAiRequest,
  SeoAiSuggestOutcome,
  SeoAiSuggestRequest,
  SeoAiSuggestResponse,
  SeoAiSuggestionResponse,
  SeoAiSuggestionStatus,
  // Redirects admin
  CreateRedirectRequest,
  RedirectResponse,
  UpdateRedirectRequest,
} from './types/index.js';

// ─── API — Public renderer ────────────────────────────────────────────────────

// Pages
export { getPageByPath, mintPreviewToken, resolvePreview } from './api/pages.js';

// Blocks
export { getBlockCatalog, resolveBlockData } from './api/blocks.js';

// Menus
export { resolveMenu } from './api/menus.js';

// Redirects
export { resolveRedirect } from './api/redirects.js';

// SEO
export { getEffectiveSeo } from './api/seo.js';

// Document Resolution
export { batchResolveDocuments } from './api/documents.js';

// ─── API — Admin ──────────────────────────────────────────────────────────────

// Sites
export { createSite, deleteSite, getSite, listSites, updateSite } from './api/sites.js';
export type { ListSitesParams } from './api/sites.js';

// Pages admin
export {
  createPage,
  deletePage,
  getPage,
  getPageTree,
  listPageVersions,
  listPages,
  movePage,
  publishPage,
  rollbackPage,
  saveDraft,
  unpublishPage,
  updatePage,
  updatePageTranslation,
} from './api/pages-admin.js';
export type { ListPagesParams, SaveDraftResult } from './api/pages-admin.js';

// Menus admin
export {
  createMenu,
  deleteMenu,
  getMenu,
  listMenus,
  updateMenu,
} from './api/menus-admin.js';
export type { ListMenusParams } from './api/menus-admin.js';

// Releases
export {
  addReleaseAction,
  cancelRelease,
  createRelease,
  deleteRelease,
  getRelease,
  listReleases,
  publishRelease,
  removeReleaseAction,
  scheduleRelease,
  updateRelease,
} from './api/releases.js';
export type { ListReleasesParams } from './api/releases.js';

// SEO admin
export {
  deleteSeoMetadata,
  getSeoDefaults,
  getSeoMetadata,
  getSerpPreview,
  getJsonLdPreview,
  getOgCardPreview,
  invalidateSitemap,
  listSeoAuditIssues,
  updateSeoDefaults,
  upsertSeoMetadata,
} from './api/seo-admin.js';
export type { ListSeoMetadataParams } from './api/seo-admin.js';

// SEO-AI
export {
  applySeoSuggestion,
  getSeoSuggestionDiff,
  listSeoSuggestions,
  rejectSeoSuggestion,
  suggestSeo,
  triggerBulkSeoAudit,
} from './api/seo-ai.js';
export type { ListSeoSuggestionsParams } from './api/seo-ai.js';

// Redirects admin
export {
  createRedirect,
  deleteRedirect,
  listRedirects,
  updateRedirect,
} from './api/redirects-admin.js';
export type { ListRedirectsParams } from './api/redirects-admin.js';
