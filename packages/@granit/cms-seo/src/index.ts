// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  // Shared (audit grid)
  PagedResult,
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
  OgCardPreviewResponse,
  SeoAuditQuickFilter,
  SeoMetadataListItem,
  SeoMetadataPage,
  SeoMetadataRequest,
  SeoMetadataResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsRequest,
  SiteSeoDefaultsResponse,
  // SEO-AI
  ApplySeoAiRequest,
  ListSeoSuggestionsParams,
  RejectSeoAiRequest,
  SeoAiSuggestRequest,
  SeoAiSuggestResponse,
  SeoAiSuggestionResponse,
  SeoGenerationOutcome,
  SeoSuggestionDiff,
  SeoSuggestionFieldDiff,
  SeoSuggestionListResponse,
  SuggestionScope,
  SuggestionScopeFlag,
  SuggestionStatus,
} from './types/index';

// ─── API — Public renderer & anonymous documents ─────────────────────────────
export { getEffectiveSeo, getManifest, getRobotsTxt, getSitemap, getSitemapFile } from './api/seo';

// ─── API — SEO admin ─────────────────────────────────────────────────────────
export {
  deleteSeoMetadata,
  getSeoDefaults,
  getSeoMetadata,
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
