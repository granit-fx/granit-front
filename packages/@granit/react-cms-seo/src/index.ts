// Provider
export { CmsSeoProvider, useCmsSeoConfig } from './providers/cms-seo-provider';
export type {
  CmsSeoConfig,
  ResolvedCmsSeoConfig,
  CmsSeoProviderProps,
} from './providers/cms-seo-provider';

// Query keys
export { cmsSeoKeys } from './hooks/query-keys';
export type { SeoContentKey } from './hooks/query-keys';

// SEO metadata hooks
export {
  useEffectiveSeo,
  useJsonLdPreview,
  useOgCardPreview,
  useSeoDefaults,
  useSeoMetadata,
  useSeoMetadataAudit,
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
  ImageDimensions,
  ListSeoMetadataParams,
  ListSeoSuggestionsParams,
  OgCardPreviewResponse,
  OgImage,
  OpenGraph,
  OpenGraphArticle,
  PagedResult,
  QueryRequest,
  RejectSeoAiRequest,
  RobotsDirective,
  RobotsTxtRule,
  SeoAiSuggestRequest,
  SeoAiSuggestResponse,
  SeoAiSuggestionResponse,
  SeoAuditQuickFilter,
  SeoGenerationOutcome,
  SeoMetadataListItem,
  SeoMetadataPage,
  SeoMetadataRequest,
  SeoMetadataResponse,
  SeoReviewStatus,
  SeoSuggestionDiff,
  SeoSuggestionFieldDiff,
  SeoSuggestionListResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsRequest,
  SiteSeoDefaultsResponse,
  SuggestionScope,
  SuggestionScopeFlag,
  SuggestionStatus,
  TwitterCard,
  WebManifest,
  WebManifestIcon,
} from '@granit/cms-seo';
