// Provider
export { CmsSeoProvider, useCmsSeoConfig } from './providers/cms-seo-provider';
export type {
  CmsSeoConfig,
  ResolvedCmsSeoConfig,
  CmsSeoProviderProps,
} from './providers/cms-seo-provider';

// Query keys
export { cmsSeoKeys } from './hooks/query-keys';

// SEO metadata hooks
export {
  useJsonLdPreview,
  useOgCardPreview,
  useSeoAuditIssues,
  useSeoDefaults,
  useSeoMetadata,
  useSerpPreview,
} from './hooks/use-seo-metadata';

// SEO mutation hooks
export {
  useDeleteSeoMetadata,
  useInvalidateSitemap,
  useUpdateSeoDefaults,
  useUpsertSeoMetadata,
} from './hooks/use-seo-mutations';

// SEO-AI hooks
export {
  useApplySeoSuggestion,
  useRejectSeoSuggestion,
  useSeoSuggestionDiff,
  useSeoSuggestions,
  useSuggestSeo,
  useTriggerBulkSeoAudit,
} from './hooks/use-seo-ai';

// Re-export types from core package
export type {
  ApplySeoAiRequest,
  EffectiveSeoResponse,
  Hreflang,
  OgCardPreviewResponse,
  OgImage,
  OpenGraph,
  OpenGraphArticle,
  PagedResponse,
  RejectSeoAiRequest,
  RobotsDirective,
  SeoAiSuggestRequest,
  SeoAiSuggestResponse,
  SeoAiSuggestionResponse,
  SeoAiSuggestionStatus,
  SeoAuditIssueResponse,
  SeoAuditIssueType,
  SeoMetadataRequest,
  SeoMetadataResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsRequest,
  SiteSeoDefaultsResponse,
  TwitterCard,
} from '@granit/cms-seo';
