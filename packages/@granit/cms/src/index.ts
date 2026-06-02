// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  // Shared
  PagedResponse,
  // Blocks
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
  ResolveDocumentItem,
  ResolvedDocumentResponse,
  // Pages — public
  DraftPagePreviewResponse,
  MintPreviewTokenRequest,
  MintPreviewTokenResponse,
  PublishedPageResponse,
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
  // Menus — public
  MenuTargetKind,
  ResolvedMenu,
  ResolvedMenuItem,
  // Menus admin
  CreateMenuRequest,
  MenuItemRequest,
  MenuItemResponse,
  MenuResponse,
  UpdateMenuRequest,
  // Sites
  CreateSiteRequest,
  SiteResponse,
  UpdateSiteRequest,
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
} from './types/index.js';

// ─── API — Public renderer ────────────────────────────────────────────────────

// Pages
export { getPageByPath, mintPreviewToken, resolvePreview } from './api/pages.js';

// Blocks
export { getBlockCatalog, resolveBlockData } from './api/blocks.js';

// Menus
export { resolveMenu } from './api/menus.js';

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

