/**
 * Conformance manifest — one entry per covered module. Extending coverage is a
 * single line here (after vendoring the spec via scripts/sync-openapi-contracts.mjs).
 *
 * `types` lists the per-module DTO interfaces to verify; the spec schema name is
 * assumed identical to the front interface name (the framework naming rule).
 * Shared schemas (query-engine metadata, ProblemDetails, `*Of*` wrapper
 * generics) belong to their owning package and are intentionally not listed here.
 */
export interface ModuleContract {
  /** contracts/openapi/<slug>.json */
  readonly slug: string;
  /** packages/@granit/<package> */
  readonly package: string;
  /** DTO interfaces to check (spec schema name === front interface name). */
  readonly types: readonly string[];
  /**
   * Also verify route/verb conformance: every spec `path`+`method` has a front
   * `client.METHOD()` call at the same route. Opt-in — leave off for modules
   * whose routes are served by native `fetch` (BFF) instead of the Axios client.
   */
  readonly checkEndpoints?: boolean;
  /**
   * Routes (relative to `basePath`, params as `{}`) to skip in the endpoint
   * check — served by the query-engine generic surface (`''` list, `'/meta'`)
   * rather than a module `api/` function.
   */
  readonly endpointIgnore?: readonly string[];
}

export const CONTRACTS: readonly ModuleContract[] = [
  {
    slug: 'background-jobs',
    package: 'background-jobs',
    types: ['BackgroundJobStatus'],
    checkEndpoints: true,
  },
  { slug: 'bff', package: 'bff', types: ['BffCsrfTokenResponse'] },
  {
    // Only the self-service session/device schemas are published; the provider
    // admin + user-cache surfaces are conditionally registered and absent from
    // the generated spec, so they cannot be oracle-checked here.
    slug: 'identity',
    package: 'identity',
    types: ['UserSessionResponse', 'UserDeviceResponse', 'UserSessionsRevokedResponse'],
  },
  {
    slug: 'blob-storage',
    package: 'blob-storage',
    types: [
      'BlobUploadInitiateRequest',
      'BlobUploadInitiateResponse',
      'BlobConfirmUploadRequest',
      'BlobConfirmUploadResponse',
      'BlobDownloadUrlRequest',
      'BlobDownloadUrlResponse',
      'BlobDeleteRequest',
      'BlobDescriptorResponse',
      'BlobCleanupOrphansResponse',
    ],
    checkEndpoints: true,
    endpointIgnore: ['', '/meta'],
  },
  {
    slug: 'api-keys',
    package: 'authentication-api-keys',
    types: [
      'ApiKeyResponse',
      'ApiKeyCreateRequest',
      'ApiKeyCreateResponse',
      'ApiKeyRotateResponse',
      'ApiKeyUpdateScopesRequest',
    ],
    checkEndpoints: true,
    // The list (`/api-keys`) and `/api-keys/meta` are served by the query-engine
    // generic surface (getPage/getQueryMeta), not by a `client.METHOD` call in
    // this module's api/. The module base auto-detects to `/authentication`.
    endpointIgnore: ['/api-keys', '/api-keys/meta'],
  },
  {
    slug: 'ai',
    package: 'ai',
    types: [
      'AIProviderResponse',
      'AIProviderModelResponse',
      'AIChatRequest',
      'AIChatMessageRequest',
      'AIChatResponse',
      'AIChatUsageResponse',
      'AIEmbeddingRequest',
      'AIEmbeddingResponse',
      'AIEmbeddingDataResponse',
      'AIEmbeddingUsageResponse',
      'AIWorkspaceResponse',
      'AIWorkspaceListResponse',
      'AIWorkspaceCreateRequest',
      'AIWorkspaceUpdateRequest',
      'AIModelCapabilities',
      'AIUsageRecord',
    ],
    checkEndpoints: true,
    endpointIgnore: ['/usage', '/usage/meta'],
  },
  {
    slug: 'ai-chat',
    package: 'ai-chat',
    types: [
      'ConversationSummaryResponse',
      'ConversationResponse',
      'MessageResponse',
      'CreateConversationRequest',
      'RenameConversationRequest',
      'SendMessageRequest',
      'MentionRequest',
      'AttachmentRequest',
      'ChatStreamEvent',
      'SuggestedActionResponse',
      'ClarificationResponse',
      'ClarificationOptionResponse',
      'ChatWorkspacesResponse',
    ],
    checkEndpoints: true,
  },
  {
    slug: 'ai-prompts',
    package: 'ai-prompts',
    types: [
      'PromptSummaryResponse',
      'PromptResponse',
      'PromptPickerResponse',
      'PromptPickerCategoryResponse',
      'PromptPickerItemResponse',
      'CreatePromptRequest',
      'UpdatePromptRequest',
    ],
    checkEndpoints: true,
  },
  {
    slug: 'auditing',
    package: 'auditing',
    types: [
      'AuditEntryResponse',
      'AuditEntryDetailResponse',
      'AuditEntityChangeResponse',
      'AuditEntityChangeSummaryResponse',
      'AuditPropertyChangeResponse',
    ],
  },
  {
    slug: 'authorization',
    package: 'authorization',
    types: [
      'MyPermissionsResponse',
      'PermissionDefinitionResponse',
      'PermissionGroupResponse',
      'PermissionGrantResponse',
    ],
  },
  {
    slug: 'features',
    package: 'features',
    types: [
      'FeatureDefinitionResponse',
      'FeatureGroupResponse',
      'FeatureNumericConstraintResponse',
      'FeatureValueResponse',
      'SetFeatureOverrideRequest',
    ],
    checkEndpoints: true,
  },
  // ─── CMS bounded context (granit-website / Granit.Cms.*.Endpoints) ──────────
  // Specs vendored from Granit.Cms.OpenApi.Generator. Object DTOs only — the
  // oracle is a field-by-field checker, so standalone string-union enums
  // (ReleaseStatus, RedirectType, SuggestionStatus, …) are verified indirectly
  // via the fields that reference them, not listed here. Endpoint-route checks
  // are deferred (list/grid surfaces are served by the query-engine generic
  // helper and several routes are X-Granit-Site header-scoped, not a literal
  // api/ client call).
  {
    slug: 'cms',
    package: 'cms',
    types: [
      'SiteResponse',
      'CreateSiteRequest',
      'UpdateSiteRequest',
      'PageResponse',
      'PageTranslation',
      'PageTreeNodeResponse',
      'PageVersionSummaryResponse',
      'PublishedPageResponse',
      'DraftPagePreviewResponse',
      'PageDraftConflictResponse',
      'CreatePageRequest',
      'MovePageRequest',
      'MintPreviewTokenRequest',
      'MintPreviewTokenResponse',
      'PageSearchHitResponse',
      'PageSearchPageResponse',
      'PageEditingPresenceEntryResponse',
      'PageEditingPresenceResponse',
      'MenuResponse',
      'MenuItemResponse',
      'MenuItemRequest',
      'ResolvedMenu',
      'ResolvedMenuItem',
      'ReleaseResponse',
      'ReleaseActionResponse',
      'ReleaseSchedule',
      'CreateReleaseRequest',
      'AddReleaseActionRequest',
      'ScheduleReleaseRequest',
      'BlockCatalogResponse',
      'BlockCategoryGroup',
      'BlockCatalogEntry',
      'BlockFieldDescriptor',
      'BlockFieldOption',
      'BlockDataResolveRequest',
      'BlockDataResponse',
    ],
  },
  {
    slug: 'cms-redirects',
    package: 'cms-redirects',
    types: [
      'RedirectResponse',
      'RedirectCreateRequest',
      'RedirectUpdateRequest',
      'RedirectMutationResult',
      'ResolveResponse',
      'RedirectPreviewResponse',
      'SiteRedirectSettingsRequest',
      'SiteRedirectSettingsResponse',
    ],
  },
  {
    slug: 'cms-seo',
    package: 'cms-seo',
    types: [
      'SeoMetadataResponse',
      'SeoMetadataRequest',
      'EffectiveSeoResponse',
      'SiteSeoDefaultsRequest',
      'SiteSeoDefaultsResponse',
      'OpenGraph',
      'OpenGraphArticle',
      'TwitterCard',
      'OgImage',
      'ImageDimensions',
      'Hreflang',
      'RobotsDirective',
      'RobotsTxtRule',
      'WebManifest',
      'WebManifestIcon',
      'SerpPreviewResponse',
      'SeoSuggestionListResponse',
      'SeoSuggestionDiff',
      'SeoSuggestionFieldDiff',
    ],
  },
  {
    slug: 'cms-hostnames',
    package: 'cms-hostnames',
    types: [
      'SiteHostnameResponse',
      'SiteHostnameAvailabilityResponse',
      'SiteHostnameDnsRecordResponse',
      'SiteHostnameCreateRequest',
    ],
  },
];
