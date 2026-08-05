// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  // Shared (audit grid)
  PagedResult,
  QueryMetadata,
  QueryRequest,
  // Domain value objects
  EffectiveSeoResponse,
  Hreflang,
  ImageDimensions,
  OgImage,
  OpenGraph,
  OpenGraphArticle,
  RobotsDirective,
  RobotsTxtRule,
  SeoReviewStatus,
  TwitterCard,
  WebManifest,
  WebManifestIcon,
  // SEO admin
  ListSeoMetadataParams,
  OgPreviewResponse,
  SeoAuditQuickFilter,
  SeoMetadataListItem,
  SeoMetadataPage,
  SeoMetadataRequest,
  SeoMetadataResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsRequest,
  SiteSeoDefaultsResponse,
  // SEO-AI
  SeoSuggestionApplyRequest,
  ListSeoSuggestionsParams,
  SeoSuggestionRejectRequest,
  SeoSuggestRequest,
  SeoSuggestResponse,
  SeoSuggestionResponse,
  SeoGenerationOutcome,
  SeoSuggestionDiffResponse,
  SeoSuggestionFieldDiff,
  SeoSuggestionListResponse,
  SuggestionScope,
  SuggestionScopeFlag,
  SuggestionStatus,
} from './types/index';

// ─── API — Public renderer & anonymous documents ─────────────────────────────
export { getEffectiveSeo, getManifest, getRobotsTxt, getSitemap, getSitemapFile } from './api/seo';
export type { RawDocumentOptions, RawDocumentResult } from './api/seo';

// ─── API — SEO admin ─────────────────────────────────────────────────────────
export {
  deleteSeoMetadata,
  getSeoDefaults,
  getSeoMetadata,
  getSeoMetadataMeta,
  getJsonLdPreview,
  getOgCardPreview,
  getSerpPreview,
  invalidateSitemap,
  listSeoMetadata,
  updateSeoDefaults,
  upsertSeoMetadata,
} from './api/seo-admin';

// ─── API — SEO-AI ─────────────────────────────────────────────────────────────
export {
  applySeoSuggestion,
  getSeoSuggestionDiff,
  listSeoSuggestions,
  rejectSeoSuggestion,
  suggestSeo,
  triggerBulkSeoAudit,
} from './api/seo-ai';

// Validation constraints (generated from contracts/openapi/cms-seo.json)
export { cmsSeoConstraints } from './constraints';
