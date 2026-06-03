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
  // Admin list params
  ListMenusParams,
  ListPagesParams,
  ListReleasesParams,
  ListSitesParams,
  // Admin result types
  SaveDraftResult,
} from './types/index';

// ─── API — Public renderer ────────────────────────────────────────────────────

// Pages
export { getPageByPath, mintPreviewToken, resolvePreview } from './api/pages';

// Blocks
export { getBlockCatalog, resolveBlockData } from './api/blocks';

// Menus
export { resolveMenu } from './api/menus';

// Document Resolution
export { batchResolveDocuments } from './api/documents';

// ─── API — Admin ──────────────────────────────────────────────────────────────

// Sites
export { createSite, deleteSite, getSite, listSites, updateSite } from './api/sites';

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
} from './api/pages-admin';

// Menus admin
export { createMenu, deleteMenu, getMenu, listMenus, updateMenu } from './api/menus-admin';

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
} from './api/releases';
