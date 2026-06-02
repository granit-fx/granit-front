// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  // Public / renderer
  EffectiveSeoResponse,
  Hreflang,
  OgImage,
  OpenGraph,
  OpenGraphArticle,
  RobotsDirective,
  TwitterCard,
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
} from './types/index.js';

// ─── API — Public renderer ────────────────────────────────────────────────────
export { getEffectiveSeo } from './api/seo.js';

// ─── API — SEO admin ─────────────────────────────────────────────────────────
export {
  deleteSeoMetadata,
  getSeoDefaults,
  getSeoMetadata,
  getJsonLdPreview,
  getOgCardPreview,
  getSerpPreview,
  invalidateSitemap,
  listSeoAuditIssues,
  updateSeoDefaults,
  upsertSeoMetadata,
} from './api/seo-admin.js';
export type { ListSeoMetadataParams } from './api/seo-admin.js';

// ─── API — SEO-AI ─────────────────────────────────────────────────────────────
export {
  applySeoSuggestion,
  getSeoSuggestionDiff,
  listSeoSuggestions,
  rejectSeoSuggestion,
  suggestSeo,
  triggerBulkSeoAudit,
} from './api/seo-ai.js';
export type { ListSeoSuggestionsParams } from './api/seo-ai.js';
